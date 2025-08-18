"use client";

import React from "react";
import {
  parseMarkdownBlocks,
  partitionAttachments,
  type MarkdownBlock,
} from "./blocks";
import { cn } from "@/lib/utils";
import Image from "next/image";
// using native video for broader host support

type ComposerProps = {
  children: string;
  className?: string;
  render?: Partial<{
    heading: (
      b: Extract<MarkdownBlock, { type: "heading" }>,
    ) => React.ReactNode;
    paragraph: (
      b: Extract<MarkdownBlock, { type: "paragraph" }>,
    ) => React.ReactNode;
    image: (b: Extract<MarkdownBlock, { type: "image" }>) => React.ReactNode;
    video: (b: Extract<MarkdownBlock, { type: "video" }>) => React.ReactNode;
    hr: () => React.ReactNode;
    code: (b: Extract<MarkdownBlock, { type: "code" }>) => React.ReactNode;
  }>;
};

export default function Composer({
  children,
  className,
  render,
}: ComposerProps) {
  const blocks = React.useMemo(
    () => parseMarkdownBlocks(children || ""),
    [children],
  );
  const { main, attachments } = React.useMemo(
    () => partitionAttachments(blocks),
    [blocks],
  );

  const defaultRender = {
    heading: (b: Extract<MarkdownBlock, { type: "heading" }>) =>
      React.createElement(
        `h${b.depth}` as any,
        { className: "font-semibold mt-6 mb-2 text-balance" },
        b.text,
      ),
    paragraph: (b: Extract<MarkdownBlock, { type: "paragraph" }>) => (
      <p className="leading-7">{b.text}</p>
    ),
    image: (b: Extract<MarkdownBlock, { type: "image" }>) => (
      <span className="block overflow-hidden rounded-xl border">
        <Image
          src={b.url}
          alt={b.alt || ""}
          width={1200}
          height={630}
          sizes="(max-width: 768px) 100vw, 800px"
          className="w-full h-auto"
        />
      </span>
    ),
    video: (b: Extract<MarkdownBlock, { type: "video" }>) => (
      <video
        className="w-full h-auto rounded-lg border bg-black"
        controls
        preload="metadata"
        src={`/api/proxy-media?url=${encodeURIComponent(b.url)}`}
      />
    ),
    hr: () => <hr className="my-6 border-muted" />,
    code: (b: Extract<MarkdownBlock, { type: "code" }>) => (
      <pre className="overflow-x-auto rounded-lg border bg-muted p-4 text-sm">
        <code>{b.value}</code>
      </pre>
    ),
  } as const;

  const r = { ...defaultRender, ...(render || {}) };

  return (
    <div
      className={cn("prose prose-zinc dark:prose-invert max-w-none", className)}
    >
      {main.map((b, i) => {
        switch (b.type) {
          case "heading":
            return <React.Fragment key={i}>{r.heading(b)}</React.Fragment>;
          case "paragraph":
            return <React.Fragment key={i}>{r.paragraph(b)}</React.Fragment>;
          case "image":
            return <React.Fragment key={i}>{r.image(b)}</React.Fragment>;
          case "video":
            return <React.Fragment key={i}>{r.video(b)}</React.Fragment>;
          case "hr":
            return <React.Fragment key={i}>{r.hr()}</React.Fragment>;
          case "code":
            return <React.Fragment key={i}>{r.code(b)}</React.Fragment>;
          default:
            return null;
        }
      })}

      {attachments.length > 0 && (
        <div className="mt-6">
          <div className="text-sm text-muted-foreground mb-2">Attachments</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {attachments.map((b, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-md border bg-muted/20"
              >
                {b.type === "image" ? (
                  <Image
                    src={b.url}
                    alt={(b as any).alt || ""}
                    width={320}
                    height={180}
                    sizes="(max-width: 768px) 50vw, 320px"
                    className="w-full h-auto"
                  />
                ) : (
                  <video
                    className="w-full h-auto rounded-lg border bg-black"
                    controls
                    preload="metadata"
                    src={`/api/proxy-media?url=${encodeURIComponent((b as any).url)}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
