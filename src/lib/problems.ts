import { prisma } from "./db";
import type { Problem } from "@prisma/client";

/**
 * Problem Selection Logic
 *
 * Selects the next problem for a player based on their rating.
 * Strategy: Never repeat a problem until all have been attempted,
 * then fall back to least-recently-attempted problems.
 *
 * Uses raw SQL for single-query execution — no JS-side sorting.
 */

interface SelectProblemOptions {
  playerId: string;
  playerRating: number;
}

/**
 * Content exclusion filters as SQL.
 * These filter out problems with missing diagrams, broken references, etc.
 */
const CONTENT_FILTERS = `
  AND p."content" != ''
  AND p."content" NOT LIKE '%[Diagram not available]%'
  AND p."content" NOT LIKE '%Image:%'
  AND p."content" NOT LIKE '%European stamps were issued in the%'
  AND p."content" NOT LIKE '%South American stamps issued before%'
  AND p."content" NOT LIKE '%average price of his ''70s stamps%'
  AND p."content" NOT LIKE '%batch of Trisha''s cookies%'
  AND p."content" NOT LIKE '%area of the small kite%'
  AND p."content" NOT LIKE '%value of the expression:'
  AND p."content" NOT LIKE '%value of the following expression?'
`;

/**
 * Select the next problem for a player.
 *
 * Algorithm:
 * 1. Single SQL query: find the closest-rated unattempted problem
 * 2. If all exhausted: LRU fallback — single query joining the 20
 *    least-recently-attempted problems, pick closest-rated
 */
export async function selectNextProblem(
  options: SelectProblemOptions
): Promise<Problem | null> {
  const { playerId, playerRating } = options;

  // Tier 1: Closest-rated unattempted problem within ±400 rating window.
  // NOT EXISTS with (playerId, problemId) index is ~7x faster than NOT IN (DISTINCT ...).
  // Rating BETWEEN lets the (excluded, rating) index pre-filter rows.
  const WINDOW = 400;
  const unattempted = await prisma.$queryRawUnsafe<Problem[]>(
    `SELECT p.*
     FROM "Problem" p
     WHERE p."excluded" = false
       AND p."rating" BETWEEN $2 - ${WINDOW} AND $2 + ${WINDOW}
       ${CONTENT_FILTERS}
       AND NOT EXISTS (
         SELECT 1 FROM "Attempt" a
         WHERE a."playerId" = $1 AND a."problemId" = p."id"
       )
     ORDER BY ABS(p."rating" - $2)
     LIMIT 1`,
    playerId,
    playerRating
  );

  if (unattempted.length > 0) {
    return unattempted[0];
  }

  // Tier 1b: Widen to full table if narrow window found nothing
  const unattemptedWide = await prisma.$queryRawUnsafe<Problem[]>(
    `SELECT p.*
     FROM "Problem" p
     WHERE p."excluded" = false
       ${CONTENT_FILTERS}
       AND NOT EXISTS (
         SELECT 1 FROM "Attempt" a
         WHERE a."playerId" = $1 AND a."problemId" = p."id"
       )
     ORDER BY ABS(p."rating" - $2)
     LIMIT 1`,
    playerId,
    playerRating
  );

  if (unattemptedWide.length > 0) {
    return unattemptedWide[0];
  }

  // Tier 2: All problems attempted — LRU fallback
  const lru = await prisma.$queryRawUnsafe<Problem[]>(
    `SELECT p.*
     FROM "Problem" p
     INNER JOIN (
       SELECT "problemId", MAX("createdAt") AS last_attempt
       FROM "Attempt"
       WHERE "playerId" = $1
       GROUP BY "problemId"
       ORDER BY last_attempt ASC
       LIMIT 20
     ) lru ON lru."problemId" = p."id"
     WHERE p."excluded" = false
       ${CONTENT_FILTERS}
     ORDER BY ABS(p."rating" - $2)
     LIMIT 1`,
    playerId,
    playerRating
  );

  return lru[0] ?? null;
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
