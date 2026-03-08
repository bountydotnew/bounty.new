import { createFeedbackHandler, type FeedbackData } from '@bounty/feedback/server';

const DISCORD_WEBHOOK_URL = process.env.FEEDBACK_WEBHOOK_URL;

async function sendToDiscordWebhook(data: FeedbackData) {
  if (!DISCORD_WEBHOOK_URL) return;

  const fields: Array<{ name: string; value: string; inline: boolean }> = [
    { name: 'Route', value: data.route || 'N/A', inline: false },
  ];

  if (data.element) {
    fields.push({
      name: 'Component',
      value: data.element.componentName
        ? `\`<${data.element.componentName} />\``
        : '`Unknown`',
      inline: true,
    });

    if (data.element.selector) {
      fields.push({
        name: 'Selector',
        value: `\`${data.element.selector}\``,
        inline: true,
      });
    }

    const sourceFrame = data.element.stack?.[0];
    if (sourceFrame?.fileName) {
      const loc = `${sourceFrame.fileName}${sourceFrame.lineNumber ? `:${sourceFrame.lineNumber}` : ''}`;
      fields.push({ name: 'Source', value: `\`${loc}\``, inline: false });
    }

    if (data.element.stack?.length) {
      const stackStr = data.element.stack
        .slice(0, 5)
        .map((f) => {
          const name = f.functionName || 'anonymous';
          const file = f.fileName?.split('/').pop() ?? '?';
          const line = f.lineNumber ? `:${f.lineNumber}` : '';
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

  if (data.prompt) {
    fields.push({
      name: 'Suggested Fix Prompt',
      value: `\`\`\`\n${data.prompt}\n\`\`\``,
      inline: false,
    });
  }

  if (data.metadata && Object.keys(data.metadata).length > 0) {
    for (const [key, value] of Object.entries(data.metadata)) {
      fields.push({ name: key, value, inline: true });
    }
  }

  fields.push({
    name: 'Screenshot',
    value: data.hasScreenshot ? 'Attached' : 'No',
    inline: true,
  });

  const discordPayload = {
    username: 'Feedback Bot',
    avatar_url: 'https://v0.dev/favicon.ico',
    embeds: [
      {
        title: data.element?.componentName
          ? `Feedback: ${data.element.componentName}`
          : 'New User Feedback',
        description: data.comment,
        color: 0x23_23_23,
        fields,
        ...(data.hasScreenshot && data.screenshot
          ? { image: { url: 'attachment://screenshot.png' } }
          : {}),
        footer: { text: 'Feedback System' },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const formData = new FormData();
  formData.append('payload_json', JSON.stringify(discordPayload));

  if (data.screenshot) {
    const arrayBuffer = await data.screenshot.arrayBuffer();
    formData.append(
      'file',
      new Blob([arrayBuffer], { type: 'image/png' }),
      'screenshot.png'
    );
  }

  const res = await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    console.error(`[feedback] Discord webhook error: ${res.statusText}`);
  }
}

export const POST = createFeedbackHandler({
  adapters: {},
  channels: [],
  onFeedback: sendToDiscordWebhook,
});
