import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CachedGrabbedJob } from "@/types/database";

type AdzunaJob = {
  id: string;
  title: string;
  description: string;
  company: { display_name: string };
  location: { display_name: string };
  salary_min?: number;
  salary_max?: number;
  redirect_url: string;
  created: string;
};

export type GrabResult = {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  salary?: string;
  description: string;
  jobUrl: string;
  matchScore: number;
  matchReason: string;
  postedAt: string;
  source?: string;
  fetchedAt?: string;
};

function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return "";
  const fmt = (n: number) => `$${Math.round(n / 1000)}k`;
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function cachedRowToResult(row: CachedGrabbedJob): GrabResult {
  return {
    id: row.external_id,
    title: row.title,
    company: row.company,
    location: row.location,
    salaryMin: row.salary_min ?? undefined,
    salaryMax: row.salary_max ?? undefined,
    salary: row.salary || undefined,
    description: row.description,
    jobUrl: row.job_url,
    matchScore: row.match_score,
    matchReason: row.match_reason,
    postedAt: row.posted_at ?? row.created_at,
    source: row.source || undefined,
    fetchedAt: row.fetched_at
  };
}

const keywordSchema = {
  type: "object" as const,
  additionalProperties: false,
  required: ["jobTitle", "searchQuery"],
  properties: {
    jobTitle: { type: "string" },
    searchQuery: { type: "string" }
  }
};

const scoringSchema = {
  type: "object" as const,
  additionalProperties: false,
  required: ["scores"],
  properties: {
    scores: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "score", "reason"],
        properties: {
          id: { type: "string" },
          score: { type: "integer" },
          reason: { type: "string" }
        }
      }
    }
  }
};

async function extractKeywords(resumeText: string, provider: "anthropic" | "openai") {
  const userMsg = `Extract the primary job title and a 5–8 keyword search query from this resume. Focus on the most recent role and core skills.\n\nResume:\n${resumeText.slice(0, 8000)}`;

  if (provider === "anthropic") {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured.");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0 });
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: 200,
      tools: [{ name: "extract", description: "Extract job search keywords from resume.", input_schema: keywordSchema as Anthropic.Tool.InputSchema }],
      tool_choice: { type: "tool", name: "extract" },
      messages: [{ role: "user", content: userMsg }]
    });
    const block = response.content.find((b) => b.type === "tool_use");
    if (!block || block.type !== "tool_use") throw new Error("No keyword extraction result from Anthropic.");
    return block.input as { jobTitle: string; searchQuery: string };
  }

  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured.");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    input: [{ role: "user", content: [{ type: "input_text", text: userMsg }] }],
    text: { format: { type: "json_schema", name: "extract_keywords", schema: keywordSchema, strict: true } }
  } as OpenAI.Responses.ResponseCreateParamsNonStreaming);
  return JSON.parse(response.output_text) as { jobTitle: string; searchQuery: string };
}

async function scoreJobs(
  resumeText: string,
  jobs: { id: string; title: string; company: string; description: string }[],
  provider: "anthropic" | "openai"
) {
  const jobList = jobs
    .map((j) => `ID:${j.id}\nTitle: ${j.title} at ${j.company}\n${j.description.slice(0, 600)}`)
    .join("\n---\n");

  const userMsg = `You are a strict recruiter scoring job-resume fit from 0–100.

Scoring guide:
- 80–100: Strong match — title aligns, most key skills present, right seniority level
- 60–79: Reasonable match — related field, some gaps in skills or level
- 40–59: Partial match — different specialisation or seniority, some transferable skills
- 0–39: Weak match — different field, missing core requirements

Be conservative. Most scores should fall in the 40–70 range. Only award 80+ when there is clear evidence across title, experience level, AND key skills.

Resume (summary):\n${resumeText.slice(0, 6000)}\n\nJobs to score:\n${jobList}`;

  if (provider === "anthropic") {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured.");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0 });
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: 2000,
      tools: [{ name: "score_jobs", description: "Score job listings against a resume.", input_schema: scoringSchema as Anthropic.Tool.InputSchema }],
      tool_choice: { type: "tool", name: "score_jobs" },
      messages: [{ role: "user", content: userMsg }]
    });
    const block = response.content.find((b) => b.type === "tool_use");
    if (!block || block.type !== "tool_use") throw new Error("No scoring result from Anthropic.");
    return (block.input as { scores: { id: string; score: number; reason: string }[] }).scores;
  }

  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured.");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    input: [{ role: "user", content: [{ type: "input_text", text: userMsg }] }],
    text: { format: { type: "json_schema", name: "score_jobs", schema: scoringSchema, strict: true } }
  } as OpenAI.Responses.ResponseCreateParamsNonStreaming);
  return (JSON.parse(response.output_text) as { scores: { id: string; score: number; reason: string }[] }).scores;
}

