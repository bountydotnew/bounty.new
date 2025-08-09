"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import {
    VideoPlayer,
    VideoPlayerContent,
    VideoPlayerControlBar,
    VideoPlayerMuteButton,
    VideoPlayerPlayButton,
    VideoPlayerSeekBackwardButton,
    VideoPlayerSeekForwardButton,
    VideoPlayerTimeDisplay,
    VideoPlayerTimeRange,
    VideoPlayerVolumeRange,
} from '@/components/ui/kibo-ui/video-player';
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

type MarkdownProps = {
    children: string;
    className?: string;
};

export default function Markdown({ children, className }: MarkdownProps) {
    const { displayMd, attachments } = React.useMemo(() => {
        const lines = children.split(/\r?\n/);
        const atts: string[] = [];
        const isImgUrl = (t: string) => /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(t);
        const isGhAttachment = (t: string) => /^https?:\/\/github\.com\/user-attachments\/assets\/[A-Za-z0-9-]+$/i.test(t) || /^https?:\/\/user-attachments\.githubusercontent\.com\//i.test(t);
        const kept: string[] = [];
        for (const raw of lines) {
            const t = raw.trim();
            if (t && (isImgUrl(t) || isGhAttachment(t))) {
                atts.push(t);
            } else {
                kept.push(raw);
            }
        }
        return { displayMd: kept.join("\n"), attachments: atts };
    }, [children]);
    return (
        <div
            className={cn(
                "prose prose-zinc dark:prose-invert max-w-none prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-a:no-underline hover:prose-a:underline",
                className
            )}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSlug]}
                components={{
                    a: ({ node, href, children, ...props }) => {
                        const url = typeof href === "string" ? href : "";
                        return (
                            <a href={url} {...props} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-foreground hover:text-foreground/80">
                                <LinkIcon className="h-3.5 w-3.5" />
                                <span>{children}</span>
                            </a>
                        );
                    },
                    h1: ({ children, ...props }) => (
                        <h1 {...props} className="scroll-mt-24">
                            {children}
                        </h1>
                    ),
                    h2: ({ children, ...props }) => (
                        <h2 {...props} className="scroll-mt-24">
                            {children}
                        </h2>
                    ),
                    h3: ({ children, ...props }) => (
                        <h3 {...props} className="scroll-mt-24">
                            {children}
                        </h3>
                    ),
                    h4: ({ children, ...props }) => (
                        <h4 {...props} className="scroll-mt-24">
                            {children}
                        </h4>
                    ),
                    h5: ({ children, ...props }) => (
                        <h5 {...props} className="scroll-mt-24">
                            {children}
                        </h5>
                    ),
                    h6: ({ children, ...props }) => (
                        <h6 {...props} className="scroll-mt-24">
                            {children}
                        </h6>
                    ),
                    img: ({ src, alt, ...props }) => {
                        const url = typeof src === "string" ? src : "";
                        if (!url) return null;
                        return (
                            <span className="block overflow-hidden rounded-xl border">
                                <Image
                                    src={url as string}
                                    alt={alt || ""}
                                    width={1200}
                                    height={630}
                                    sizes="(max-width: 768px) 100vw, 800px"
                                    className="w-full h-auto"
                                />
                            </span>
                        );
                    },
                    code: ({ inline, children, ...props }: any) => {
                        if (inline) {
                            return (
                                <code {...props} className="px-1 py-0.5 rounded bg-muted text-muted-foreground">
                                    {children}
                                </code>
                            );
                        }
                        return (
                            <pre className="overflow-x-auto rounded-lg border bg-muted p-4 text-sm">
                                <code {...props}>{children}</code>
                            </pre>
                        );
                    },
                    blockquote: ({ children, ...props }) => (
                        <blockquote {...props} className="border-l-2 pl-4 italic text-muted-foreground">
                            {children}
                        </blockquote>
                    ),
                    ul: ({ children, ...props }) => (
                        <ul {...props} className="list-disc pl-6">
                            {children}
                        </ul>
                    ),
                    ol: ({ children, ...props }) => (
                        <ol {...props} className="list-decimal pl-6">
                            {children}
                        </ol>
                    ),
                    table: ({ children, ...props }) => (
                        <div className="overflow-x-auto">
                            <table {...props} className="w-full border-collapse">
                                {children}
                            </table>
                        </div>
                    ),
                    th: ({ children, ...props }) => (
                        <th {...props} className="border px-2 py-1 text-left bg-muted/50">
                            {children}
                        </th>
                    ),
                    td: ({ children, ...props }) => (
                        <td {...props} className="border px-2 py-1">
                            {children}
                        </td>
                    ),
                    hr: (props) => <hr {...props} className="my-6 border-muted" />,
                    p: ({ children, ...props }) => {
                        const only = Array.isArray(children) && children.length === 1 ? children[0] : null;
                        if (typeof only === "string") {
                            const text = only.trim();
                            const isImageUrl = /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(text);
                            const isGithubAttachment = /^https?:\/\/github\.com\/user-attachments\/assets\/[A-Za-z0-9-]+$/i.test(text) || /^https?:\/\/user-attachments\.githubusercontent\.com\//i.test(text);
                            if (isImageUrl) {
                                return (
                                    <span className="block overflow-hidden rounded-xl border">
                                        <Image
                                            src={text as string}
                                            alt=""
                                            width={640}
                                            height={360}
                                            sizes="(max-width: 768px) 100vw, 640px"
                                            className="w-full h-auto"
                                        />
                                    </span>
                                );
                            }
                            if (isGithubAttachment) {
                                return null;
                            }
                        }
                        return (
                            <p {...props} className="leading-7">
                                {children}
                            </p>
                        );
                    },
                    span: ({ children, ...props }) => (
                        <span {...props}>{children}</span>
                    ),
                }}
            >
                {displayMd}
            </ReactMarkdown>
            {attachments.length > 0 && (
                <div className="mt-6">
                    <div className="text-sm text-muted-foreground mb-2">Attachments</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {attachments.map((url) => {
                            const isImage = /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url);
                            return (
                                <div key={url} className="overflow-hidden rounded-md border bg-muted/20">
                                    {isImage ? (
                                        <Image
                                            src={url}
                                            alt="attachment image"
                                            width={320}
                                            height={180}
                                            sizes="(max-width: 768px) 50vw, 320px"
                                            className="w-full h-auto"
                                        />
                                    ) : (
                                        <VideoPlayer className="overflow-hidden rounded-lg border">
                                            <VideoPlayerContent
                                                crossOrigin=""
                                                muted
                                                preload="auto"
                                                slot="media"
                                                src={`/api/proxy-media?url=${encodeURIComponent(url)}`}
                                            />
                                            <VideoPlayerControlBar>
                                                <VideoPlayerPlayButton />
                                                <VideoPlayerSeekBackwardButton />
                                                <VideoPlayerSeekForwardButton />
                                                <VideoPlayerTimeRange />
                                                <VideoPlayerTimeDisplay showDuration />
                                                <VideoPlayerMuteButton />
                                                <VideoPlayerVolumeRange />
                                            </VideoPlayerControlBar>
                                        </VideoPlayer>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}


