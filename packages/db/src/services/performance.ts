import { performance } from 'perf_hooks';

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  startTime: number;
  endTime: number;
  metadata?: Record<string, any>;
}

class PerformanceTracker {
  private operations = new Map<string, number>();
  private metrics: PerformanceMetrics[] = [];

  startOperation(operationId: string): void {
    this.operations.set(operationId, performance.now());
  }

  endOperation(
    operationId: string,
    operation: string,
    metadata?: Record<string, any>
  ): PerformanceMetrics | null {
    const startTime = this.operations.get(operationId);
    if (!startTime) {
      console.warn(`No start time found for operation: ${operationId}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    const metric: PerformanceMetrics = {
      operation,
      duration,
      startTime,
      endTime,
      metadata,
    };

    this.metrics.push(metric);
    this.operations.delete(operationId);

    // Log slow operations (>100ms)
    if (duration > 100) {
      console.warn(`Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`, metadata);
    }

    return metric;
  }

  async measureAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const operationId = `${operation}-${Date.now()}-${Math.random()}`;
    this.startOperation(operationId);

    try {
      const result = await fn();
      this.endOperation(operationId, operation, metadata);
      return result;
    } catch (error) {
      this.endOperation(operationId, operation, { ...metadata, error: true });
      throw error;
    }
  }

  measure<T>(
    operation: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const operationId = `${operation}-${Date.now()}-${Math.random()}`;
    this.startOperation(operationId);

    try {
      const result = fn();
      this.endOperation(operationId, operation, metadata);
      return result;
    } catch (error) {
      this.endOperation(operationId, operation, { ...metadata, error: true });
      throw error;
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getSlowOperations(threshold = 100): PerformanceMetrics[] {
    return this.metrics.filter(metric => metric.duration > threshold);
  }

  getAverageOperationTime(operation: string): number {
    const operationMetrics = this.metrics.filter(m => m.operation === operation);
    if (operationMetrics.length === 0) return 0;

    const totalTime = operationMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    return totalTime / operationMetrics.length;
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  getStats(): Record<string, any> {
    const operations = new Map<string, PerformanceMetrics[]>();

    this.metrics.forEach(metric => {
      if (!operations.has(metric.operation)) {
        operations.set(metric.operation, []);
      }
      operations.get(metric.operation)!.push(metric);
    });

    const stats: Record<string, any> = {};

    operations.forEach((metrics, operation) => {
      const durations = metrics.map(m => m.duration);
      const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);

      stats[operation] = {
        count: metrics.length,
        avgDuration: Number(avg.toFixed(2)),
        minDuration: Number(min.toFixed(2)),
        maxDuration: Number(max.toFixed(2)),
      };
    });

    return stats;
  }
}

export const performanceTracker = new PerformanceTracker();

// Database query performance wrapper
export function withPerformanceTracking<T extends any[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>,
  getMetadata?: (...args: T) => Record<string, any>
) {
  return async (...args: T): Promise<R> => {
    const metadata = getMetadata ? getMetadata(...args) : {};
    return performanceTracker.measureAsync(operation, () => fn(...args), metadata);
  };
}

// React component performance wrapper
export function measureComponentRender<P extends Record<string, any>>(
  componentName: string,
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function MeasuredComponent(props: P) {
    return performanceTracker.measure(
      `render-${componentName}`,
      () => Component(props),
      { propsCount: Object.keys(props).length }
    );
  };
}