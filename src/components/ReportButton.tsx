"use client";

import { useState, useRef, useEffect } from "react";

interface ReportButtonProps {
  problemId: string;
  fetchWithSession: (url: string, options?: RequestInit) => Promise<Response>;
}

const QUICK_OPTIONS = [
  { type: "FORMATTING", label: "Formatting issue" },
  { type: "WRONG_ANSWER", label: "Wrong answer" },
] as const;

export function ReportButton({ problemId, fetchWithSession }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showOther, setShowOther] = useState(false);
  const [otherText, setOtherText] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowOther(false);
        setOtherText("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleReport = async (type: string, details?: string) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      await fetchWithSession("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId, type, ...(details ? { details } : {}) }),
      });
      setSubmitted(true);
      setShowOther(false);
      setOtherText("");
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
      }, 1500);
    } catch {
      // Silently fail — not critical
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-md text-[var(--error)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors"
        title="Report an issue"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] shadow-lg animate-fade-in-up overflow-hidden">
          {submitted ? (
            <div className="px-3 py-4 text-center text-sm font-medium text-[var(--success)]">
              Thanks for reporting!
            </div>
          ) : showOther ? (
            <div className="p-3 space-y-2">
              <div className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider">
                Describe the issue
              </div>
              <textarea
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder="What's wrong with this problem?"
                className="w-full h-20 px-2 py-1.5 text-sm rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted)] resize-none focus:outline-none focus:border-[var(--accent)]"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowOther(false); setOtherText(""); }}
                  className="flex-1 py-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => handleReport("OTHER", otherText)}
                  disabled={submitting || !otherText.trim()}
                  className="flex-1 py-1.5 text-xs font-medium bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
                >
                  Submit
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="px-3 py-2 text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider border-b border-[var(--border)]">
                Report Issue
              </div>
              {QUICK_OPTIONS.map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => handleReport(type)}
                  disabled={submitting}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--border)]/30 transition-colors disabled:opacity-50"
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => setShowOther(true)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--border)]/30 transition-colors"
              >
                Other issue...
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
