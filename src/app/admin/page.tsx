"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { Problem } from "@/components/Problem";
import { MultipleChoiceForm } from "@/components/MultipleChoiceForm";
import { TierIcon } from "@/components/TierIcon";
import { getTier } from "@/lib/tiers";

// ─── Types ───────────────────────────────────────────────────────

type Tab = "overview" | "problems" | "reports" | "players" | "health" | "triage";

interface OverviewData {
  totalProblems: number;
  excludedCount: number;
  totalPlayers: number;
  authenticatedPlayers: number;
  anonymousPlayers: number;
  activeToday: number;
  activeThisWeek: number;
  totalAttempts: number;
  attemptsThisWeek: number;
  totalReports: number;
  reportsByType: Record<string, number>;
  contestCounts: Array<{ source: string; count: number }>;
  problemRatingDistribution: Record<string, number>;
  playerRatingDistribution: Record<string, number>;
}

interface AdminProblem {
  id: string;
  content: string;
  answer: string;
  answerType: "FREE_RESPONSE" | "MULTIPLE_CHOICE";
  choices: string[];
  rating: number;
  difficulty: string;
  source: string | null;
  sourceNumber: number | null;
  attemptCount?: number;
  reportCount?: number;
  accuracy?: number | null;
  excluded: boolean;
}

interface ProblemsData {
  contestList: string[];
  problems: AdminProblem[] | null;
  searchResults: AdminProblem[] | null;
}

interface ReportItem {
  id: string;
  type: string;
  details: string | null;
  createdAt: string;
  problem: {
    id: string;
    content: string;
    source: string | null;
    sourceNumber: number | null;
    answer: string;
    answerType: string;
    choices: string[];
  };
  player: { id: string; rating: number; authenticated: boolean } | null;
}

interface PlayerItem {
  rank: number;
  id: string;
  username: string | null;
  displayName: string | null;
  rating: number;
  ratingDeviation: number;
  gamesPlayed: number;
  authenticated: boolean;
  accuracy: number | null;
  lastActiveAt: string;
  createdAt: string;
}

interface PlayerDetail {
  id: string;
  username: string | null;
  displayName: string | null;
  rating: number;
  ratingDeviation: number;
  gamesPlayed: number;
  firebaseUid: string | null;
  createdAt: string;
  lastActiveAt: string;
  recentAttempts: Array<{
    correct: boolean;
    ratingBefore: number;
    ratingAfter: number;
    source: string | null;
    sourceNumber: number | null;
    createdAt: string;
  }>;
}

interface HealthData {
  broken: Array<{
    id: string;
    source: string | null;
    sourceNumber: number | null;
    reason: string;
    content: string;
  }>;
  lowAccuracy: Array<{
    id: string;
    source: string | null;
    sourceNumber: number | null;
    rating: number;
    attempts: number;
    accuracy: number;
  }>;
  highAccuracy: Array<{
    id: string;
    source: string | null;
    sourceNumber: number | null;
    rating: number;
    attempts: number;
    accuracy: number;
  }>;
  drifted: Array<{
    id: string;
    source: string | null;
    sourceNumber: number | null;
    rating: number;
    difficulty: string;
    drift: number;
  }>;
  mostReported: Array<{
    id: string;
    source: string | null;
    sourceNumber: number | null;
    reportCount: number;
  }>;
}

interface TriageProblem {
  id: string;
  content: string;
  answer: string;
  answerType: "FREE_RESPONSE" | "MULTIPLE_CHOICE";
  choices: string[];
  rating: number;
  difficulty: string;
  source: string | null;
  sourceNumber: number | null;
  excluded: boolean;
  reports: Array<{
    id: string;
    type: string;
    details: string | null;
    createdAt: string;
  }>;
}

// ─── Main Page ───────────────────────────────────────────────────

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("triage");
  const [reportCount, setReportCount] = useState<number | null>(null);
  const [triageCount, setTriageCount] = useState<number | null>(null);

  // Fetch report count for badge
  useEffect(() => {
    fetch("/api/admin?tab=reports")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setReportCount(d.data.totalCount);
      })
      .catch(() => {});
    fetch("/api/admin?tab=triage")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setTriageCount(d.data.totalCount);
      })
      .catch(() => {});
  }, []);

  const tabs: { key: Tab; label: string; badge?: number | null }[] = [
    { key: "triage", label: "Triage", badge: triageCount },
    { key: "overview", label: "Overview" },
    { key: "problems", label: "Problems" },
    { key: "reports", label: "Reports", badge: reportCount },
    { key: "players", label: "Players" },
    { key: "health", label: "Health" },
  ];

  return (
    <main className="min-h-screen flex flex-col">
      <Header />

      {/* Warning banner */}
      <div className="mx-4 mt-4 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-sm text-center font-medium">
        Admin — Local Only
      </div>

      {/* Tab bar */}
      <div className="sticky top-16 z-40 bg-[var(--background)] border-b border-[var(--border)]/50 mt-3">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === t.key
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-red-500 text-white">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {activeTab === "triage" && <TriageTab />}
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "problems" && <ProblemsTab />}
        {activeTab === "reports" && <ReportsTab />}
        {activeTab === "players" && <PlayersTab />}
        {activeTab === "health" && <HealthTab />}
      </div>
    </main>
  );
}

