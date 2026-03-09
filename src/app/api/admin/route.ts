import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminAuth } from "@/lib/firebase-admin";
import { checkRateLimit } from "@/lib/rate-limit";

// ─── Admin Auth Helper ───────────────────────────────────────────

const ADMIN_EMAILS =
  process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) ?? [];

async function verifyAdmin(
  request: NextRequest
): Promise<
  | { authorized: true; email: string }
  | { authorized: false; response: NextResponse }
> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Missing or invalid Authorization header" },
        { status: 401 }
      ),
    };
  }

  const idToken = authHeader.slice(7);

  let decoded;
  try {
    decoded = await getAdminAuth().verifyIdToken(idToken);
  } catch {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      ),
    };
  }

  const email = decoded.email?.toLowerCase();
  if (!email || !ADMIN_EMAILS.includes(email)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Forbidden: not an admin" },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, email };
}

/**
 * GET /api/admin?tab=...
 *
 * Admin API — returns data for each dashboard tab.
 * Requires admin authentication via Firebase ID token.
 */
export async function GET(request: NextRequest) {
  // Rate limit
  const rateLimited = checkRateLimit(request, { limit: 30 });
  if (rateLimited) return rateLimited;

  // Auth guard
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  const tab = request.nextUrl.searchParams.get("tab") ?? "overview";

  try {
    switch (tab) {
      case "overview":
        return NextResponse.json({ success: true, data: await getOverview() });
      case "problems":
        return NextResponse.json({
          success: true,
          data: await getProblems(request.nextUrl.searchParams),
        });
      case "reports":
        return NextResponse.json({ success: true, data: await getReports() });
      case "players":
        return NextResponse.json({ success: true, data: await getPlayers() });
      case "health":
        return NextResponse.json({ success: true, data: await getHealth() });
      default:
        return NextResponse.json(
          { success: false, error: `Unknown tab: ${tab}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin
 *
 * Admin mutations — toggle exclusion, update problems, manage players/reports.
 * Requires admin authentication via Firebase ID token.
 */
export async function POST(request: NextRequest) {
  // Rate limit
  const rateLimited = checkRateLimit(request, { limit: 30 });
  if (rateLimited) return rateLimited;

  // Auth guard
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "toggleExclude": {
        const { problemId } = body;
        const problem = await prisma.problem.findUnique({ where: { id: problemId }, select: { excluded: true } });
        if (!problem) return NextResponse.json({ success: false, error: "Problem not found" }, { status: 404 });
        const updated = await prisma.problem.update({
          where: { id: problemId },
          data: { excluded: !problem.excluded },
          select: { id: true, excluded: true },
        });
        return NextResponse.json({ success: true, data: updated });
      }
      case "updateProblem": {
        const { problemId, answer, content } = body;
        const data: Record<string, string> = {};
        if (answer !== undefined) data.answer = answer;
        if (content !== undefined) data.content = content;
        if (Object.keys(data).length === 0) {
          return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
        }
        const updated = await prisma.problem.update({ where: { id: problemId }, data });
        return NextResponse.json({ success: true, data: { id: updated.id, answer: updated.answer } });
      }
      case "deletePlayer": {
        const { playerId } = body;
        await prisma.player.delete({ where: { id: playerId } });
        return NextResponse.json({ success: true });
      }
      case "resetPlayer": {
        const { playerId } = body;
        await prisma.player.update({
          where: { id: playerId },
          data: { rating: 1200, ratingDeviation: 350, volatility: 0.06, gamesPlayed: 0 },
        });
        await prisma.attempt.deleteMany({ where: { playerId } });
        return NextResponse.json({ success: true });
      }
      case "deleteReport": {
        const { reportId } = body;
        await prisma.report.delete({ where: { id: reportId } });
        return NextResponse.json({ success: true });
      }
      case "getPlayerDetail": {
        const { playerId } = body;
        const player = await prisma.player.findUnique({
          where: { id: playerId },
          include: {
            attempts: { orderBy: { createdAt: "desc" }, take: 30, include: { problem: { select: { source: true, sourceNumber: true, content: true } } } },
          },
        });
        if (!player) return NextResponse.json({ success: false, error: "Player not found" }, { status: 404 });
        return NextResponse.json({
          success: true,
          data: {
            id: player.id,
            username: player.username,
            displayName: player.displayName,
            rating: player.rating,
            ratingDeviation: player.ratingDeviation,
            gamesPlayed: player.gamesPlayed,
            firebaseUid: player.firebaseUid ? "***" : null,
            createdAt: player.createdAt.toISOString(),
            lastActiveAt: player.lastActiveAt.toISOString(),
            recentAttempts: player.attempts.map((a) => ({
              correct: a.correct,
              ratingBefore: a.ratingBefore,
              ratingAfter: a.ratingAfter,
              source: a.problem.source,
              sourceNumber: a.problem.sourceNumber,
              createdAt: a.createdAt.toISOString(),
            })),
          },
        });
      }
      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin POST error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ─── Overview ────────────────────────────────────────────────────

async function getOverview() {
  const [
    totalProblems,
    totalPlayers,
    totalAttempts,
    totalReports,
    reportsByType,
    contestCounts,
    authenticatedPlayers,
    recentAttempts,
  ] = await Promise.all([
    prisma.problem.count(),
    prisma.player.count(),
    prisma.attempt.count(),
    prisma.report.count(),
    prisma.report.groupBy({ by: ["type"], _count: true }),
    prisma.problem.groupBy({ by: ["source"], _count: true, orderBy: { source: "asc" } }),
    prisma.player.count({ where: { firebaseUid: { not: null } } }),
    prisma.attempt.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [activeToday, activeThisWeek] = await Promise.all([
    prisma.player.count({ where: { lastActiveAt: { gte: todayStart } } }),
    prisma.player.count({ where: { lastActiveAt: { gte: weekAgo } } }),
  ]);

  // Problem rating distribution (buckets of 200)
  const allRatings = await prisma.problem.findMany({ select: { rating: true } });
  const ratingBuckets: Record<string, number> = {};
  for (const p of allRatings) {
    const bucket = Math.floor(p.rating / 200) * 200;
    const label = `${bucket}-${bucket + 199}`;
    ratingBuckets[label] = (ratingBuckets[label] || 0) + 1;
  }

  // Player rating distribution
  const playerRatings = await prisma.player.findMany({ select: { rating: true } });
  const playerBuckets: Record<string, number> = {};
  for (const p of playerRatings) {
    const bucket = Math.floor(p.rating / 200) * 200;
    const label = `${bucket}-${bucket + 199}`;
    playerBuckets[label] = (playerBuckets[label] || 0) + 1;
  }

  // Excluded problem count
  const excludedCount = await getExcludedCount();

  return {
    totalProblems,
    excludedCount,
    totalPlayers,
    authenticatedPlayers,
    anonymousPlayers: totalPlayers - authenticatedPlayers,
    activeToday,
    activeThisWeek,
    totalAttempts,
    attemptsThisWeek: recentAttempts,
    totalReports,
    reportsByType: Object.fromEntries(
      reportsByType.map((r) => [r.type, r._count])
    ),
    contestCounts: contestCounts
      .filter((c) => c.source !== null)
      .map((c) => ({ source: c.source!, count: c._count })),
    problemRatingDistribution: ratingBuckets,
    playerRatingDistribution: playerBuckets,
  };
}

// ─── Problems ────────────────────────────────────────────────────

async function getProblems(params: URLSearchParams) {
  const contest = params.get("contest");
  const search = params.get("search");

  // List of all distinct contests
  const contests = await prisma.problem.findMany({
    distinct: ["source"],
    select: { source: true },
    orderBy: { source: "asc" },
  });
  const contestList = contests
    .map((c) => c.source)
    .filter((s): s is string => s !== null);

  // If a contest is selected, return its problems
  let problems = null;
  if (contest) {
    const raw = await prisma.problem.findMany({
      where: { source: contest },
      orderBy: { sourceNumber: "asc" },
      include: {
        _count: { select: { attempts: true, reports: true } },
      },
    });

    // Get accuracy per problem via raw SQL (Prisma can't sum booleans)
    const problemIds = raw.map((p) => p.id);
    const accuracyData = problemIds.length > 0
      ? await prisma.$queryRaw<Array<{ problemId: string; total: bigint; correct: bigint }>>`
          SELECT "problemId", COUNT(*) as total, SUM(CASE WHEN correct THEN 1 ELSE 0 END) as correct
          FROM "Attempt" WHERE "problemId" = ANY(${problemIds}) GROUP BY "problemId"
        `
      : [];
    const accuracyMap = new Map(
      accuracyData.map((a) => [
        a.problemId,
        { attempts: Number(a.total), correct: Number(a.correct) },
      ])
    );

    problems = raw.map((p) => {
      const acc = accuracyMap.get(p.id);
      return {
        id: p.id,
        content: p.content,
        answer: p.answer,
        answerType: p.answerType,
        choices: p.choices,
        rating: p.rating,
        difficulty: p.difficulty,
        source: p.source,
        sourceNumber: p.sourceNumber,
        attemptCount: p._count.attempts,
        reportCount: p._count.reports,
        accuracy: acc
          ? acc.attempts > 0
            ? Math.round((acc.correct / acc.attempts) * 100)
            : null
          : null,
        excluded: p.excluded || isProblemExcluded(p.content),
      };
    });
  }

  // Search across all problems
  let searchResults = null;
  if (search && search.length >= 3) {
    const raw = await prisma.problem.findMany({
      where: { content: { contains: search, mode: "insensitive" } },
      take: 50,
      orderBy: { source: "asc" },
    });
    searchResults = raw.map((p) => ({
      id: p.id,
      content: p.content,
      answer: p.answer,
      answerType: p.answerType,
      choices: p.choices,
      rating: p.rating,
      difficulty: p.difficulty,
      source: p.source,
      sourceNumber: p.sourceNumber,
      excluded: p.excluded || isProblemExcluded(p.content),
    }));
  }

  return { contestList, problems, searchResults };
}

// ─── Reports ─────────────────────────────────────────────────────

async function getReports() {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      problem: {
        select: {
          content: true,
          source: true,
          sourceNumber: true,
          answer: true,
          answerType: true,
          choices: true,
        },
      },
      player: { select: { id: true, rating: true, firebaseUid: true } },
    },
  });

  return {
    reports: reports.map((r) => ({
      id: r.id,
      type: r.type,
      details: r.details,
      createdAt: r.createdAt.toISOString(),
      problem: {
        id: r.problemId,
        content: r.problem.content,
        source: r.problem.source,
        sourceNumber: r.problem.sourceNumber,
        answer: r.problem.answer,
        answerType: r.problem.answerType,
        choices: r.problem.choices,
      },
      player: r.player
        ? {
            id: r.player.id,
            rating: r.player.rating,
            authenticated: r.player.firebaseUid !== null,
          }
        : null,
    })),
    totalCount: reports.length,
  };
}

// ─── Players ─────────────────────────────────────────────────────

async function getPlayers() {
  const players = await prisma.player.findMany({
    orderBy: { rating: "desc" },
    include: {
      _count: { select: { attempts: true } },
    },
  });

  // Get accuracy per player via raw SQL
  const playerAccuracyData = await prisma.$queryRaw<Array<{ playerId: string; total: bigint; correct: bigint }>>`
    SELECT "playerId", COUNT(*) as total, SUM(CASE WHEN correct THEN 1 ELSE 0 END) as correct
    FROM "Attempt" GROUP BY "playerId"
  `;
  const accuracyMap = new Map(
    playerAccuracyData.map((a) => [
      a.playerId,
      { attempts: Number(a.total), correct: Number(a.correct) },
    ])
  );

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return {
    players: players.map((p, i) => {
      const acc = accuracyMap.get(p.id);
      return {
        rank: i + 1,
        id: p.id,
        username: p.username,
        displayName: p.displayName,
        rating: p.rating,
        ratingDeviation: p.ratingDeviation,
        gamesPlayed: p.gamesPlayed,
        authenticated: p.firebaseUid !== null,
        accuracy:
          acc && acc.attempts > 0
            ? Math.round((acc.correct / acc.attempts) * 100)
            : null,
        lastActiveAt: p.lastActiveAt.toISOString(),
        createdAt: p.createdAt.toISOString(),
      };
    }),
    summary: {
      totalPlayers: players.length,
      activeToday: players.filter((p) => p.lastActiveAt >= todayStart).length,
      activeThisWeek: players.filter((p) => p.lastActiveAt >= weekAgo).length,
      averageRating:
        players.length > 0
          ? Math.round(
              players.reduce((s, p) => s + p.rating, 0) / players.length
            )
          : 0,
    },
  };
}

// ─── Health ──────────────────────────────────────────────────────

async function getHealth() {
  const allProblems = await prisma.problem.findMany({
    select: {
      id: true,
      content: true,
      source: true,
      sourceNumber: true,
      rating: true,
      difficulty: true,
      _count: { select: { attempts: true, reports: true } },
    },
  });

  // Get accuracy per problem via raw SQL
  const healthAccuracyData = await prisma.$queryRaw<Array<{ problemId: string; total: bigint; correct: bigint }>>`
    SELECT "problemId", COUNT(*) as total, SUM(CASE WHEN correct THEN 1 ELSE 0 END) as correct
    FROM "Attempt" GROUP BY "problemId"
  `;
  const accuracyMap = new Map(
    healthAccuracyData.map((a) => [
      a.problemId,
      { attempts: Number(a.total), correct: Number(a.correct) },
    ])
  );

  // Broken/excluded (content heuristic + DB flag)
  // We need the excluded flag from DB too
  const excludedFromDb = await prisma.problem.findMany({
    where: { excluded: true },
    select: { id: true },
  });
  const dbExcludedIds = new Set(excludedFromDb.map((p) => p.id));

  const broken = allProblems
    .filter((p) => dbExcludedIds.has(p.id) || isProblemExcluded(p.content))
    .map((p) => ({
      id: p.id,
      source: p.source,
      sourceNumber: p.sourceNumber,
      reason: dbExcludedIds.has(p.id) && !isProblemExcluded(p.content) ? "Admin excluded" : getExclusionReason(p.content),
      content: p.content.substring(0, 100),
    }));

  // Low accuracy (<20%, >10 attempts)
  const lowAccuracy = allProblems
    .filter((p) => {
      const acc = accuracyMap.get(p.id);
      return acc && acc.attempts >= 10 && acc.correct / acc.attempts < 0.2;
    })
    .map((p) => {
      const acc = accuracyMap.get(p.id)!;
      return {
        id: p.id,
        source: p.source,
        sourceNumber: p.sourceNumber,
        rating: p.rating,
        attempts: acc.attempts,
        accuracy: Math.round((acc.correct / acc.attempts) * 100),
      };
    });

  // High accuracy (>95%, >10 attempts)
  const highAccuracy = allProblems
    .filter((p) => {
      const acc = accuracyMap.get(p.id);
      return acc && acc.attempts >= 10 && acc.correct / acc.attempts > 0.95;
    })
    .map((p) => {
      const acc = accuracyMap.get(p.id)!;
      return {
        id: p.id,
        source: p.source,
        sourceNumber: p.sourceNumber,
        rating: p.rating,
        attempts: acc.attempts,
        accuracy: Math.round((acc.correct / acc.attempts) * 100),
      };
    });

  // Rating drift (>500 from seed). Seed ratings are based on difficulty:
  // EASY: 800-1200, MEDIUM: 1200-1600, HARD: 1600-2200
  const seedCenter: Record<string, number> = {
    EASY: 1000,
    MEDIUM: 1400,
    HARD: 1900,
  };
  const drifted = allProblems
    .filter((p) => {
      const center = seedCenter[p.difficulty] ?? 1400;
      return Math.abs(p.rating - center) > 500;
    })
    .map((p) => ({
      id: p.id,
      source: p.source,
      sourceNumber: p.sourceNumber,
      rating: p.rating,
      difficulty: p.difficulty,
      drift: Math.round(p.rating - (seedCenter[p.difficulty] ?? 1400)),
    }));

  // Most reported
  const mostReported = allProblems
    .filter((p) => p._count.reports > 0)
    .sort((a, b) => b._count.reports - a._count.reports)
    .slice(0, 20)
    .map((p) => ({
      id: p.id,
      source: p.source,
      sourceNumber: p.sourceNumber,
      reportCount: p._count.reports,
    }));

  return {
    broken,
    lowAccuracy,
    highAccuracy,
    drifted,
    mostReported,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────

function isProblemExcluded(content: string): boolean {
  if (content.trim().length === 0) return true;
  if (content.includes("[Diagram not available]")) return true;
  if (/Image:/i.test(content)) return true;
  if (content.includes("European stamps were issued in the")) return true;
  if (content.includes("South American stamps issued before")) return true;
  if (content.includes("average price of his '70s stamps")) return true;
  if (content.includes("batch of Trisha's cookies")) return true;
  if (content.includes("area of the small kite")) return true;
  if (content.trimEnd().endsWith("value of the expression:")) return true;
  if (content.trimEnd().endsWith("value of the following expression?")) return true;
  return false;
}

function getExclusionReason(content: string): string {
  if (content.trim().length === 0) return "Empty content";
  if (content.includes("[Diagram not available]")) return "Diagram not available";
  if (/Image:/i.test(content)) return "Unreferenced wiki image";
  if (
    content.includes("European stamps") ||
    content.includes("South American stamps") ||
    content.includes("'70s stamps") ||
    content.includes("Trisha's cookies") ||
    content.includes("area of the small kite")
  )
    return "Missing shared context (table/chart/diagram)";
  if (
    content.trimEnd().endsWith("value of the expression:") ||
    content.trimEnd().endsWith("value of the following expression?")
  )
    return "Missing expression/figure";
  return "Unknown";
}

async function getExcludedCount(): Promise<number> {
  const all = await prisma.problem.findMany({ select: { content: true, excluded: true } });
  return all.filter((p) => p.excluded || isProblemExcluded(p.content)).length;
}
