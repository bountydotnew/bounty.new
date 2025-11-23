import { NextResponse } from "next/server"

const DISCORD_WEBHOOK_URL =
  process.env.FEEDBACK_WEBHOOK_URL ||
  "https://discord.com/api/webhooks/1441983688421281954/ios8LHlLEQdYwOM5jKhDOzIhuIZqg_QsPCKJmVJ_5453ljHnJsPWfzo-jqlyH3gK_z9d"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const comment = formData.get("comment") as string
    const route = formData.get("route") as string
    const elementStr = formData.get("element") as string
    const screenshot = formData.get("screenshot") as File | null
    const includeScreenshot = formData.get("includeScreenshot") === "true"
    const element = elementStr ? JSON.parse(elementStr) : null

    if (!DISCORD_WEBHOOK_URL) {
      return NextResponse.json({ error: "Webhook URL not configured" }, { status: 500 })
    }

    const discordPayload = {
      username: "Feedback Bot",
      avatar_url: "https://v0.dev/favicon.ico",
      embeds: [
        {
          title: "New User Feedback",
          description: comment,
          color: 15099648, // #E66700
          fields: [
            {
              name: "Route",
              value: route,
              inline: false,
            },
            {
              name: "Element",
              value: `\`${element?.tagName?.toLowerCase() || "N/A"}\``,
              inline: true,
            },
            {
              name: "ID",
              value: element?.id ? `\`#${element.id}\`` : "None",
              inline: true,
            },
            {
              name: "Classes",
              value: element?.className ? `\`${element.className}\`` : "None",
              inline: false,
            },
            {
              name: "Screenshot Included",
              value: includeScreenshot && screenshot ? "Yes" : "No",
              inline: true,
            },
          ],
          ...(includeScreenshot && screenshot && {
            image: {
              url: "attachment://screenshot.png",
            },
          }),
          footer: {
            text: "Feedback System",
          },
          timestamp: new Date().toISOString(),
        },
      ],
    }

    // Discord Webhook with File Upload requires multipart/form-data
    // We construct a new FormData to send to Discord
    const discordFormData = new FormData()
    discordFormData.append("payload_json", JSON.stringify(discordPayload))

    // Only append screenshot if user opted to include it
    if (screenshot && includeScreenshot) {
      discordFormData.append("file", screenshot, "screenshot.png")
    }

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      body: discordFormData,
    })

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.statusText}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending feedback:", error)
    return NextResponse.json({ error: "Failed to send feedback" }, { status: 500 })
  }
}
