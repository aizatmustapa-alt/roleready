"use client";

import { Gift } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewsletterBonusBanner() {
  const router = useRouter();
  const [subscribing, setSubscribing] = useState(false);
  const [done, setDone] = useState(false);

  async function subscribe() {
    setSubscribing(true);
    await fetch("/api/newsletter/bonus", { method: "POST" });
    setSubscribing(false);
    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50 px-5 py-4">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
          <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-bold text-slate-900">You're subscribed — extra generation unlocked!</p>
          <p className="text-xs text-slate-500">Go back to your application and generate now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#2200ff]/20 bg-[#ece8ff] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2200ff]/10">
          <Gift className="h-4 w-4 text-[#2200ff]" />
        </span>
        <div>
          <p className="text-sm font-bold text-slate-900">Get 1 extra free generation</p>
          <p className="text-xs leading-5 text-slate-600">Subscribe to career tips and unlock a 2nd free application — no payment needed.</p>
        </div>
      </div>
      <button
        type="button"
        onClick={subscribe}
        disabled={subscribing}
        className="shrink-0 rounded-full bg-[#2200ff] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(34,0,255,0.2)] transition hover:-translate-y-0.5 hover:bg-[#1a00cc] disabled:opacity-70"
      >
        {subscribing ? "Subscribing…" : "Subscribe — it's free"}
      </button>
    </div>
  );
}
