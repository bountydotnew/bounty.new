import { unified } from 'unified';
import remarkParse from 'remark-parse';

export type MarkdownBlock =
  | { type: 'heading'; depth: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'image'; url: string; alt?: string }
  | { type: 'video'; url: string }
  | { type: 'hr' }
  | { type: 'code'; lang?: string; value: string };

const isImageUrl = (t: string) => /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(t);
const isVideoUrl = (t: string) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(t) || /^https?:\/\/github\.com\/user-attachments\/assets\//i.test(t) || /^https?:\/\/user-attachments\.githubusercontent\.com\//i.test(t);

function textFrom(node: any): string {
  if (!node) return '';
  if (typeof node.value === 'string') return node.value;
  if (Array.isArray(node.children)) return node.children.map(textFrom).join('');
  return '';
}

export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const tree: any = unified().use(remarkParse).parse(markdown || '');
  const out: MarkdownBlock[] = [];
  for (const node of tree.children || []) {
    switch (node.type) {
      case 'heading':
        out.push({ type: 'heading', depth: Math.min(6, Math.max(1, node.depth)) as any, text: textFrom(node) });
        break;
      case 'thematicBreak':
        out.push({ type: 'hr' });
        break;
      case 'code':
        out.push({ type: 'code', lang: node.lang || undefined, value: node.value || '' });
        break;
      case 'paragraph': {
        // Detect pure media paragraphs
        if (node.children?.length === 1) {
          const c = node.children[0];
          if (c.type === 'image' && typeof c.url === 'string') {
            out.push({ type: 'image', url: c.url, alt: c.alt });
            break;
          }
          if (c.type === 'link' && typeof c.url === 'string') {
            const href = c.url as string;
            if (isImageUrl(href)) { out.push({ type: 'image', url: href }); break; }
            if (isVideoUrl(href)) { out.push({ type: 'video', url: href }); break; }
          }
          if (c.type === 'text' && typeof c.value === 'string') {
            const t = c.value.trim();
            if (isImageUrl(t)) { out.push({ type: 'image', url: t }); break; }
            if (isVideoUrl(t)) { out.push({ type: 'video', url: t }); break; }
          }
        }
        out.push({ type: 'paragraph', text: textFrom(node) });
        break;
      }
      case 'image':
        if (typeof node.url === 'string') out.push({ type: 'image', url: node.url, alt: node.alt });
        break;
      case 'link':
        if (typeof node.url === 'string') {
          if (isImageUrl(node.url)) { out.push({ type: 'image', url: node.url }); break; }
          if (isVideoUrl(node.url)) { out.push({ type: 'video', url: node.url }); break; }
        }
        out.push({ type: 'paragraph', text: textFrom(node) });
        break;
      default:
        // Fallback to text if any
        const txt = textFrom(node);
        if (txt.trim()) out.push({ type: 'paragraph', text: txt });
    }
  }
  return out;
}

export type MediaBlock = Extract<MarkdownBlock, { type: 'image' } | { type: 'video' }>;

export function partitionAttachments(blocks: MarkdownBlock[]): { main: MarkdownBlock[]; attachments: MediaBlock[] } {
  const main: MarkdownBlock[] = [];
  const attachments: MediaBlock[] = [];
  for (const b of blocks) {
    if (b.type === 'image' || b.type === 'video') attachments.push(b as MediaBlock);
    else main.push(b);
  }
  return { main, attachments };
}


