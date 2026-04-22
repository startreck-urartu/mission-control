"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export function FormattedResult({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div className={cn("formatted-result text-sm text-gray-300 leading-relaxed", className)}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-base font-bold text-gray-100 mt-4 mb-2 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-semibold text-gray-200 mt-3 mb-1.5 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-medium text-gray-300 mt-2 mb-1 first:mt-0">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="mb-2 last:mb-0">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-4 mb-2 space-y-0.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-4 mb-2 space-y-0.5">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-400">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-200">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-400">{children}</em>
          ),
          code: ({ children, className: codeClassName }) => {
            const isInline = !codeClassName;
            return isInline ? (
              <code className="px-1 py-0.5 rounded bg-white/[0.06] text-amber-300 text-xs font-mono">{children}</code>
            ) : (
              <code className={cn("block p-3 rounded-lg bg-white/[0.04] text-xs font-mono text-gray-300 overflow-x-auto mb-2", codeClassName)}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="p-3 rounded-lg bg-white/[0.04] text-xs font-mono text-gray-300 overflow-x-auto mb-2">{children}</pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-blue-500/40 pl-3 my-2 text-gray-400 italic">{children}</blockquote>
          ),
          hr: () => (
            <hr className="border-white/[0.06] my-3" />
          ),
          a: ({ href, children }) => (
            <a href={href} className="text-blue-400 hover:text-blue-300 underline underline-offset-2" target="_blank" rel="noopener noreferrer">{children}</a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="w-full text-xs border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-white/[0.08]">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-2 py-1.5 text-left font-medium text-gray-300">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-2 py-1.5 text-gray-400 border-b border-white/[0.04]">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
