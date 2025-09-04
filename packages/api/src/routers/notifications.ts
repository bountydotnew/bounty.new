import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router, protectedProcedure } from "../trpc";
import { db, notification } from "@bounty/db";
import { and, count, desc, eq, lt } from "drizzle-orm";
import { sendErrorWebhook, sendInfoWebhook } from "../lib/use-discord-webhook";
import { grim } from "../lib/use-dev-log";

const { info, error, warn } = grim();

const sendWebhookSchema = z.object({
  message: z.string().min(1).max(2000),
  title: z.string().min(1).max(100).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
  type: z.enum(["log", "info", "warning", "error"]).default("log"),
});

const sendErrorSchema = z.object({
  error: z.string().min(1),
  context: z.record(z.string(), z.unknown()).optional(),
  location: z.string().optional(),
});

export const notificationsRouter = router({
  getAll: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
          unreadOnly: z.boolean().default(false),
        })
        .optional()
        .default({})
    )
    .query(async ({ ctx, input }) => {
      const where = input.unreadOnly
        ? and(eq(notification.userId, ctx.session.user.id), eq(notification.read, false))
        : eq(notification.userId, ctx.session.user.id);

      const items = await db.query.notification.findMany({
        where,
        orderBy: [desc(notification.createdAt)],
        limit: input.limit,
        offset: input.offset,
      });
      return items;
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await db
      .select({ count: count() })
      .from(notification)
      .where(and(eq(notification.userId, ctx.session.user.id), eq(notification.read, false)));
    return row?.count ?? 0;
  }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(notification)
        .set({ read: true, updatedAt: new Date() })
        .where(and(eq(notification.id, input.id), eq(notification.userId, ctx.session.user.id)))
        .returning();
      return updated;
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const updated = await db
      .update(notification)
      .set({ read: true, updatedAt: new Date() })
      .where(eq(notification.userId, ctx.session.user.id))
      .returning();
    return updated;
  }),

  cleanup: protectedProcedure
    .input(z.object({ daysToKeep: z.number().min(1).max(365).default(30) }).optional().default({}))
    .mutation(async ({ ctx, input }) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - input.daysToKeep);
      const deleted = await db
        .delete(notification)
        .where(and(eq(notification.userId, ctx.session.user.id), eq(notification.read, true), lt(notification.createdAt, cutoff)))
        .returning();
      return deleted;
    }),
  sendWebhook: publicProcedure
    .input(sendWebhookSchema)
    .mutation(async ({ input }) => {
      try {
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL as string;

        if (!webhookUrl) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Discord webhook not configured",
          });
        }

        info("[sendWebhook] Sending webhook:", {
          type: input.type,
          title: input.title,
        });

        const colorMap = {
          log: 0xffffff,
          info: 0x808080,
          warning: 0xffff00,
          error: 0xff0000,
        };

        const success = await sendInfoWebhook({
          webhookUrl,
          title:
            input.title ||
            `${input.type.charAt(0).toUpperCase() + input.type.slice(1)} from bounty.new`,
          message: input.message,
          context: input.context,
          color: colorMap[input.type],
        });

        if (!success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to send webhook",
          });
        }

        return { success: true, message: "Webhook sent successfully" };
      } catch (err) {
        error("[sendWebhook] Error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send webhook",
        });
      }
    }),

  sendError: publicProcedure
    .input(sendErrorSchema)
    .mutation(async ({ input }) => {
      try {
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL as string;

        if (!webhookUrl) {
          warn("[sendError] Discord webhook not configured");
          return { success: false, message: "Webhook not configured" };
        }

        info("[sendError] Sending error webhook:", {
          location: input.location,
        });

        const success = await sendErrorWebhook({
          webhookUrl,
          error: input.error,
          context: input.context,
          location: input.location,
        });

        return {
          success,
          message: success
            ? "Error webhook sent"
            : "Failed to send error webhook",
        };
      } catch (err) {
        error("[sendError] Error:", err);
        return { success: false, message: "Failed to send error webhook" };
      }
    }),

  testWebhook: publicProcedure.query(async () => {
    try {
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL as string;

      if (!webhookUrl) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Discord webhook not configured",
        });
      }

      info("[testWebhook] Testing webhook connection");

      const success = await sendInfoWebhook({
        webhookUrl,
        title: "🧪 Test Webhook",
        message: "This is a test message from bounty.new tRPC API",
        context: {
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
        },
      });

      if (!success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Webhook test failed",
        });
      }

      return {
        success: true,
        message: "Test webhook sent successfully",
      };
    } catch (err) {
      error("[testWebhook] Error:", err);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to test webhook",
      });
    }
  }),

  // Public webhook test (limited functionality for security)
  testPublicWebhook: publicProcedure.query(async () => {
    try {
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL as string;

      if (!webhookUrl) {
        return {
          success: false,
          message: "Discord webhook not configured",
        };
      }

      // Only test in development, just check config in production
      if (process.env.NODE_ENV === "development") {
        info("[testPublicWebhook] Testing webhook connection (dev mode)");

        const success = await sendInfoWebhook({
          webhookUrl,
          title: "🧪 Public Test Webhook",
          message: "This is a test message from bounty.new public API",
          context: {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
          },
        });

        return {
          success,
          message: success
            ? "Public test webhook sent successfully"
            : "Webhook test failed",
        };
      } else {
        return {
          success: true,
          message: "Webhook configured (production mode - test not sent)",
        };
      }
    } catch (err) {
      error("[testPublicWebhook] Error:", err);
      return {
        success: false,
        message: "Failed to test webhook",
      };
    }
  }),

  // Public endpoint for error reporting (with rate limiting in production)
  reportError: publicProcedure
    .input(
      z.object({
        error: z.string().min(1),
        location: z.string().optional(),
        userAgent: z.string().optional(),
        url: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL as string;

        if (!webhookUrl) {
          warn("[reportError] Discord webhook not configured");
          return { success: false, message: "Error reporting not configured" };
        }

        // Only send to Discord in production
        if (process.env.NODE_ENV === "development") {
          info("[reportError] Reporting client-side error:", {
            location: input.location,
          });

          const success = await sendErrorWebhook({
            webhookUrl,
            error: input.error,
            context: {
              userAgent: input.userAgent,
              url: input.url,
              timestamp: new Date().toISOString(),
              source: "client-side",
            },
            location: input.location || "Unknown",
          });

          return {
            success,
            message: success ? "Error reported" : "Failed to report error",
          };
        } else {
          info(
            "[reportError] Error reported (dev mode - not sent to Discord):",
            input.error,
          );
          return { success: true, message: "Error logged in development" };
        }
      } catch (err) {
        error("[reportError] Error:", err);
        return { success: false, message: "Failed to report error" };
      }
    }),
});
