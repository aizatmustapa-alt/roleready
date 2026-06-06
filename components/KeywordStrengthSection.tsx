"use client";

import { useState } from "react";
import { ChevronDown, Lightbulb } from "lucide-react";

type Props = {
  missingKeywords: string[];
  matchScore: number | null;
};

export function KeywordStrengthSection({ missingKeywords, matchScore }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const hasRealKeywords = missingKeywords.length > 0;

  const displayItems = hasRealKeywords
    ? missingKeywords
    : ["Review job requirements", "Check resume emphasis", "Personalise your opening"];

  return (
    <section className="rounded-[1.6rem] border border-slate-100 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left md:px-6"
      >
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-base font-bold text-slate-900">Opportunities to strengthen</span>
          {hasRealKeywords && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
              {missingKeywords.length} keyword{missingKeywords.length !== 1 ? "s" : ""}
            </span>
          )}
          {matchScore !== null && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              Match: {matchScore}%
            </span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 md:px-6 md:pb-6">
          <p className="mb-4 text-sm text-slate-500">
            {hasRealKeywords
              ? "Based on your master documents, these keywords are missing from your application. Review them and see if any are genuinely relevant to your experience — if so, add them to your master resume first, then regenerate."
              : "No major keyword gaps were identified yet."}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {displayItems.map((item) => (
              <div key={item} className="rounded-2xl bg-slate-50 px-4 py-4">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                <p className="mt-3 text-sm font-semibold text-slate-900">{item}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {hasRealKeywords
                    ? "Only include this if it genuinely appears in your experience."
                    : "Use the generated documents as a starting point, then add context where it is true."}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
