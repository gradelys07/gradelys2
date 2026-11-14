"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import {
  ChatPythonBlock,
  ChatChartBlock,
  ChatMermaidBlock,
  ChatImageGallery,
  ChatYouTubeEmbed,
} from "@/components/chat/chat-rich-blocks";

function extractTextFromHast(node: any): string {
  if (!node) return "";
  if (node.type === "text" && typeof node.value === "string") return node.value;
  if (Array.isArray(node.children)) {
    return node.children.map(extractTextFromHast).join("");
  }
  return "";
}

function getCodeLanguage(codeEl: any): string | null {
  const cls = codeEl?.properties?.className;
  const classes = Array.isArray(cls) ? cls : typeof cls === "string" ? cls.split(/\s+/) : [];
  for (const c of classes) {
    const m = String(c).match(/^language-([a-z0-9_-]+)$/i);
    if (m) return m[1].toLowerCase();
  }
  return null;
}

function MarkdownImage({
  src,
  alt,
  className,
}: {
  src?: string;
  alt?: string;
  className?: string;
}) {
  const [broken, setBroken] = React.useState(false);
  if (!src || broken) return null;

  return (
    <span className="my-3 block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt || "Illustration"}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setBroken(true)}
        className={cn("mx-auto max-h-[420px] rounded-xl border border-border-subtle object-contain", className)}
      />
      {alt && (
        <span className="mt-1.5 block text-center text-xs text-text-muted">{alt}</span>
      )}
    </span>
  );
}

export function Markdown({
  content,
  className,
  conversationId,
  isStreaming = false,
}: {
  content: string;
  className?: string;
  conversationId?: string;
  isStreaming?: boolean;
}) {
  const instanceId = React.useId().replace(/:/g, "");

  return (
    <div className={cn("prose-gradelys", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeHighlight, rehypeKatex]}
        components={{
          pre({ node, children, ...props }) {
            const codeEl = Array.isArray(node?.children)
              ? node.children.find((c: any) => c?.type === "element" && c?.tagName === "code")
              : undefined;

            const lang = getCodeLanguage(codeEl);
            if (lang) {
              const rawCode = extractTextFromHast(codeEl).replace(/\n$/, "");
              const offset = codeEl?.position?.start?.offset ?? node?.position?.start?.offset ?? 0;
              const blockId = `${conversationId || "global"}-${instanceId}-${lang}-${offset}`;

              if (lang === "python" || lang === "python-plot" || lang === "py") {
                return (
                  <ChatPythonBlock
                    id={blockId}
                    code={rawCode}
                    conversationId={conversationId}
                    isStreaming={isStreaming}
                    autoRun={lang === "python-plot" ? true : undefined}
                  />
                );
              }
              if (lang === "chart" || lang === "json-chart") {
                return (
                  <ChatChartBlock
                    id={blockId}
                    code={rawCode}
                    conversationId={conversationId}
                    isStreaming={isStreaming}
                  />
                );
              }
              if (lang === "mermaid") {
                return (
                  <ChatMermaidBlock
                    id={blockId}
                    code={rawCode}
                    conversationId={conversationId}
                    isStreaming={isStreaming}
                  />
                );
              }
              if (lang === "images" || lang === "gallery" || lang === "photos") {
                return (
                  <ChatImageGallery
                    id={blockId}
                    raw={rawCode}
                    conversationId={conversationId}
                    isStreaming={isStreaming}
                  />
                );
              }
              if (lang === "youtube" || lang === "video" || lang === "videos") {
                return (
                  <ChatYouTubeEmbed
                    id={blockId}
                    raw={rawCode}
                    conversationId={conversationId}
                    isStreaming={isStreaming}
                  />
                );
              }
            }

            return <pre {...props}>{children}</pre>;
          },
          img({ src, alt, className: imgClass }) {
            return <MarkdownImage src={src} alt={alt} className={imgClass} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
