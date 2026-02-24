import { prisma } from "./db";
import type { Problem } from "@/types";

/**
 * Problem Selection Logic
 *
 * Selects the next problem for a player based on their rating.
 * Strategy: Never repeat a problem until all have been attempted,
 * then fall back to least-recently-attempted problems.
 */

interface SelectProblemOptions {
  playerId: string;
  playerRating: number;
}

/**
 * Select the next problem for a player
 *
 * Algorithm:
 * 1. Get ALL distinct problem IDs the player has ever attempted
 * 2. Find problems NOT in that set, pick closest to player's rating
 * 3. If all exhausted: LRU fallback — pick from 20 least-recently-attempted,
 *    then choose closest-rated among those
 */
export async function selectNextProblem(
  options: SelectProblemOptions
): Promise<Problem | null> {
  const { playerId, playerRating } = options;

  // Step 1: Get all distinct problem IDs this player has ever attempted
  const attemptedRaw = await prisma.attempt.findMany({
    where: { playerId },
    distinct: ["problemId"],
    select: { problemId: true },
  });
  const attemptedIds = attemptedRaw.map((a: { problemId: string }) => a.problemId);

  // Step 2: Find problems NOT yet attempted, excluding broken ones
  // Broken = empty content, unreferenced wiki images, missing diagrams/tables/charts
  const excludeFilter = {
    AND: [
      { NOT: { content: "" } },
      { NOT: { content: { contains: "[Diagram not available]" } } },
      { NOT: { content: { contains: "Image:" } } },
      // Shared-context problems missing their table/chart/diagram
      { NOT: { content: { contains: "European stamps were issued in the" } } },
      { NOT: { content: { contains: "South American stamps issued before" } } },
      { NOT: { content: { contains: "average price of his '70s stamps" } } },
      { NOT: { content: { contains: "batch of Trisha's cookies" } } },
      { NOT: { content: { contains: "area of the small kite" } } },
      // Problems referencing a missing expression or figure
      { NOT: { content: { endsWith: "value of the expression:" } } },
      { NOT: { content: { endsWith: "value of the following expression?" } } },
    ],
  };
  const unattempted = await prisma.problem.findMany({
    where: {
      ...excludeFilter,
      ...(attemptedIds.length > 0 ? { id: { notIn: attemptedIds } } : {}),
    },
  });

  if (unattempted.length > 0) {
    return sortByClosestRating(unattempted, playerRating)[0];
  }

  // Step 3: All problems attempted — LRU fallback
  // Find the 20 problems whose most recent attempt is the oldest
  const lruResult = await prisma.$queryRaw<Array<{ problemId: string }>>`
    SELECT "problemId"
    FROM "Attempt"
    WHERE "playerId" = ${playerId}
    GROUP BY "problemId"
    ORDER BY MAX("createdAt") ASC
    LIMIT 20
  `;

  if (lruResult.length === 0) {
    // No attempts at all — shouldn't reach here, but safety fallback
    const all = await prisma.problem.findMany({ where: excludeFilter });
    return all.length > 0 ? sortByClosestRating(all, playerRating)[0] : null;
  }

  const lruProblemIds = lruResult.map((r) => r.problemId);
  const lruProblems = await prisma.problem.findMany({
    where: { id: { in: lruProblemIds }, ...excludeFilter },
  });

  return sortByClosestRating(lruProblems, playerRating)[0] ?? null;
}

/**
 * Sort problems by how close their rating is to the player's rating
 */
function sortByClosestRating(problems: Problem[], playerRating: number): Problem[] {
  return [...problems].sort((a, b) => {
    const diffA = Math.abs(a.rating - playerRating);
    const diffB = Math.abs(b.rating - playerRating);
    return diffA - diffB;
  });
}

/**
 * Check if an answer is correct
 * Handles numeric comparison with tolerance for floating point
 */
export function checkAnswer(submittedAnswer: string, correctAnswer: string): boolean {
  // Normalize both answers
  const submitted = normalizeAnswer(submittedAnswer);
  const correct = normalizeAnswer(correctAnswer);

  // Direct string comparison first
  if (submitted === correct) return true;

  // Try numeric comparison for floating point tolerance
  const submittedNum = parseFloat(submitted);
  const correctNum = parseFloat(correct);

  if (!isNaN(submittedNum) && !isNaN(correctNum)) {
    // Allow small tolerance for floating point
    return Math.abs(submittedNum - correctNum) < 0.001;
  }

  return false;
}

/**
 * Normalize an answer string
 * - Trim whitespace
 * - Lowercase
 * - Remove trailing zeros after decimal
 */
function normalizeAnswer(answer: string): string {
  let normalized = answer.trim().toLowerCase();

  // Try to normalize numeric values
  const num = parseFloat(normalized);
  if (!isNaN(num)) {
    // Convert to number and back to remove trailing zeros
    normalized = String(num);
  }

  return normalized;
}
