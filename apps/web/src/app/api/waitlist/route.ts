import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateFingerprint } from "@/lib/fingerprint-validation";
import { grim } from "@/hooks/use-dev-log";

const { log, error, warn } = grim();

const requestSchema = z.object({
  email: z.string().email("Invalid email format"),
  fingerprintData: z.object({
    thumbmark: z.string(),
    components: z.record(z.any()),
    info: z.record(z.any()).optional(),
    version: z.string().optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error.errors[0]?.message || "Invalid request data",
          success: false,
        },
        { status: 400 }
      );
    }

    const { email, fingerprintData } = validation.data;

    log("[Waitlist] Processing request for email:", email);

    const fingerprintValidation = validateFingerprint(fingerprintData);
    if (!fingerprintValidation.isValid) {
      log("[Waitlist] Fingerprint validation failed:", fingerprintValidation.errors);
      return NextResponse.json(
        {
          error: "Invalid device fingerprint: " + fingerprintValidation.errors.join(", "),
          success: false,
        },
        { status: 400 }
      );
    }

    try {
      const serverUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

      const payload = { email };
      log("[Waitlist] Sending tRPC request with payload:", JSON.stringify(payload));

      const response = await fetch(`${serverUrl}/trpc/earlyAccess.addToWaitlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      log("[Waitlist] tRPC response:", JSON.stringify(responseData));

      if (response.ok) {
        log("[Waitlist] Successfully added email to waitlist:", email);
        return NextResponse.json({
          success: true,
          message: "Successfully added to waitlist!",
        });
      } else {
        warn("[Waitlist] Failed to save to database:", response.status, responseData);
        return NextResponse.json(
          {
            error: "Failed to add to waitlist",
            success: false,
          },
          { status: 500 }
        );
      }
    } catch (dbConnectionError) {
      error("[Waitlist] Database connection error:", dbConnectionError);
      return NextResponse.json(
        {
          error: "Database temporarily unavailable",
          success: false,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    warn("[Waitlist] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        success: false,
      },
      { status: 500 }
    );
  }
}
