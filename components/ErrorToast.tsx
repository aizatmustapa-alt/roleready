"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export function ErrorToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  return (
    <div
      className={`transition-all duration-300 ${
        message ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
      }`}
    >
      <div className="flex items-start gap-3 rounded-2xl bg-red-500 px-4 py-3.5 text-sm text-white shadow-[0_8px_32px_rgba(239,68,68,0.25)]">
        <span className="flex-1 leading-5">{message}</span>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-0.5 shrink-0 text-white/70 transition hover:text-white"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
