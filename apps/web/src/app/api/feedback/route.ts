import { NextResponse } from 'next/server';

const DISCORD_WEBHOOK_URL = process.env.FEEDBACK_WEBHOOK_URL as string;

interface ElementContext {
  componentName: string | null;
  selector: string | null;
  htmlPreview: string;
  stack: Array<{
    functionName: string | null;
    fileName: string | null;
    lineNumber: number | null;
    columnNumber: number | null;
  }>;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const comment = formData.get('comment') as string;
    const route = formData.get('route') as string;
    const prompt = formData.get('prompt') as string | null;
    const elementStr = formData.get('element') as string;
    const screenshot = formData.get('screenshot') as File | null;
    const includeScreenshot = formData.get('includeScreenshot') === 'true';
    const element: ElementContext | null = elementStr
      ? JSON.parse(elementStr)
      : null;

    if (!DISCORD_WEBHOOK_URL) {
      return NextResponse.json(
        { error: 'Webhook URL not configured' },
        { status: 400 }
      );
    }

    // Build the source location string from the stack
    const sourceFrame = element?.stack?.[0];
    const sourceLocation = sourceFrame?.fileName
      ? `${sourceFrame.fileName}${sourceFrame.lineNumber ? `:${sourceFrame.lineNumber}` : ''}${sourceFrame.columnNumber ? `:${sourceFrame.columnNumber}` : ''}`
      : null;

    // Build embed fields
    const fields: Array<{ name: string; value: string; inline: boolean }> = [
      {
        name: 'Route',
        value: route || 'N/A',
        inline: false,
      },
    ];

    // Component info
    if (element) {
      fields.push({
        name: 'Component',
        value: element.componentName
          ? `\`<${element.componentName} />\``
          : '`Unknown`',
        inline: true,
      });

      if (element.selector) {
        fields.push({
          name: 'Selector',
          value: `\`${element.selector}\``,
          inline: true,
        });
      }

      if (sourceLocation) {
        fields.push({
          name: 'Source',
          value: `\`${sourceLocation}\``,
          inline: false,
        });
      }

      // Show the component stack (up to 5 frames)
      if (element.stack && element.stack.length > 0) {
        const stackStr = element.stack
          .slice(0, 5)
          .map((frame) => {
            const name = frame.functionName || 'anonymous';
            const file = frame.fileName ? frame.fileName.split('/').pop() : '?';
            const line = frame.lineNumber ? `:${frame.lineNumber}` : '';
            return `${name} (${file}${line})`;
          })
          .join('\n');
        fields.push({
          name: 'Component Stack',
          value: `\`\`\`\n${stackStr}\n\`\`\``,
          inline: false,
        });
      }
    }

    // Prompt field
    if (prompt?.trim()) {
      fields.push({
        name: 'Suggested Fix Prompt',
        value: `\`\`\`\n${prompt.trim()}\n\`\`\``,
        inline: false,
      });
    }

    fields.push({
      name: 'Screenshot',
      value: includeScreenshot && screenshot ? 'Attached' : 'No',
      inline: true,
    });

    const discordPayload = {
      username: 'Feedback Bot',
      avatar_url: 'https://v0.dev/favicon.ico',
      embeds: [
        {
          title: element?.componentName
            ? `Feedback: ${element.componentName}`
            : 'New User Feedback',
          description: comment,
          color: 0x23_23_23,
          fields,
          ...(includeScreenshot &&
            screenshot && {
              image: {
                url: 'attachment://screenshot.png',
              },
            }),
          footer: {
            text: 'Feedback System',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const discordFormData = new FormData();
    discordFormData.append('payload_json', JSON.stringify(discordPayload));

    if (screenshot && includeScreenshot) {
      discordFormData.append('file', screenshot, 'screenshot.png');
    }

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      body: discordFormData,
    });

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.statusText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending feedback:', error);
    return NextResponse.json(
      { error: 'Failed to send feedback' },
      { status: 500 }
    );
  }
}
