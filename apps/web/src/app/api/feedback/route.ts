import {
  createFeedbackHandler,
  type FeedbackData,
} from '@bounty/feedback/server';

const DISCORD_WEBHOOK_URL = process.env.FEEDBACK_WEBHOOK_URL;

// Discord embed limits
const DISCORD_DESCRIPTION_MAX = 4096;
const DISCORD_FIELD_NAME_MAX = 256;
const DISCORD_FIELD_VALUE_MAX = 1024;
const DISCORD_FIELDS_MAX = 25;
const DISCORD_EMBED_TOTAL_CHARS_MAX = 6000;

function truncate(str: string, max: number): string {
  if (str.length <= max) {
    return str;
  }
  return `${str.slice(0, max - 3)}...`;
}

async function sendToDiscordWebhook(data: FeedbackData) {
  if (!DISCORD_WEBHOOK_URL) {
    return;
  }

  const fields: Array<{ name: string; value: string; inline: boolean }> = [
    {
      name: 'Route',
      value: truncate(data.route || 'N/A', DISCORD_FIELD_VALUE_MAX),
      inline: false,
    },
  ];

  if (data.element) {
    fields.push({
      name: 'Component',
      value: data.element.componentName
        ? truncate(
            `\`<${data.element.componentName} />\``,
            DISCORD_FIELD_VALUE_MAX
          )
        : '`Unknown`',
      inline: true,
    });

    if (data.element.selector) {
      fields.push({
        name: 'Selector',
        value: truncate(
          `\`${data.element.selector}\``,
          DISCORD_FIELD_VALUE_MAX
        ),
        inline: true,
      });
    }

    const stack = Array.isArray(data.element.stack) ? data.element.stack : [];

    const sourceFrame = stack[0];
    if (sourceFrame?.fileName) {
      const loc = `${sourceFrame.fileName}${sourceFrame.lineNumber ? `:${sourceFrame.lineNumber}` : ''}`;
      fields.push({
        name: 'Source',
        value: truncate(`\`${loc}\``, DISCORD_FIELD_VALUE_MAX),
        inline: false,
      });
    }

    if (stack.length > 0) {
      const stackStr = stack
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
        value: truncate(`\`\`\`\n${stackStr}\n\`\`\``, DISCORD_FIELD_VALUE_MAX),
        inline: false,
      });
    }
  }

  if (data.prompt) {
    fields.push({
      name: 'Suggested Fix Prompt',
      value: truncate(
        `\`\`\`\n${data.prompt}\n\`\`\``,
        DISCORD_FIELD_VALUE_MAX
      ),
      inline: false,
    });
  }

  if (
    data.metadata &&
    typeof data.metadata === 'object' &&
    !Array.isArray(data.metadata) &&
    Object.keys(data.metadata).length > 0
  ) {
    for (const [key, value] of Object.entries(data.metadata)) {
      fields.push({
        name: truncate(String(key), DISCORD_FIELD_NAME_MAX),
        value: truncate(String(value), DISCORD_FIELD_VALUE_MAX),
        inline: true,
      });
    }
  }

  fields.push({
    name: 'Screenshot',
    value: data.hasScreenshot ? 'Attached' : 'No',
    inline: true,
  });

  // Enforce Discord's max 25 fields limit
  const clampedFields = fields.slice(0, DISCORD_FIELDS_MAX);

  const description = truncate(data.comment, DISCORD_DESCRIPTION_MAX);

  const embed = {
    title: data.element?.componentName
      ? truncate(`Feedback: ${data.element.componentName}`, 256)
      : 'New User Feedback',
    description,
    color: 0x23_23_23,
    fields: clampedFields,
    ...(data.hasScreenshot && data.screenshot
      ? { image: { url: 'attachment://screenshot.png' } }
      : {}),
    footer: { text: 'Feedback System' },
    timestamp: new Date().toISOString(),
  };

  // Enforce total embed character limit (6000)
  let totalChars =
    (embed.title?.length ?? 0) +
    (embed.description?.length ?? 0) +
    (embed.footer?.text?.length ?? 0);
  const finalFields: typeof clampedFields = [];
  for (const field of clampedFields) {
    const fieldChars = field.name.length + field.value.length;
    if (totalChars + fieldChars > DISCORD_EMBED_TOTAL_CHARS_MAX) {
      break;
    }
    totalChars += fieldChars;
    finalFields.push(field);
  }
  embed.fields = finalFields;

  const discordPayload = {
    username: 'Feedback Bot',
    avatar_url: 'https://v0.dev/favicon.ico',
    embeds: [embed],
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
