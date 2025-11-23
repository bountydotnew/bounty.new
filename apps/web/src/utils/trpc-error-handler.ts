import * as Sentry from "@sentry/nextjs";
import { TRPCClientError } from "@trpc/client";
import type { AppRouter } from "@bounty/api";
import { toast } from "sonner";

/**
 * Handle tRPC errors with Sentry logging and user-friendly messages
 */
export function handleTRPCError(
  error: unknown,
  customMessage?: string,
): string {
  let errorMessage = customMessage || "Something went wrong";

  if (error instanceof TRPCClientError) {
    // Extract error details
    const { message, data, shape } = error;

    // Get user-friendly message based on error code
    if (shape?.code === "UNAUTHORIZED") {
      errorMessage = "You need to be logged in to do that";
    } else if (shape?.code === "FORBIDDEN") {
      errorMessage = "You don't have permission to do that";
    } else if (shape?.code === "NOT_FOUND") {
      errorMessage = "The requested resource was not found";
    } else if (shape?.code === "BAD_REQUEST") {
      errorMessage = message || "Invalid request";
    } else if (shape?.code === "CONFLICT") {
      errorMessage = message || "This action conflicts with existing data";
    } else if (shape?.code === "INTERNAL_SERVER_ERROR") {
      errorMessage = "Server error. Please try again later.";
    } else {
      errorMessage = message || errorMessage;
    }

    // Log to Sentry for non-auth errors
    if (shape?.code !== "UNAUTHORIZED") {
      Sentry.captureException(error, {
        tags: {
          errorType: "trpc",
          errorCode: shape?.code,
        },
        extra: {
          path: shape?.path,
          data,
        },
      });
    }
  } else if (error instanceof Error) {
    errorMessage = error.message || errorMessage;
    Sentry.captureException(error, {
      tags: {
        errorType: "unknown",
      },
    });
  }

  return errorMessage;
}

/**
 * Show tRPC error as a toast notification
 */
export function showTRPCErrorToast(error: unknown, customMessage?: string) {
  const message = handleTRPCError(error, customMessage);
  toast.error(message);
}

/**
 * Get user-friendly error message from tRPC error
 */
export function getTRPCErrorMessage(error: unknown): string {
  if (error instanceof TRPCClientError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

/**
 * Check if error is a specific tRPC error code
 */
export function isTRPCErrorCode<T extends AppRouter>(
  error: unknown,
  code: string,
): error is TRPCClientError<T> {
  return (
    error instanceof TRPCClientError &&
    error.shape?.code === code
  );
}