// ─── Triage Tab ─────────────────────────────────────────────────

function TriageTab() {
  const [queue, setQueue] = useState<TriageProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editContent, setEditContent] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmMode, setConfirmMode] = useState<null | {
    content: string;
    answer: string;
    answerType: string;
    choices: string[];
    source: string | null;
    sourceNumber: number | null;
  }>(null);

  const fetchQueue = useCallback(async () => {
    const res = await fetch("/api/admin?tab=triage");
    const d = await res.json();
    if (d.success) {
      setQueue(d.data.problems);
    }
  }, []);

  useEffect(() => {
    fetchQueue().finally(() => setLoading(false));
  }, [fetchQueue]);

  const current = queue[currentIndex] ?? null;

  // Sync edit fields when current problem changes
  useEffect(() => {
    if (current) {
      setEditContent(current.content);
      setEditAnswer(current.answer);
      setConfirmMode(null);
    }
  }, [current]);

  const adminPost = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const advance = () => {
    // Remove current problem from queue since it's been resolved
    setQueue((prev) => prev.filter((_, i) => i !== currentIndex));
    // If we were at the end, go back
    if (currentIndex >= queue.length - 1) {
      setCurrentIndex(Math.max(0, queue.length - 2));
    }
    setConfirmMode(null);
  };

  const skip = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSaveAndNext = async () => {
    if (!current) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        action: "triageResolve",
        problemId: current.id,
        dismiss: true,
      };
      if (editContent !== current.content) body.content = editContent;
      if (editAnswer !== current.answer) body.answer = editAnswer;
      const d = await adminPost(body);
      if (d.success && d.data) {
        setConfirmMode({
          content: d.data.content,
          answer: d.data.answer,
          answerType: d.data.answerType,
          choices: d.data.choices,
          source: current.source,
          sourceNumber: current.sourceNumber,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleExcludeAndNext = async () => {
    if (!current) return;
    setSaving(true);
    try {
      await adminPost({ action: "toggleExclude", problemId: current.id });
      await adminPost({ action: "triageResolve", problemId: current.id, dismiss: true });
      advance();
    } finally {
      setSaving(false);
    }
  };

  const handleDismissReports = async () => {
    if (!current) return;
    setSaving(true);
    try {
      await adminPost({ action: "triageResolve", problemId: current.id, dismiss: true });
      advance();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  if (queue.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">All clear</div>
        <div className="text-[var(--muted)] text-lg">No problems need triage</div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">Done</div>
        <div className="text-[var(--muted)] text-lg">You have triaged all problems in the queue</div>
      </div>
    );
  }

  // Confirmation screen after Save & Next
  if (confirmMode) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-1">Review Saved Changes</h2>
          <p className="text-sm text-[var(--muted)]">
            {confirmMode.source} #{confirmMode.sourceNumber} — updated and reports dismissed
          </p>
        </div>

        <div className="rounded-xl border border-green-500/30 bg-[var(--card-bg)] p-6" style={{ boxShadow: "var(--card-shadow)" }}>
          <Problem content={confirmMode.content} source={confirmMode.source} sourceNumber={confirmMode.sourceNumber} />
          {confirmMode.answerType === "MULTIPLE_CHOICE" && confirmMode.choices.length > 0 && (
            <div className="mt-4">
              <MultipleChoiceForm
                choices={confirmMode.choices}
                onSubmit={async () => {}}
                resultMode={{ correctAnswer: confirmMode.answer, userAnswer: "" }}
              />
            </div>
          )}
          {confirmMode.answerType === "FREE_RESPONSE" && (
            <div className="mt-4 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-sm">
              Answer: <span className="font-bold">{confirmMode.answer}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => advance()}
            className="px-6 py-2.5 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            Looks Good
          </button>
          <button
            onClick={() => setConfirmMode(null)}
            className="px-6 py-2.5 text-sm font-medium rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/30 transition-colors"
          >
            Edit More
          </button>
        </div>
      </div>
    );
  }

  const aopsUrl = current.source && current.sourceNumber
    ? `https://artofproblemsolving.com/wiki/index.php/${current.source.replace(/ /g, "_")}_Problems/Problem_${current.sourceNumber}`
    : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Problem Triage
          <span className="text-[var(--muted)] font-normal ml-2 text-base">
            ({queue.length} remaining)
          </span>
        </h2>
        <div className="text-sm text-[var(--muted)]">
          {currentIndex + 1} / {queue.length}
        </div>
      </div>

      {/* Report badges */}
      <div className="flex flex-wrap gap-2">
        {current.reports.map((r) => (
          <div
            key={r.id}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
              r.type === "WRONG_ANSWER"
                ? "bg-red-500/10 border border-red-500/30 text-red-500"
                : r.type === "FORMATTING"
                ? "bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400"
                : "bg-blue-500/10 border border-blue-500/30 text-blue-500"
            }`}
          >
            <span className="font-bold text-xs">{r.type}</span>
            {r.details && <span className="text-xs opacity-80">— {r.details}</span>}
            <span className="text-[10px] opacity-50">{timeAgo(r.createdAt)}</span>
          </div>
        ))}
      </div>

      {/* Problem info bar */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <Tag label={current.difficulty} />
        <Tag label={current.answerType === "MULTIPLE_CHOICE" ? "MC" : "FR"} />
        <Tag label={`ELO: ${Math.round(current.rating)}`} />
        <Tag label={`Answer: ${current.answer}`} accent />
        {current.source && (
          <Tag label={`${current.source} #${current.sourceNumber}`} />
        )}
        {current.excluded && (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
            EXCLUDED
          </span>
        )}
        {aopsUrl && (
          <a
            href={aopsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--border)]/50 text-[var(--accent)] hover:underline"
          >
            AoPS
          </a>
        )}
      </div>

      {/* Rendered problem preview */}
      <div
        className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6"
        style={{ boxShadow: "var(--card-shadow)" }}
      >
        <Problem content={editContent} source={current.source} sourceNumber={current.sourceNumber} />
        {current.answerType === "MULTIPLE_CHOICE" && current.choices.length > 0 && (
          <div className="mt-4">
            <MultipleChoiceForm
              choices={current.choices}
              onSubmit={async () => {}}
              resultMode={{ correctAnswer: editAnswer || current.answer, userAnswer: "" }}
            />
          </div>
        )}
        {current.answerType === "FREE_RESPONSE" && (
          <div className="mt-4 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-sm">
            Answer: <span className="font-bold">{editAnswer}</span>
          </div>
        )}
      </div>

      {/* Edit area */}
      <div
        className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 space-y-4"
        style={{ boxShadow: "var(--card-shadow)" }}
      >
        <div className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
          Edit Problem
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Content (raw LaTeX)</label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] font-mono resize-y placeholder:text-[var(--muted)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Answer</label>
            <input
              type="text"
              value={editAnswer}
              onChange={(e) => setEditAnswer(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] font-mono"
            />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleSaveAndNext}
          disabled={saving}
          className="px-5 py-2.5 text-sm font-medium rounded-lg bg-[var(--btn-primary)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save & Next"}
        </button>
        <button
          onClick={handleExcludeAndNext}
          disabled={saving}
          className="px-5 py-2.5 text-sm font-medium rounded-lg border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-50"
        >
          Exclude & Next
        </button>
        <button
          onClick={skip}
          disabled={saving || currentIndex >= queue.length - 1}
          className="px-5 py-2.5 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]/30 transition-colors disabled:opacity-50"
        >
          Skip
        </button>
        <button
          onClick={handleDismissReports}
          disabled={saving}
          className="px-5 py-2.5 text-sm font-medium rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50 ml-auto"
        >
          Dismiss Reports
        </button>
      </div>
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────

function OverviewTab() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin?tab=overview")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (!data) return <ErrorMsg msg="Failed to load overview" />;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Problems" value={data.totalProblems} sub={`${data.excludedCount} excluded`} />
        <StatCard label="Players" value={data.totalPlayers} sub={`${data.authenticatedPlayers} authenticated`} />
        <StatCard label="Attempts" value={data.totalAttempts} sub={`${data.attemptsThisWeek} this week`} />
        <StatCard label="Reports" value={data.totalReports} sub={Object.entries(data.reportsByType).map(([k, v]) => `${v} ${k.toLowerCase()}`).join(", ") || "none"} />
      </div>

      {/* Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Player Activity">
          <div className="space-y-2 text-sm">
            <Row label="Active today" value={data.activeToday} />
            <Row label="Active this week" value={data.activeThisWeek} />
            <Row label="Authenticated" value={data.authenticatedPlayers} />
            <Row label="Anonymous" value={data.anonymousPlayers} />
          </div>
        </Card>

        <Card title="Reports by Type">
          <div className="space-y-2 text-sm">
            {Object.entries(data.reportsByType).map(([type, count]) => (
              <Row key={type} label={type} value={count} />
            ))}
            {Object.keys(data.reportsByType).length === 0 && (
              <div className="text-[var(--muted)]">No reports yet</div>
            )}
          </div>
        </Card>
      </div>

      {/* Contest breakdown */}
      <Card title="Problems by Contest">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-sm">
          {data.contestCounts.map((c) => (
            <div
              key={c.source}
              className="flex justify-between px-3 py-2 rounded bg-[var(--border)]/20"
            >
              <span className="truncate">{c.source}</span>
              <span className="font-mono text-[var(--muted)] ml-2">{c.count}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Distributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Problem Rating Distribution">
          <BarChart data={data.problemRatingDistribution} />
        </Card>
        <Card title="Player Rating Distribution">
          <BarChart data={data.playerRatingDistribution} />
        </Card>
      </div>
    </div>
  );
}

// ─── Problems Tab ────────────────────────────────────────────────

function ProblemsTab() {
  const [contestList, setContestList] = useState<string[]>([]);
  const [selectedContest, setSelectedContest] = useState<string | null>(null);
  const [problems, setProblems] = useState<AdminProblem[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AdminProblem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedProblem, setExpandedProblem] = useState<string | null>(null);
  const lastSearchQuery = useRef(searchQuery);

  // Fetch contest list on mount
  useEffect(() => {
    fetch("/api/admin?tab=problems")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setContestList(d.data.contestList);
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch problems when contest changes
  const fetchContest = useCallback(async (contest: string) => {
    setSelectedContest(contest);
    setProblems(null);
    setSearchResults(null);
    setSearchQuery("");
    const res = await fetch(
      `/api/admin?tab=problems&contest=${encodeURIComponent(contest)}`
    );
    const d = await res.json();
    if (d.success) setProblems(d.data.problems);
  }, []);

  // Search
  const handleSearch = useCallback(async () => {
    if (searchQuery.length < 3) return;
    lastSearchQuery.current = searchQuery;
    setSelectedContest(null);
    setProblems(null);
    const res = await fetch(
      `/api/admin?tab=problems&search=${encodeURIComponent(searchQuery)}`
    );
    const d = await res.json();
    if (d.success) setSearchResults(d.data.searchResults);
  }, [searchQuery]);

  // Refresh current view after mutations
  const refreshProblems = useCallback(async () => {
    if (selectedContest) {
      const res = await fetch(`/api/admin?tab=problems&contest=${encodeURIComponent(selectedContest)}`);
      const d = await res.json();
      if (d.success) setProblems(d.data.problems);
    } else if (lastSearchQuery.current.length >= 3) {
      const res = await fetch(`/api/admin?tab=problems&search=${encodeURIComponent(lastSearchQuery.current)}`);
      const d = await res.json();
      if (d.success) setSearchResults(d.data.searchResults);
    }
  }, [selectedContest]);

  // Group contests by type
  const grouped = groupContests(contestList);

  if (loading) return <Loading />;

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Search problems..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card-bg)] placeholder:text-[var(--muted)]"
          />
        </div>

        {/* Contest list */}
        <div className="space-y-3 max-h-[calc(100vh-240px)] overflow-y-auto pr-1">
          {Object.entries(grouped).map(([type, years]) => (
            <ContestGroup
              key={type}
              type={type}
              years={years}
              selectedContest={selectedContest}
              onSelect={fetchContest}
            />
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {searchResults ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              Search: &quot;{searchQuery}&quot; ({searchResults.length} results)
            </h2>
            {searchResults.map((p) => (
              <ProblemCard key={p.id} problem={p} expanded={expandedProblem === p.id} onToggle={() => setExpandedProblem(expandedProblem === p.id ? null : p.id)} onUpdate={refreshProblems} />
            ))}
          </div>
        ) : problems ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{selectedContest} ({problems.length} problems)</h2>
            {problems.map((p) => (
              <ProblemCard key={p.id} problem={p} expanded={expandedProblem === p.id} onToggle={() => setExpandedProblem(expandedProblem === p.id ? null : p.id)} onUpdate={refreshProblems} />
            ))}
          </div>
        ) : (
          <div className="text-[var(--muted)] text-center py-20">
            Select a contest or search to browse problems
          </div>
        )}
      </div>
    </div>
  );
}

function ContestGroup({
  type,
  years,
  selectedContest,
  onSelect,
}: {
  type: string;
  years: string[];
  selectedContest: string | null;
  onSelect: (contest: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left text-sm font-semibold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
      >
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-90" : ""}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M6 4l8 6-8 6V4z" />
        </svg>
        {type}
        <span className="text-xs text-[var(--muted)] font-normal">({years.length})</span>
      </button>
      {open && (
        <div className="ml-5 mt-1 space-y-0.5">
          {years.map((year) => {
            const contest = `${year} ${type}`;
            const isSelected = selectedContest === contest;
            return (
              <button
                key={year}
                onClick={() => onSelect(contest)}
                className={`block w-full text-left px-2 py-1 text-sm rounded transition-colors ${
                  isSelected
                    ? "bg-[var(--accent)]/10 text-[var(--accent)] font-medium"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]/30"
                }`}
              >
                {year}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProblemCard({
  problem: p,
  expanded,
  onToggle,
  onUpdate,
}: {
  problem: AdminProblem;
  expanded: boolean;
  onToggle: () => void;
  onUpdate?: () => void;
}) {
  const [editingAnswer, setEditingAnswer] = useState(false);
  const [newAnswer, setNewAnswer] = useState(p.answer);
  const [saving, setSaving] = useState(false);

  const toggleExclude = async () => {
    setSaving(true);
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggleExclude", problemId: p.id }),
    });
    setSaving(false);
    onUpdate?.();
  };

  const saveAnswer = async () => {
    if (newAnswer === p.answer) { setEditingAnswer(false); return; }
    setSaving(true);
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateProblem", problemId: p.id, answer: newAnswer }),
    });
    setSaving(false);
    setEditingAnswer(false);
    onUpdate?.();
  };

  const aopsUrl = p.source && p.sourceNumber
    ? `https://artofproblemsolving.com/wiki/index.php/${p.source.replace(/ /g, "_")}_Problems/Problem_${p.sourceNumber}`
    : null;

  return (
    <div
      className={`rounded-xl border bg-[var(--card-bg)] overflow-hidden transition-colors ${
        p.excluded
          ? "border-amber-500/30 opacity-60"
          : "border-[var(--border)]"
      }`}
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--border)]/20 transition-colors"
      >
        <span className="text-sm font-mono font-bold w-8 text-[var(--muted)]">
          #{p.sourceNumber}
        </span>
        {p.excluded && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
            EXCLUDED
          </span>
        )}
        <span className="flex-1 text-sm truncate text-[var(--foreground)]">
          {p.content.replace(/\$[^$]*\$/g, "[math]").slice(0, 80)}
        </span>
        <span className="text-xs font-mono text-[var(--muted)]">
          ELO {Math.round(p.rating)}
        </span>
        {p.attemptCount != null && (
          <span className="text-xs text-[var(--muted)]">
            {p.attemptCount} att
            {p.accuracy != null && ` · ${p.accuracy}%`}
          </span>
        )}
        {p.reportCount != null && p.reportCount > 0 && (
          <span className="px-1.5 py-0.5 text-[10px] rounded bg-red-500/20 text-red-500">
            {p.reportCount} report{p.reportCount > 1 ? "s" : ""}
          </span>
        )}
        <svg
          className={`w-4 h-4 text-[var(--muted)] transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[var(--border)]/50">
          <div className="pt-4 space-y-4">
            {/* Metadata + Actions */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex flex-wrap gap-2 text-xs">
                <Tag label={p.difficulty} />
                <Tag label={p.answerType === "MULTIPLE_CHOICE" ? "MC" : "FR"} />
                <Tag label={`ELO: ${Math.round(p.rating)}`} />
                {!editingAnswer && (
                  <Tag label={`Answer: ${p.answer}`} accent />
                )}
              </div>
              <div className="flex gap-2">
                {aopsUrl && (
                  <a
                    href={aopsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 text-xs font-medium rounded-md border border-[var(--border)] hover:bg-[var(--border)]/30 transition-colors"
                  >
                    AoPS
                  </a>
                )}
                <button
                  onClick={() => { setEditingAnswer(!editingAnswer); setNewAnswer(p.answer); }}
                  className="px-2.5 py-1 text-xs font-medium rounded-md border border-[var(--border)] hover:bg-[var(--border)]/30 transition-colors"
                >
                  {editingAnswer ? "Cancel" : "Edit Answer"}
                </button>
                <button
                  onClick={toggleExclude}
                  disabled={saving}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors disabled:opacity-50 ${
                    p.excluded
                      ? "border-green-500/30 text-green-500 hover:bg-green-500/10"
                      : "border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                  }`}
                >
                  {p.excluded ? "Unexclude" : "Exclude"}
                </button>
              </div>
            </div>

            {/* Answer editor */}
            {editingAnswer && (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm rounded-md border border-[var(--border)] bg-[var(--background)]"
                  autoFocus
                />
                <button
                  onClick={saveAnswer}
                  disabled={saving}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--btn-primary)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            )}

            {/* Problem rendered */}
            <div className="rounded-lg border border-[var(--border)]/50 bg-[var(--background)] p-6">
              <Problem content={p.content} source={p.source} sourceNumber={p.sourceNumber} />

              {/* Choices in result mode */}
              {p.answerType === "MULTIPLE_CHOICE" && p.choices.length > 0 && (
                <div className="mt-4">
                  <MultipleChoiceForm
                    choices={p.choices}
                    onSubmit={async () => {}}
                    resultMode={{ correctAnswer: p.answer, userAnswer: "" }}
                  />
                </div>
              )}

              {/* FR answer */}
              {p.answerType === "FREE_RESPONSE" && (
                <div className="mt-4 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-sm">
                  Answer: <span className="font-bold">{p.answer}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reports Tab ─────────────────────────────────────────────────

function ReportsTab() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    const res = await fetch("/api/admin?tab=reports");
    const d = await res.json();
    if (d.success) setReports(d.data.reports);
  }, []);

  useEffect(() => {
    fetchReports().finally(() => setLoading(false));
  }, [fetchReports]);

  const dismissReport = async (reportId: string) => {
    setActionLoading(reportId);
    try {
      await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteReport", reportId }),
      });
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      if (expandedReport === reportId) setExpandedReport(null);
    } finally {
      setActionLoading(null);
    }
  };

  const excludeProblem = async (problemId: string) => {
    setActionLoading(problemId);
    try {
      await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleExclude", problemId }),
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <Loading />;
  if (reports.length === 0) {
    return (
      <div className="text-center py-20 text-[var(--muted)]">
        No reports submitted yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold mb-4">{reports.length} Reports</h2>
      {reports.map((r) => (
        <div
          key={r.id}
          className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden"
          style={{ boxShadow: "var(--card-shadow)" }}
        >
          <div className="flex items-center">
            <button
              onClick={() =>
                setExpandedReport(expandedReport === r.id ? null : r.id)
              }
              className="flex-1 flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--border)]/20 transition-colors"
            >
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                  r.type === "WRONG_ANSWER"
                    ? "bg-red-500/20 text-red-500"
                    : r.type === "FORMATTING"
                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                    : "bg-blue-500/20 text-blue-500"
                }`}
              >
                {r.type}
              </span>
              <span className="flex-1 text-sm truncate">
                {r.problem.source} #{r.problem.sourceNumber}
              </span>
              {r.details && (
                <span className="text-xs text-[var(--muted)] truncate max-w-[200px]">
                  {r.details}
                </span>
              )}
              <span className="text-xs text-[var(--muted)]">
                {timeAgo(r.createdAt)}
              </span>
              <svg
                className={`w-4 h-4 text-[var(--muted)] transition-transform ${
                  expandedReport === r.id ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {/* Quick actions in header */}
            <div className="flex gap-1 px-3" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => dismissReport(r.id)}
                disabled={actionLoading === r.id}
                className="px-2 py-1 text-[10px] font-medium rounded border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]/30 transition-colors disabled:opacity-50"
                title="Dismiss report"
              >
                Dismiss
              </button>
            </div>
          </div>

          {expandedReport === r.id && (
            <div className="px-4 pb-4 border-t border-[var(--border)]/50">
              <div className="pt-4 space-y-3">
                {r.details && (
                  <div className="text-sm px-3 py-2 rounded bg-[var(--border)]/20">
                    {r.details}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-[var(--muted)] space-y-1">
                    <div>Reporter: {r.player ? `Player ${r.player.id.slice(0, 8)}... (${Math.round(r.player.rating)} ELO)` : "Anonymous"}</div>
                    <div>Correct answer: <span className="font-bold">{r.problem.answer}</span></div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => excludeProblem(r.problem.id)}
                      disabled={actionLoading === r.problem.id}
                      className="px-2.5 py-1 text-xs font-medium rounded-md border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-50"
                    >
                      Exclude Problem
                    </button>
                    <button
                      onClick={() => dismissReport(r.id)}
                      disabled={actionLoading === r.id}
                      className="px-2.5 py-1 text-xs font-medium rounded-md border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      Dismiss Report
                    </button>
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--border)]/50 bg-[var(--background)] p-5">
                  <Problem
                    content={r.problem.content}
                    source={r.problem.source}
                    sourceNumber={r.problem.sourceNumber}
                  />
                  {r.problem.answerType === "MULTIPLE_CHOICE" && r.problem.choices.length > 0 && (
                    <div className="mt-4">
                      <MultipleChoiceForm
                        choices={r.problem.choices}
                        onSubmit={async () => {}}
                        resultMode={{ correctAnswer: r.problem.answer, userAnswer: "" }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Players Tab ─────────────────────────────────────────────────

function PlayersTab() {
  const [players, setPlayers] = useState<PlayerItem[]>([]);
  const [summary, setSummary] = useState<{
    totalPlayers: number;
    activeToday: number;
    activeThisWeek: number;
    averageRating: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [playerDetail, setPlayerDetail] = useState<PlayerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirming, setConfirming] = useState<{ id: string; action: "delete" | "reset" } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPlayers = useCallback(async () => {
    const res = await fetch("/api/admin?tab=players");
    const d = await res.json();
    if (d.success) {
      setPlayers(d.data.players);
      setSummary(d.data.summary);
    }
  }, []);

  useEffect(() => {
    fetchPlayers().finally(() => setLoading(false));
  }, [fetchPlayers]);

  const handleExpandPlayer = async (playerId: string) => {
    if (expandedPlayer === playerId) {
      setExpandedPlayer(null);
      setPlayerDetail(null);
      return;
    }
    setExpandedPlayer(playerId);
    setPlayerDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getPlayerDetail", playerId }),
      });
      const d = await res.json();
      if (d.success) setPlayerDetail(d.data);
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePlayerAction = async (playerId: string, action: "delete" | "reset") => {
    setActionLoading(true);
    try {
      await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: action === "delete" ? "deletePlayer" : "resetPlayer", playerId }),
      });
      setConfirming(null);
      setExpandedPlayer(null);
      setPlayerDetail(null);
      await fetchPlayers();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Players" value={summary.totalPlayers} />
          <StatCard label="Active Today" value={summary.activeToday} />
          <StatCard label="Active This Week" value={summary.activeThisWeek} />
          <StatCard label="Avg Rating" value={summary.averageRating} />
        </div>
      )}

      {/* Table */}
      {players.length === 0 ? (
        <div className="text-center py-20 text-[var(--muted)]">No players yet</div>
      ) : (
        <Card title="Leaderboard">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Player</th>
                  <th className="px-3 py-2 font-medium">Tier</th>
                  <th className="px-3 py-2 font-medium">Rating</th>
                  <th className="px-3 py-2 font-medium">RD</th>
                  <th className="px-3 py-2 font-medium">Games</th>
                  <th className="px-3 py-2 font-medium">Accuracy</th>
                  <th className="px-3 py-2 font-medium">Last Active</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p) => {
                  const tier = getTier(p.rating);
                  const isExpanded = expandedPlayer === p.id;
                  return (
                    <React.Fragment key={p.id}>
                      <tr
                        className={`border-b border-[var(--border)]/50 hover:bg-[var(--border)]/10 cursor-pointer ${isExpanded ? "bg-[var(--border)]/10" : ""}`}
                        onClick={() => handleExpandPlayer(p.id)}
                      >
                        <td className="px-3 py-2 font-mono">{p.rank}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {p.username ? (
                              <span className="font-medium">@{p.username}</span>
                            ) : (
                              <span className="text-[var(--muted)] text-xs">
                                {p.id.slice(0, 8)}...
                              </span>
                            )}
                            {p.authenticated && (
                              <span className="px-1 py-0.5 text-[9px] font-bold rounded bg-green-500/15 text-green-500">
                                AUTH
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <TierIcon tier={tier.name} size={16} className={tier.color} />
                            <span className={`text-xs font-medium ${tier.color}`}>
                              {tier.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 font-mono font-bold">
                          {Math.round(p.rating)}
                        </td>
                        <td className="px-3 py-2 font-mono text-[var(--muted)]">
                          {Math.round(p.ratingDeviation)}
                        </td>
                        <td className="px-3 py-2 font-mono">{p.gamesPlayed}</td>
                        <td className="px-3 py-2 font-mono">
                          {p.accuracy != null ? `${p.accuracy}%` : "—"}
                        </td>
                        <td className="px-3 py-2 text-[var(--muted)]">
                          {timeAgo(p.lastActiveAt)}
                        </td>
                        <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setConfirming({ id: p.id, action: "reset" })}
                              className="px-2 py-1 text-[10px] font-medium rounded border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
                              title="Reset rating & delete attempts"
                            >
                              Reset
                            </button>
                            <button
                              onClick={() => setConfirming({ id: p.id, action: "delete" })}
                              className="px-2 py-1 text-[10px] font-medium rounded border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
                              title="Delete player entirely"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="px-4 py-4 bg-[var(--border)]/5 border-b border-[var(--border)]/50">
                            {detailLoading ? (
                              <div className="text-sm text-[var(--muted)]">Loading player data...</div>
                            ) : playerDetail ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <div className="text-[var(--muted)] text-xs">ID</div>
                                    <div className="font-mono text-xs">{playerDetail.id}</div>
                                  </div>
                                  <div>
                                    <div className="text-[var(--muted)] text-xs">Username</div>
                                    <div>{playerDetail.username ? `@${playerDetail.username}` : "—"}</div>
                                  </div>
                                  <div>
                                    <div className="text-[var(--muted)] text-xs">Firebase</div>
                                    <div>{playerDetail.firebaseUid ? "Linked" : "Anonymous"}</div>
                                  </div>
                                  <div>
                                    <div className="text-[var(--muted)] text-xs">Joined</div>
                                    <div>{new Date(playerDetail.createdAt).toLocaleDateString()}</div>
                                  </div>
                                </div>

                                {/* Recent attempts */}
                                {playerDetail.recentAttempts.length > 0 && (
                                  <div>
                                    <div className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-2">
                                      Recent Attempts ({playerDetail.recentAttempts.length})
                                    </div>
                                    <div className="max-h-60 overflow-y-auto rounded border border-[var(--border)]/50">
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                                            <th className="px-2 py-1.5">Result</th>
                                            <th className="px-2 py-1.5">Problem</th>
                                            <th className="px-2 py-1.5">Rating</th>
                                            <th className="px-2 py-1.5">Change</th>
                                            <th className="px-2 py-1.5">When</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {playerDetail.recentAttempts.map((a, i) => {
                                            const change = a.ratingAfter - a.ratingBefore;
                                            return (
                                              <tr key={i} className="border-b border-[var(--border)]/30">
                                                <td className="px-2 py-1.5">
                                                  <span className={a.correct ? "text-green-500" : "text-red-500"}>
                                                    {a.correct ? "✓" : "✗"}
                                                  </span>
                                                </td>
                                                <td className="px-2 py-1.5 font-mono">
                                                  {a.source ? `${a.source} #${a.sourceNumber}` : "—"}
                                                </td>
                                                <td className="px-2 py-1.5 font-mono">
                                                  {Math.round(a.ratingAfter)}
                                                </td>
                                                <td className={`px-2 py-1.5 font-mono font-bold ${change >= 0 ? "text-green-500" : "text-red-500"}`}>
                                                  {change >= 0 ? "+" : ""}{Math.round(change)}
                                                </td>
                                                <td className="px-2 py-1.5 text-[var(--muted)]">
                                                  {timeAgo(a.createdAt)}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-[var(--error)]">Failed to load player data</div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Confirmation dialog */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setConfirming(null)}>
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border)] p-6 max-w-sm mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">
              {confirming.action === "delete" ? "Delete Player?" : "Reset Player?"}
            </h3>
            <p className="text-sm text-[var(--muted)]">
              {confirming.action === "delete"
                ? "This will permanently delete this player and all their attempts. This cannot be undone."
                : "This will reset the player's rating to 1200 and delete all their attempts. This cannot be undone."}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirming(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePlayerAction(confirming.id, confirming.action)}
                disabled={actionLoading}
                className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-50 ${
                  confirming.action === "delete"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-amber-500 hover:bg-amber-600"
                }`}
              >
                {actionLoading ? "Working..." : confirming.action === "delete" ? "Delete" : "Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Health Tab ──────────────────────────────────────────────────

function HealthTab() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin?tab=health")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (!data) return <ErrorMsg msg="Failed to load health data" />;

  return (
    <div className="space-y-6">
      {/* Broken */}
      <Card title={`Excluded Problems (${data.broken.length})`}>
        {data.broken.length === 0 ? (
          <div className="text-sm text-[var(--muted)]">All problems are healthy</div>
        ) : (
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {data.broken.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-3 py-2 rounded bg-[var(--border)]/10 text-sm"
              >
                <span className="font-mono w-32 flex-shrink-0 truncate">
                  {p.source} #{p.sourceNumber}
                </span>
                <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  {p.reason}
                </span>
                <span className="flex-1 truncate text-[var(--muted)] text-xs">
                  {p.content}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Low accuracy */}
      <Card title={`Low Accuracy — <20% (${data.lowAccuracy.length})`}>
        {data.lowAccuracy.length === 0 ? (
          <div className="text-sm text-[var(--muted)]">No low-accuracy problems</div>
        ) : (
          <HealthTable
            items={data.lowAccuracy}
            columns={["source", "rating", "attempts", "accuracy"]}
          />
        )}
      </Card>

      {/* High accuracy */}
      <Card title={`High Accuracy — >95% (${data.highAccuracy.length})`}>
        {data.highAccuracy.length === 0 ? (
          <div className="text-sm text-[var(--muted)]">No high-accuracy problems</div>
        ) : (
          <HealthTable
            items={data.highAccuracy}
            columns={["source", "rating", "attempts", "accuracy"]}
          />
        )}
      </Card>

      {/* Rating drift */}
      <Card title={`Rating Drift >500 (${data.drifted.length})`}>
        {data.drifted.length === 0 ? (
          <div className="text-sm text-[var(--muted)]">No significant rating drift</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                  <th className="px-3 py-2 font-medium">Problem</th>
                  <th className="px-3 py-2 font-medium">Difficulty</th>
                  <th className="px-3 py-2 font-medium">Current ELO</th>
                  <th className="px-3 py-2 font-medium">Drift</th>
                </tr>
              </thead>
              <tbody>
                {data.drifted.slice(0, 50).map((p) => (
                  <tr key={p.id} className="border-b border-[var(--border)]/50">
                    <td className="px-3 py-2 font-mono">{p.source} #{p.sourceNumber}</td>
                    <td className="px-3 py-2">{p.difficulty}</td>
                    <td className="px-3 py-2 font-mono">{Math.round(p.rating)}</td>
                    <td className={`px-3 py-2 font-mono font-bold ${p.drift > 0 ? "text-red-500" : "text-blue-500"}`}>
                      {p.drift > 0 ? "+" : ""}{p.drift}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Most reported */}
      <Card title={`Most Reported (${data.mostReported.length})`}>
        {data.mostReported.length === 0 ? (
          <div className="text-sm text-[var(--muted)]">No reported problems</div>
        ) : (
          <div className="space-y-1">
            {data.mostReported.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-3 py-2 rounded bg-[var(--border)]/10 text-sm"
              >
                <span className="font-mono flex-shrink-0">
                  {p.source} #{p.sourceNumber}
                </span>
                <span className="px-1.5 py-0.5 text-[10px] rounded bg-red-500/20 text-red-500 font-bold">
                  {p.reportCount} report{p.reportCount > 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Shared Components ───────────────────────────────────────────

function Loading() {
  return (
    <div className="text-center py-20 text-[var(--muted)]">Loading...</div>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <div className="text-center py-20 text-[var(--error)]">{msg}</div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 sm:p-5"
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      <div className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-3">
        {title}
      </div>
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div
      className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4"
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      <div className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-3xl font-bold tabular-nums">
        {value.toLocaleString()}
      </div>
      {sub && <div className="text-xs text-[var(--muted)] mt-1">{sub}</div>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="font-mono font-medium">{value}</span>
    </div>
  );
}

function Tag({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${
        accent
          ? "bg-[var(--accent)]/15 text-[var(--accent)]"
          : "bg-[var(--border)]/50 text-[var(--muted)]"
      }`}
    >
      {label}
    </span>
  );
}

function BarChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort(
    (a, b) => parseInt(a[0]) - parseInt(b[0])
  );
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="space-y-1">
      {entries.map(([label, value]) => (
        <div key={label} className="flex items-center gap-2 text-xs">
          <span className="w-20 text-right font-mono text-[var(--muted)]">
            {label}
          </span>
          <div className="flex-1 h-4 bg-[var(--border)]/30 rounded overflow-hidden">
            <div
              className="h-full bg-[var(--accent)]/60 rounded"
              style={{ width: `${(value / max) * 100}%` }}
            />
          </div>
          <span className="w-8 font-mono text-[var(--muted)]">{value}</span>
        </div>
      ))}
    </div>
  );
}

function HealthTable({
  items,
  columns,
}: {
  items: Array<Record<string, unknown>>;
  columns: string[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
            {columns.map((c) => (
              <th key={c} className="px-3 py-2 font-medium capitalize">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.slice(0, 50).map((item, i) => (
            <tr key={i} className="border-b border-[var(--border)]/50">
              {columns.map((c) => (
                <td key={c} className="px-3 py-2 font-mono">
                  {c === "source"
                    ? `${item.source} #${item.sourceNumber}`
                    : c === "accuracy"
                    ? `${item[c]}%`
                    : c === "rating"
                    ? Math.round(item[c] as number)
                    : String(item[c] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Group contest names like "2024 AMC 8" into { "AMC 8": ["2024", "2023", ...] }
 */
function groupContests(contests: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const c of contests) {
    const match = c.match(/^(\d{4})\s+(.+)$/);
    if (match) {
      const [, year, type] = match;
      if (!groups[type]) groups[type] = [];
      groups[type].push(year);
    }
  }
  // Sort years descending within each group
  for (const type of Object.keys(groups)) {
    groups[type].sort((a, b) => parseInt(b) - parseInt(a));
  }
  return groups;
}