async function fetchAdzunaJobs({
  appId,
  appKey,
  query,
  maxDaysOld,
  resultsPerPage,
}: {
  appId: string;
  appKey: string;
  query: string;
  maxDaysOld: number;
  resultsPerPage: number;
}) {
  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: String(resultsPerPage),
    what: query,
    max_days_old: String(maxDaysOld),
    sort_by: "date",
    content_type: "application/json",
  });

  const res = await fetch(`https://api.adzuna.com/v1/api/jobs/au/search/1?${params}`, {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });
  if (!res.ok) throw new Error(`Adzuna returned HTTP ${res.status}`);
  const data = (await res.json()) as { results?: AdzunaJob[] };
  return data.results ?? [];
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to grab jobs." }, { status: 401 });
  }

  const { data: masterResume } = await supabase
    .from("master_resumes")
    .select("resume_text")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!masterResume?.resume_text?.trim()) {
    return NextResponse.json({ error: "Upload a master resume first." }, { status: 400 });
  }

  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    return NextResponse.json(
      { error: "Job search is not configured. Add ADZUNA_APP_ID and ADZUNA_APP_KEY to your environment variables." },
      { status: 500 }
    );
  }

  const provider = process.env.AI_PROVIDER === "anthropic" ? "anthropic" : "openai";

  const url = new URL(request.url);
  const manualQuery = url.searchParams.get("q")?.trim();
  const forceRefresh = url.searchParams.get("refresh") === "true" || Boolean(manualQuery);

  if (!forceRefresh) {
    const { data: cachedRows } = await supabase
      .from("cached_grabbed_jobs")
      .select("*")
      .eq("user_id", user.id)
      .gte("fetched_at", startOfToday().toISOString())
      .order("match_score", { ascending: false })
      .limit(15);

    if (cachedRows?.length) {
      const rows = cachedRows as CachedGrabbedJob[];
      return NextResponse.json({
        jobs: rows.map(cachedRowToResult),
        searchQuery: rows[0]?.search_query ?? "",
        jobTitle: "",
        cached: true,
        fetchedAt: rows[0]?.fetched_at,
      });
    }
  }

  let keywords: { jobTitle: string; searchQuery: string };
  if (manualQuery) {
    keywords = { jobTitle: "", searchQuery: manualQuery };
  } else {
    try {
      keywords = await extractKeywords(masterResume.resume_text, provider);
    } catch (e) {
      return NextResponse.json({ error: `Keyword extraction failed: ${e instanceof Error ? e.message : "Unknown error"}` }, { status: 500 });
    }
  }

  let actualSearchQuery = keywords.searchQuery;
  let adzunaJobs: AdzunaJob[] = [];

  // Primary search — 30 days
  try {
    adzunaJobs = await fetchAdzunaJobs({ appId, appKey, query: actualSearchQuery, maxDaysOld: 30, resultsPerPage: 30 });
  } catch (e) {
    console.error("[grab] Adzuna primary fetch failed:", e);
  }

  // Fallback: if no results, retry with just the job title and a wider date window
  if (adzunaJobs.length === 0 && keywords.jobTitle.trim()) {
    actualSearchQuery = keywords.jobTitle.trim();
    try {
      adzunaJobs = await fetchAdzunaJobs({ appId, appKey, query: actualSearchQuery, maxDaysOld: 60, resultsPerPage: 30 });
    } catch (e) {
      console.error("[grab] Adzuna fallback fetch failed:", e);
    }
  }

  if (adzunaJobs.length === 0) {
    await supabase.from("cached_grabbed_jobs").delete().eq("user_id", user.id);
    return NextResponse.json({
      jobs: [],
      searchQuery: actualSearchQuery,
      jobTitle: keywords.jobTitle,
      cached: false,
      fetchedAt: new Date().toISOString()
    });
  }

  const allJobs: GrabResult[] = adzunaJobs.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company.display_name,
    location: j.location.display_name,
    salaryMin: j.salary_min,
    salaryMax: j.salary_max,
    description: j.description,
    jobUrl: j.redirect_url,
    matchScore: 0,
    matchReason: "",
    postedAt: j.created,
    source: "Adzuna"
  }));

  // Reuse any scores already stored for these job IDs so scores stay consistent across refreshes
  const { data: existingCached } = await supabase
    .from("cached_grabbed_jobs")
    .select("external_id, match_score, match_reason")
    .eq("user_id", user.id)
    .in("external_id", allJobs.map((j) => j.id));

  const cachedScoreMap = new Map(
    (existingCached ?? []).map((row) => [row.external_id, { score: row.match_score as number, reason: row.match_reason as string }])
  );

  // Only call AI for jobs we haven't scored before
  const jobsNeedingScore = allJobs
    .filter((j) => !cachedScoreMap.has(j.id))
    .map((j) => ({ id: j.id, title: j.title, company: j.company, description: j.description }));

  let newScores: { id: string; score: number; reason: string }[] = [];
  if (jobsNeedingScore.length > 0) {
    try {
      newScores = await scoreJobs(masterResume.resume_text, jobsNeedingScore, provider);
    } catch {
      newScores = jobsNeedingScore.map((j) => ({ id: j.id, score: 50, reason: "Match scoring unavailable." }));
    }
  }

  const scoreMap = new Map<string, { score: number; reason: string }>([
    ...cachedScoreMap.entries(),
    ...newScores.map((s) => [s.id, { score: s.score, reason: s.reason }] as [string, { score: number; reason: string }]),
  ]);

  const results: GrabResult[] = allJobs.map((j) => {
    const s = scoreMap.get(j.id) ?? { score: 50, reason: "" };
    return { ...j, matchScore: Math.max(0, Math.min(100, Math.round(s.score))), matchReason: s.reason };
  });

  results.sort((a, b) => b.matchScore - a.matchScore);

  const topResults = results.slice(0, 20);
  const fetchedAt = new Date().toISOString();

  await supabase.from("cached_grabbed_jobs").delete().eq("user_id", user.id);

  if (topResults.length > 0) {
    const { error: insertError } = await supabase.from("cached_grabbed_jobs").insert(
      topResults.map((job) => ({
        user_id: user.id,
        external_id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary ?? formatSalary(job.salaryMin, job.salaryMax),
        salary_min: job.salaryMin ?? null,
        salary_max: job.salaryMax ?? null,
        job_url: job.jobUrl,
        description: job.description,
        match_score: job.matchScore,
        match_reason: job.matchReason,
        posted_at: job.postedAt ? new Date(job.postedAt).toISOString() : null,
        search_query: actualSearchQuery,
        source: "Adzuna",
        fetched_at: fetchedAt,
      }))
    );

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    jobs: topResults.map((job) => ({ ...job, fetchedAt })),
    searchQuery: actualSearchQuery,
    jobTitle: keywords.jobTitle,
    cached: false,
    fetchedAt,
  });
}
