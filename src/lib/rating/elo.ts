import type { RatingSystem, RatingInput, RatingResult } from "./index";

/**
 * ELO Rating System Implementation
 *
 * Classic ELO formula:
 * - Expected score: E = 1 / (1 + 10^((Rb - Ra) / 400))
 * - New rating: Ra' = Ra + K * (S - E)
 *
 * Where:
 * - Ra = Player's rating
 * - Rb = Problem's rating
 * - K = K-factor (volatility)
 * - S = Actual score (1 for win, 0 for loss)
 * - E = Expected score
 */
export class EloRatingSystem implements RatingSystem {
  private readonly playerKFactor: number;
  private readonly problemKFactor: number;
  private readonly defaultRating: number;
  private readonly minRating: number;
  private readonly maxRating: number;

  constructor(options?: {
    playerKFactor?: number;
    problemKFactor?: number;
    defaultRating?: number;
    minRating?: number;
    maxRating?: number;
  }) {
    // K-factor determines how much ratings change per game
    // Higher K = more volatile ratings
    this.playerKFactor = options?.playerKFactor ?? 32;
    this.problemKFactor = options?.problemKFactor ?? 16; // Problems change slower
    this.defaultRating = options?.defaultRating ?? 1200;
    this.minRating = options?.minRating ?? 400;
    this.maxRating = options?.maxRating ?? 2800;
  }

  getName(): string {
    return "ELO";
  }

  getDefaultRating(): number {
    return this.defaultRating;
  }

  getDefaultRD(): number {
    return 350;
  }

  /**
   * Calculate expected score using logistic function
   * @param playerRating - Player's current rating
   * @param problemRating - Problem's current rating
   * @returns Expected probability of player solving the problem
   */
  private calculateExpectedScore(
    playerRating: number,
    problemRating: number
  ): number {
    return 1 / (1 + Math.pow(10, (problemRating - playerRating) / 400));
  }

  /**
   * Clamp rating within valid bounds
   */
  private clampRating(rating: number): number {
    return Math.max(this.minRating, Math.min(this.maxRating, rating));
  }

  calculateNewRatings(input: RatingInput): RatingResult {
    const { playerRating, problemRating, playerWon } = input;

    // Calculate expected score (probability player solves problem)
    const expectedScore = this.calculateExpectedScore(playerRating, problemRating);

    // Actual score: 1 if solved correctly, 0 if incorrect
    const actualScore = playerWon ? 1 : 0;

    // Calculate rating changes
    const playerChange = this.playerKFactor * (actualScore - expectedScore);
    const problemChange = this.problemKFactor * (expectedScore - actualScore);

    // Calculate new ratings
    const newPlayerRating = this.clampRating(playerRating + playerChange);
    const newProblemRating = this.clampRating(problemRating + problemChange);

    return {
      newPlayerRating: Math.round(newPlayerRating * 10) / 10, // Round to 1 decimal
      newProblemRating: Math.round(newProblemRating * 10) / 10,
    };
  }
}
