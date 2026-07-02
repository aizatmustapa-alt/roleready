"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { HomepageOnboardingModal } from "@/components/landing/HomepageOnboardingModal";

export function BlogResumeCTA() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  function handleFile(file?: File | null) {
    if (!file) return;
    setPendingFile(file);
    setModalOpen(true);
  }

  return (
    <>
      <section className="px-5 py-10 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
            onClick={() => inputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center gap-5 rounded-[1.5rem] border-2 border-dashed border-[#b9adff] bg-white p-6 text-center shadow-[0_16px_60px_rgba(34,0,255,0.10)] transition hover:border-[#2200ff] sm:flex-row sm:p-8 sm:text-left lg:p-10"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.1rem] bg-[#ece8ff] text-[#2200ff] sm:h-16 sm:w-16 sm:rounded-[1.2rem]">
              <UploadCloud className="h-7 w-7 sm:h-9 sm:w-9" />
            </span>
            <div className="flex-1">
              <p className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">Ready to tailor your resume?</p>
              <p className="mt-1 text-sm text-slate-500">Upload your resume and we'll customise it for any job ad in seconds.</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2200ff] px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_32px_rgba(34,0,255,0.28)] transition hover:bg-[#1a00cc] sm:w-auto sm:shrink-0"
            >
              Tailor My Resume for FREE
            </button>
          </div>
        </div>
      </section>

      <HomepageOnboardingModal
        open={modalOpen}
        initialResumeFile={pendingFile}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
