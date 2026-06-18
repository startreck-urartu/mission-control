import { NextRequest, NextResponse } from "next/server";

type KBCitation = {
  lesson_title: string;
  software: string;
  start_ts: number;
  video_path: string;
  score: number;
  snippet: string;
};

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

  let kbRes: Response;
  try {
    kbRes = await fetch(`${kbUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: body.question,
        history: body.history ?? [],
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Assistant unavailable — is the KB service running?" },
      { status: 503 }
    );
  }

  if (!kbRes.ok) {
    return NextResponse.json(
      { error: `KB error (${kbRes.status})` },
      { status: 503 }
    );
  }

  const data = (await kbRes.json()) as { answer: string; citations: KBCitation[] };
  // Map snake_case (KB) -> camelCase (Convex/JS). This is the only place we map.
  const citations = (data.citations ?? []).map((c) => ({
    lessonTitle: c.lesson_title,
    software: c.software,
    startTs: c.start_ts,
    videoPath: c.video_path || undefined,
    score: c.score,
    snippet: c.snippet,
  }));

  return NextResponse.json({ answer: data.answer, citations });
}
