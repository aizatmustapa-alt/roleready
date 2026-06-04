"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Bookmark } from "lucide-react";
import { SavedJobCard } from "@/components/SavedJobCard";
import type { ApplicationWithJob } from "@/types/database";

export function SavedJobList({ initial }: { initial: ApplicationWithJob[] }) {
  const [saved, setSaved] = useState(initial);

  function handleRemoved(id: string) {
    setSaved((prev) => prev.filter((a) => a.id !== id));
  }

  if (saved.length === 0) {
    return (
      <section className="max-w-full overflow-hidden rounded-[2rem] border border-slate-100 bg-white px-5 py-14 text-center shadow-sm sm:px-6">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#ece8ff] to-[#d4ccff] text-[#2200ff]">
          <Bookmark className="h-9 w-9" />
        </span>
        <h2 className="mt-5 text-2xl font-bold text-slate-900">No saved jobs yet.</h2>
        <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-600">
          Hit the bookmark icon on any job match to save it here for later.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#2200ff] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_42px_rgba(34,0,255,0.2)] hover:bg-[#1a00cc] sm:w-auto"
          >
            Find fresh matches <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {saved.map((app) => (
        <SavedJobCard key={app.id} application={app} onRemoved={handleRemoved} />
      ))}
    </div>
  );
}
