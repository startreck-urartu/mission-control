import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const kbUrl = process.env.KB_API_URL;
  if (!kbUrl) {
    return NextResponse.json({ error: "KB_API_URL not configured" }, { status: 503 });
  }

  let body: { question: string; history?: { role: string; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  // Bound the wait: KB generation can stall; an un-timed fetch would freeze the
  // request (and UI) indefinitely. Streaming makes this generous headroom, since
  // tokens arrive continuously well before the cap.
  const KB_TIMEOUT_MS = 60_000;

  let kbRes: Response;
  try {
    kbRes = await fetch(`${kbUrl}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: body.question,
        history: body.history ?? [],
      }),
      signal: AbortSignal.timeout(KB_TIMEOUT_MS),
    });
  } catch (e) {
    const timedOut =
      e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    return NextResponse.json(
      {
        error: timedOut
          ? "Assistant timed out — the knowledge-base service didn't respond in time. It may be busy or its model is unavailable."
          : "Assistant unavailable — is the KB service running?",
      },
      { status: timedOut ? 504 : 503 }
    );
  }

  if (!kbRes.ok || !kbRes.body) {
    return NextResponse.json({ error: `KB error (${kbRes.status})` }, { status: 503 });
  }

  // Proxy the NDJSON token stream straight through to the client. Citation
  // fields (snake_case from the KB) are mapped to camelCase on the client as
  // they arrive.
  return new Response(kbRes.body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
