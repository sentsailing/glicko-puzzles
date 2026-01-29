import { prisma } from "./db";
import type { Problem } from "@/types";

/**
 * Problem Selection Logic
 *
 * Selects the next problem for a player based on their rating.
 * Strategy: Find problems closest to player's rating, excluding
 * recently attempted problems.
 */

interface SelectProblemOptions {
  playerId: string;
  playerRating: number;
  excludeRecentCount?: number; // Exclude N most recent attempts
}

/**
 * Select the next problem for a player
 *
 * Algorithm:
 * 1. Get recently attempted problem IDs (to avoid repetition)
 * 2. Find all eligible problems (not recently attempted)
 * 3. Sort by closest rating to player
 * 4. Return the best match
 */
export async function selectNextProblem(
  options: SelectProblemOptions
): Promise<Problem | null> {
  const { playerId, playerRating, excludeRecentCount = 5 } = options;

  // Get recently attempted problem IDs
  const recentAttempts = await prisma.attempt.findMany({
    where: { playerId },
    orderBy: { createdAt: "desc" },
    take: excludeRecentCount,
    select: { problemId: true },
  });

  const excludedIds = recentAttempts.map((a: { problemId: string }) => a.problemId);

  // Find all eligible problems
  const problems = await prisma.problem.findMany({
    where: {
      id: { notIn: excludedIds.length > 0 ? excludedIds : undefined },
    },
  });

  if (problems.length === 0) {
    // If all problems have been recently attempted, allow any problem
    const allProblems = await prisma.problem.findMany();
    if (allProblems.length === 0) return null;

    // Sort by closest rating
    return sortByClosestRating(allProblems, playerRating)[0];
  }

  // Sort by closest rating and return the best match
  return sortByClosestRating(problems, playerRating)[0];
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
