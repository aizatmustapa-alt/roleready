"use client";

import React from "react";

function InlineMd({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold text-[#14213d]">
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        )
      )}
    </>
  );
}

type ParsedLine =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "bullet"; text: string }
  | { type: "text"; text: string }
  | { type: "blank" };

function parseLines(content: string): ParsedLine[] {
  return content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((raw): ParsedLine => {
      const line = raw.trim();
      if (line.startsWith("# ")) return { type: "h1", text: line.slice(2) };
      if (line.startsWith("## ")) return { type: "h2", text: line.slice(3) };
      if (line.startsWith("### ")) return { type: "h3", text: line.slice(4) };
      if (line.startsWith("- ")) return { type: "bullet", text: line.slice(2) };
      if (line === "") return { type: "blank" };
      return { type: "text", text: line };
    });
}

export function ResumeRenderer({ content }: { content: string }) {
  const lines = parseLines(content);
  const nodes: React.ReactNode[] = [];
  let bullets: string[] = [];
  let k = 0;

  const flushBullets = () => {
    if (bullets.length === 0) return;
    nodes.push(
      <ul key={k++} className="mt-1.5 space-y-1.5">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm leading-6 text-slate-600">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
            <span><InlineMd text={b} /></span>
          </li>
        ))}
      </ul>
    );
    bullets = [];
  };

  for (const line of lines) {
    if (line.type === "bullet") {
      bullets.push(line.text);
      continue;
    }
    flushBullets();

    if (line.type === "h1") {
      nodes.push(
        <h1 key={k++} className="font-serif text-2xl font-bold tracking-tight text-[#1B3A6B]">
          <InlineMd text={line.text} />
        </h1>
      );
    } else if (line.type === "h2") {
      nodes.push(
        <h2 key={k++} className="mb-2 mt-6 border-b border-[#B0BEC5] pb-1 text-xs font-bold uppercase tracking-[0.15em] text-[#1B3A6B]">
          {line.text}
        </h2>
      );
    } else if (line.type === "h3") {
      nodes.push(
        <h3 key={k++} className="mt-3 text-sm font-semibold text-[#14213d]">
          <InlineMd text={line.text} />
        </h3>
      );
    } else if (line.type === "text") {
      nodes.push(
        <p key={k++} className="text-xs leading-5 text-slate-500">
          <InlineMd text={line.text} />
        </p>
      );
    }
    // blank lines intentionally skipped — spacing handled by margins
  }
  flushBullets();

  return (
    <div className="bg-stone-100 px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-[794px] bg-white px-10 py-10 shadow-[0_2px_16px_rgba(0,0,0,0.10)] md:px-16 md:py-14">
        {nodes}
      </div>
    </div>
  );
}

export function CoverLetterRenderer({ content }: { content: string }) {
  const lines = parseLines(content);
  const nodes: React.ReactNode[] = [];
  let k = 0;
  let pendingBlanks = 0;
  // Track whether we're still in the name/contact header block
  let inHeader = false;
  let headerDone = false;

  for (const line of lines) {
    if (line.type === "blank") {
      pendingBlanks++;
      if (inHeader) {
        inHeader = false;
        headerDone = true;
      }
      continue;
    }

    if (line.type === "h1") {
      inHeader = true;
      headerDone = false;
      nodes.push(
        <h1 key={k++} className="font-serif text-2xl font-bold tracking-tight text-[#1B3A6B]">
          <InlineMd text={line.text} />
        </h1>
      );
    } else if (line.type === "h2") {
      inHeader = false;
      headerDone = true;
      nodes.push(
        <h2 key={k++} className="mb-2 mt-6 border-b border-[#B0BEC5] pb-1 text-xs font-bold uppercase tracking-[0.15em] text-[#1B3A6B]">
          {line.text}
        </h2>
      );
    } else if (line.type === "text" || line.type === "h3") {
      if (inHeader && !headerDone) {
        // Contact/location lines — match resume header style
        nodes.push(
          <p key={k++} className="mt-0.5 text-xs leading-5 text-slate-500">
            <InlineMd text={line.text} />
          </p>
        );
      } else {
        const mt = pendingBlanks > 0 ? "mt-4" : "mt-1";
        nodes.push(
          <p key={k++} className={`${mt} text-sm leading-7 text-slate-700`}>
            <InlineMd text={line.text} />
          </p>
        );
      }
    }
    pendingBlanks = 0;
  }

  return (
    <div className="bg-stone-100 px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-[794px] bg-white px-10 py-10 shadow-[0_2px_16px_rgba(0,0,0,0.10)] md:px-16 md:py-14">
        {nodes}
      </div>
    </div>
  );
}
