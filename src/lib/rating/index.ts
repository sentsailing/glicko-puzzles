/**
 * Rating System Interface
 *
 * Designed to support both ELO and Glicko-2 rating systems.
 * The interface allows swapping implementations without changing
 * the rest of the application.
 */

export interface RatingResult {
  newPlayerRating: number;
  newProblemRating: number;
  newPlayerRD?: number;
  newProblemRD?: number;
  newPlayerVolatility?: number;
  newProblemVolatility?: number;
}

export interface RatingInput {
  playerRating: number;
  problemRating: number;
  playerWon: boolean;
  playerRD?: number;
  problemRD?: number;
  playerVolatility?: number;
  problemVolatility?: number;
}

export interface RatingSystem {
  /**
   * Calculate new ratings after an attempt
   * @param input - The current ratings and result
   * @returns New ratings for both player and problem
   */
  calculateNewRatings(input: RatingInput): RatingResult;

  /**
   * Get the name of the rating system
   */
  getName(): string;

  /**
   * Get the default rating for new players
   */
  getDefaultRating(): number;

  /**
   * Get the default rating deviation
   */
  getDefaultRD(): number;
}

// Re-export implementations
export { EloRatingSystem } from "./elo";
export { GlickoRatingSystem } from "./glicko";

// Default rating system
import { GlickoRatingSystem } from "./glicko";
export const ratingSystem: RatingSystem = new GlickoRatingSystem();
