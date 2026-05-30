import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const maxDuration = 30;

type Props = {
  params: Promise<{ id: string }>;
};

async function readOptions(request: Request) {
  const text = await request.text().catch(() => "");
  if (!text) return { format: "prose", save: false };

  try {
    const body = JSON.parse(text) as { format?: string; save?: boolean };
    return {
      format: body.format === "bullets" ? "bullets" : "prose",
      save: body.save === true,
    };
  } catch {
    return { format: "prose", save: false };
  }
}

export async function POST(request: Request, { params }: Props) {
  const { id } = await params;
  const options = await readOptions(request);
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const { data: application } = await supabase
    .from("applications")
    .select("jobs(description, title, company)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const job = application?.jobs as unknown as { description: string; title: string; company: string } | null;

  if (!job?.description?.trim()) {
    return NextResponse.json({ error: "No job description found to summarise." }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI is not configured." }, { status: 500 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0 });
  const prompt = options.format === "bullets"
    ? `Summarise this job description as exactly 2-3 concise bullet points. Focus on the role purpose, key responsibilities, stakeholders, and important requirements. Use plain language. Do not add a heading. Each bullet must start with "- ". Be specific to this role - do not use generic filler.

Job title: ${job.title}
Company: ${job.company}

Job description:
${job.description.slice(0, 4000)}`
    : `Summarise this job in 2-3 concise sentences covering: what the role does, who it reports to or works with, and the key focus area. Write in plain prose, no bullet points, no headings. Be specific to this role - do not use generic filler.

Job title: ${job.title}
Company: ${job.company}

Job description:
${job.description.slice(0, 4000)}`;

  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }]
  });

  const summary = message.content[0]?.type === "text" ? message.content[0].text.trim() : "";

  if (!summary) {
    return NextResponse.json({ error: "AI did not return a summary." }, { status: 500 });
  }

  if (options.save) {
    const { error } = await supabase.from("applications").update({ role_summary: summary }).eq("id", id).eq("user_id", user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  return NextResponse.json({ summary });
}
