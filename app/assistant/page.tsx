"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Send, Plus, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Citation = {
  lessonTitle: string;
  software: string;
  startTs: number;
  videoPath?: string;
  score: number;
  snippet: string;
};

const HISTORY_TURNS = 6;

function fmtTs(s: number): string {
  if (s < 0) return "";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return ` @ ${m}:${sec.toString().padStart(2, "0")}`;
}

export default function AssistantPage() {
  const threads = useQuery(api.assistant.listThreads) ?? [];
  const [activeThreadId, setActiveThreadId] = useState<Id<"assistantThreads"> | null>(null);
  const messages = useQuery(
    api.assistant.getMessages,
    activeThreadId ? { threadId: activeThreadId } : "skip"
  ) ?? [];

  const createThread = useMutation(api.assistant.createThread);
  const addMessage = useMutation(api.assistant.addMessage);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    const question = input.trim();
    if (!question || sending) return;
    setError(null);
    setSending(true);
    try {
      let threadId = activeThreadId;
      if (!threadId) {
        threadId = await createThread({ title: question.slice(0, 60) });
        setActiveThreadId(threadId);
      }

      const priorHistory = messages
        .slice(-HISTORY_TURNS)
        .map((m: Doc<"assistantMessages">) => ({ role: m.role, content: m.content }));

      await addMessage({ threadId, role: "user", content: question });
      setInput("");

      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history: priorHistory }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? `Request failed (${res.status})`);
      }
      const data = (await res.json()) as { answer: string; citations: Citation[] };
      await addMessage({
        threadId,
        role: "assistant",
        content: data.answer,
        citations: data.citations,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-5rem)] md:h-[calc(100dvh-3rem)]">
      {/* Thread sidebar */}
      <div className="w-64 border-r p-3 flex flex-col gap-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => setActiveThreadId(null)}
        >
          <Plus className="h-4 w-4" /> New chat
        </Button>
        <div className="flex flex-col gap-1 overflow-y-auto">
          {threads.map((t: Doc<"assistantThreads">) => (
            <button
              key={t._id}
              onClick={() => setActiveThreadId(t._id)}
              className={`text-left text-sm px-2 py-1.5 rounded truncate transition-colors hover:bg-white/[0.04] ${
                activeThreadId === t._id ? "bg-white/[0.06]" : ""
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <MessageCircle className="h-5 w-5" />
          <h1 className="font-semibold">CAD Assistant</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <p className="text-gray-400 text-sm">
              Ask anything about your CAD-jewelry courses.
            </p>
          )}
          {messages.map((m: Doc<"assistantMessages">) => (
            <div key={m._id} className={m.role === "user" ? "text-right" : "text-left"}>
              <Card
                className={`inline-block max-w-[80%] p-3 text-sm whitespace-pre-wrap ${
                  m.role === "user" ? "bg-blue-500/15 text-blue-100 border-blue-500/20" : ""
                }`}
              >
                {m.content}
                {m.role === "assistant" && m.citations && m.citations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.citations.map((c: Citation, i: number) => (
                      <span
                        key={i}
                        title={c.snippet}
                        className="text-xs bg-white/[0.04] text-gray-400 rounded px-2 py-0.5"
                      >
                        {c.lessonTitle}
                        {fmtTs(c.startTs)}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          ))}
        </div>

        {error && (
          <div role="alert" className="px-4 py-2 text-sm text-red-400">{error}</div>
        )}

        <div className="border-t p-3 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about bezels, topology, stone setting..."
            disabled={sending}
          />
          <Button onClick={handleSend} disabled={sending || !input.trim()} aria-label="Send message">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
