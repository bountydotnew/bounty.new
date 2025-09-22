import { sql } from 'drizzle-orm';
import { db } from '../index';

export interface QueryAnalysis {
  queryText: string;
  executionTime: number;
  planCost: number;
  rowsReturned: number;
  indexes: string[];
  recommendations: string[];
}

export class QueryOptimizer {
  private queryCache = new Map<string, any>();
  private queryStats = new Map<string, { count: number; totalTime: number }>();

  async analyzeQuery(queryText: string): Promise<QueryAnalysis> {
    try {
      // Get query plan
      const planResult = await db.execute(sql`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql.raw(queryText)}`);
      const plan = planResult.rows[0] as any;

      const executionTime = plan['Execution Time'] || 0;
      const planCost = plan['Plan']?.['Total Cost'] || 0;
      const rowsReturned = plan['Plan']?.['Actual Rows'] || 0;

      // Extract index usage information
      const indexes = this.extractIndexes(plan['Plan']);

      // Generate recommendations
      const recommendations = this.generateRecommendations(plan['Plan']);

      return {
        queryText,
        executionTime,
        planCost,
        rowsReturned,
        indexes,
        recommendations,
      };
    } catch (error) {
      console.error('Failed to analyze query:', error);
      return {
        queryText,
        executionTime: 0,
        planCost: 0,
        rowsReturned: 0,
        indexes: [],
        recommendations: ['Query analysis failed'],
      };
    }
  }

  private extractIndexes(plan: any): string[] {
    const indexes: string[] = [];

    if (plan['Index Name']) {
      indexes.push(plan['Index Name']);
    }

    if (plan['Plans']) {
      plan['Plans'].forEach((childPlan: any) => {
        indexes.push(...this.extractIndexes(childPlan));
      });
    }

    return [...new Set(indexes)];
  }

  private generateRecommendations(plan: any): string[] {
    const recommendations: string[] = [];

    // Check for sequential scans on large tables
    if (plan['Node Type'] === 'Seq Scan' && (plan['Actual Rows'] || 0) > 1000) {
      recommendations.push(`Consider adding an index for the sequential scan on ${plan['Relation Name']}`);
    }

    // Check for expensive sorts
    if (plan['Node Type'] === 'Sort' && (plan['Total Cost'] || 0) > 1000) {
      recommendations.push('Consider adding an index to avoid expensive sorting');
    }

    // Check for nested loops with high cost
    if (plan['Node Type'] === 'Nested Loop' && (plan['Total Cost'] || 0) > 5000) {
      recommendations.push('Consider optimizing the nested loop join with better indexes');
    }

    // Recursively check child plans
    if (plan['Plans']) {
      plan['Plans'].forEach((childPlan: any) => {
        recommendations.push(...this.generateRecommendations(childPlan));
      });
    }

    return recommendations;
  }

  trackQuery(queryId: string, executionTime: number): void {
    const existing = this.queryStats.get(queryId);
    if (existing) {
      this.queryStats.set(queryId, {
        count: existing.count + 1,
        totalTime: existing.totalTime + executionTime,
      });
    } else {
      this.queryStats.set(queryId, {
        count: 1,
        totalTime: executionTime,
      });
    }
  }

  getSlowQueries(threshold = 100): Array<{ queryId: string; avgTime: number; count: number }> {
    const slowQueries: Array<{ queryId: string; avgTime: number; count: number }> = [];

    this.queryStats.forEach((stats, queryId) => {
      const avgTime = stats.totalTime / stats.count;
      if (avgTime > threshold) {
        slowQueries.push({ queryId, avgTime, count: stats.count });
      }
    });

    return slowQueries.sort((a, b) => b.avgTime - a.avgTime);
  }

  async suggestIndexes(): Promise<string[]> {
    try {
      // Get missing index suggestions from PostgreSQL
      const result = await db.execute(sql`
        SELECT
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats
        WHERE schemaname = 'public'
        AND n_distinct > 100
        ORDER BY n_distinct DESC
        LIMIT 10
      `);

      const suggestions = result.rows.map((row: any) =>
        `CREATE INDEX idx_${row.tablename}_${row.attname} ON ${row.tablename} (${row.attname});`
      );

      return suggestions;
    } catch (error) {
      console.error('Failed to generate index suggestions:', error);
      return [];
    }
  }

  async getTableStats(): Promise<Record<string, any>> {
    try {
      const result = await db.execute(sql`
        SELECT
          schemaname,
          tablename,
          n_live_tup as row_count,
          n_dead_tup as dead_rows,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY n_live_tup DESC
      `);

      const stats: Record<string, any> = {};
      result.rows.forEach((row: any) => {
        stats[row.tablename] = {
          rowCount: row.row_count,
          deadRows: row.dead_rows,
          lastVacuum: row.last_vacuum,
          lastAutoVacuum: row.last_autovacuum,
          lastAnalyze: row.last_analyze,
          lastAutoAnalyze: row.last_autoanalyze,
        };
      });

      return stats;
    } catch (error) {
      console.error('Failed to get table stats:', error);
      return {};
    }
  }

  clearCache(): void {
    this.queryCache.clear();
  }

  clearStats(): void {
    this.queryStats.clear();
  }
}

export const queryOptimizer = new QueryOptimizer();