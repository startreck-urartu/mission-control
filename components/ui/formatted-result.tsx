"use client";

import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

const FIELD_LABELS: Record<string, string> = {
  actionType: "Action Type",
  dataSource: "Data Source",
  dataQualityScore: "Data Quality Score",
  validationStatus: "Validation Status",
  nextSteps: "Next Steps",
  winRate: "Win Rate",
  maxDrawdown: "Max Drawdown",
};

function formatLabel(key: string): string {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

function tryParseJson(content: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // not JSON
  }
  return null;
}

const SKIP_FIELDS = new Set(["taskId", "title"]);

function renderValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return (
      <ul className="list-disc list-outside pl-4 space-y-0.5">
        {value.map((item, i) => (
          <li key={i} className="text-muted">{typeof item === "object" ? JSON.stringify(item) : String(item)}</li>
        ))}
      </ul>
    );
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const entries = Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== "");
    if (entries.length === 0) return null;
    return (
      <div className="pl-3 border-l border-separator space-y-1">
        {entries.map(([k, v]) => (
          <div key={k}>
            <span className="text-tertiary text-xs">{formatLabel(k)}:</span>{" "}
            <span className="text-foreground">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
          </div>
        ))}
      </div>
    );
  }
  return String(value);
}

function JsonResult({ data }: { data: Record<string, unknown> }) {
  const title = data.title as string | undefined;
  const entries = Object.entries(data).filter(([key]) => !SKIP_FIELDS.has(key));

  const primaryFields = ["analysis", "recommendation", "concerns"];
  const metaFields = entries.filter(([key]) => !primaryFields.includes(key));
  const contentFields = entries.filter(([key]) => primaryFields.includes(key));

  return (
    <div className="space-y-3">
      {title && (
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      )}

      {contentFields.map(([key, value]) => {
        if (!value || (typeof value === "string" && !value.trim())) return null;
        return (
          <div key={key}>
            <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
              {formatLabel(key)}
            </h4>
            <div className="text-sm text-foreground leading-relaxed">
              {renderValue(value)}
            </div>
          </div>
        );
      })}

      {metaFields.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-separator">
          {metaFields.map(([key, value]) => {
            const rendered = renderValue(value);
            if (rendered === null) return null;
            return (
              <div key={key}>
                <span className="text-xs font-medium text-tertiary">{formatLabel(key)}</span>
                <div className="text-sm text-foreground mt-0.5">{rendered}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function FormattedResult({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const jsonData = tryParseJson(content);

  if (jsonData) {
    return (
      <div className={cn("formatted-result text-sm text-foreground leading-relaxed", className)}>
        <JsonResult data={jsonData} />
      </div>
    );
  }

  return (
    <div className={cn("formatted-result text-sm text-foreground leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkBreaks, remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base font-bold text-foreground mt-4 mb-2 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-semibold text-foreground mt-3 mb-1.5 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-medium text-foreground mt-2 mb-1 first:mt-0">{children}</h3>
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
            <li className="text-muted">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-muted">{children}</em>
          ),
          code: ({ children, className: codeClassName }) => {
            const isInline = !codeClassName;
            return isInline ? (
              <code className="px-1 py-0.5 rounded bg-fill text-accent-amber text-xs font-mono">{children}</code>
            ) : (
              <code className={cn("block p-3 rounded-lg bg-fill text-xs font-mono text-foreground overflow-x-auto mb-2", codeClassName)}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="p-3 rounded-lg bg-fill text-xs font-mono text-foreground overflow-x-auto mb-2">{children}</pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-accent-blue/40 pl-3 my-2 text-muted italic">{children}</blockquote>
          ),
          hr: () => (
            <hr className="border-separator my-3" />
          ),
          a: ({ href, children }) => (
            <a href={href} className="text-accent-blue hover:text-accent-blue/80 underline underline-offset-2" target="_blank" rel="noopener noreferrer">{children}</a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="w-full text-xs border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-separator">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-2 py-1.5 text-left font-medium text-foreground">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-2 py-1.5 text-muted border-b border-separator">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
