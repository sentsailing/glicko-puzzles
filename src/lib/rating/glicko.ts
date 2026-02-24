import type { RatingSystem, RatingInput, RatingResult } from "./index";

/**
 * Glicko-2 Rating System Implementation
 *
 * Based on: "Example of the Glicko-2 system" by Professor Mark E. Glickman
 * Reference: http://www.glicko.net/glicko/glicko2.pdf
 *
 * Key concepts:
 * - Rating Deviation (RD): uncertainty in a player's rating
 * - Volatility (σ): how erratic a player's performance is
 * - Ratings are converted to an internal Glicko-2 scale for computation
 *   using the scaling factor 173.7178 (= 400 / ln(10))
 */

const GLICKO2_SCALE = 173.7178; // 400 / ln(10)
const EPSILON = 0.000001; // Convergence tolerance for Illinois algorithm

export class GlickoRatingSystem implements RatingSystem {
  private readonly defaultRating: number;
  private readonly defaultRD: number;
  private readonly defaultVolatility: number;
  private readonly tau: number;

  constructor(options?: {
    defaultRating?: number;
    defaultRD?: number;
    defaultVolatility?: number;
    tau?: number;
  }) {
    this.defaultRating = options?.defaultRating ?? 1200;
    this.defaultRD = options?.defaultRD ?? 350;
    this.defaultVolatility = options?.defaultVolatility ?? 0.06;
    // τ constrains volatility change. Smaller = more stable. Range: 0.3–1.2
    this.tau = options?.tau ?? 0.5;
  }

  getName(): string {
    return "Glicko-2";
  }

  getDefaultRating(): number {
    return this.defaultRating;
  }

  getDefaultRD(): number {
    return this.defaultRD;
  }

  getDefaultVolatility(): number {
    return this.defaultVolatility;
  }

  // --- Glicko-2 scale conversion ---

  private toGlicko2Mu(rating: number): number {
    return (rating - this.defaultRating) / GLICKO2_SCALE;
  }

  private toGlicko2Phi(rd: number): number {
    return rd / GLICKO2_SCALE;
  }

  private fromGlicko2Mu(mu: number): number {
    return mu * GLICKO2_SCALE + this.defaultRating;
  }

  private fromGlicko2Phi(phi: number): number {
    return phi * GLICKO2_SCALE;
  }

  // --- Core Glicko-2 functions ---

  /**
   * g(φ) — reduces impact based on opponent's rating deviation.
   * g(φ) = 1 / sqrt(1 + 3φ² / π²)
   */
  private g(phi: number): number {
    return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
  }

  /**
   * E(μ, μⱼ, φⱼ) — expected score (win probability).
   * E = 1 / (1 + exp(-g(φⱼ)(μ - μⱼ)))
   * Clamped to [1e-10, 1-1e-10] to avoid division by zero in variance calc.
   */
  private E(mu: number, muJ: number, phiJ: number): number {
    const e = 1 / (1 + Math.exp(-this.g(phiJ) * (mu - muJ)));
    return Math.max(1e-10, Math.min(1 - 1e-10, e));
  }

  /**
   * Step 5: Determine new volatility σ' using the Illinois algorithm.
   * This solves for the value that maximizes the posterior distribution
   * of the log-volatility.
   */
  private computeNewVolatility(
    sigma: number,
    phi: number,
    v: number,
    delta: number
  ): number {
    const tau = this.tau;
    const alpha = Math.log(sigma * sigma);
    const deltaSq = delta * delta;
    const phiSq = phi * phi;

    // f(x) is the function we're finding the root of
    const f = (x: number): number => {
      const ex = Math.exp(x);
      const tmp = phiSq + v + ex;
      const left = (ex * (deltaSq - phiSq - v - ex)) / (2 * tmp * tmp);
      const right = (x - alpha) / (tau * tau);
      return left - right;
    };

    // Set initial bracket [A, B]
    let A = alpha;
    let B: number;

    if (deltaSq > phiSq + v) {
      B = Math.log(deltaSq - phiSq - v);
    } else {
      let k = 1;
      while (f(alpha - k * tau) < 0 && k < 100) {
        k++;
      }
      B = alpha - k * tau;
    }

    // Illinois algorithm (modified regula falsi)
    let fA = f(A);
    let fB = f(B);
    const MAX_ITERATIONS = 100;

    for (let i = 0; i < MAX_ITERATIONS && Math.abs(B - A) > EPSILON; i++) {
      const C = A + ((A - B) * fA) / (fB - fA);
      const fC = f(C);

      if (fC * fB <= 0) {
        A = B;
        fA = fB;
      } else {
        fA = fA / 2;
      }

      B = C;
      fB = fC;
    }

    return Math.exp(A / 2);
  }

  /**
   * Run the full Glicko-2 update for a single game (rating period = 1 game).
   *
   * Returns updated { mu, phi, sigma } on the Glicko-2 internal scale.
   */
  private glicko2Update(
    mu: number,
    phi: number,
    sigma: number,
    opponentMu: number,
    opponentPhi: number,
    score: number // 1 = win, 0 = loss
  ): { mu: number; phi: number; sigma: number } {
    // Step 3: Compute estimated variance v
    const gOpponent = this.g(opponentPhi);
    const eScore = this.E(mu, opponentMu, opponentPhi);
    const v = 1 / (gOpponent * gOpponent * eScore * (1 - eScore));

    // Step 4: Compute estimated improvement Δ
    const delta = v * gOpponent * (score - eScore);

    // Step 5: Compute new volatility σ'
    const newSigma = this.computeNewVolatility(sigma, phi, v, delta);

    // Step 6: Update RD to new pre-rating period value φ*
    const phiStar = Math.sqrt(phi * phi + newSigma * newSigma);

    // Step 7: Update rating and RD
    const newPhi = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
    const newMu = mu + newPhi * newPhi * gOpponent * (score - eScore);

    return { mu: newMu, phi: newPhi, sigma: newSigma };
  }

  calculateNewRatings(input: RatingInput): RatingResult {
    const {
      playerRating,
      problemRating,
      playerWon,
      playerRD = this.defaultRD,
      problemRD = this.defaultRD,
      playerVolatility = this.defaultVolatility,
      problemVolatility = this.defaultVolatility,
    } = input;

    const score = playerWon ? 1 : 0;

    // Convert to Glicko-2 scale
    const playerMu = this.toGlicko2Mu(playerRating);
    const playerPhi = this.toGlicko2Phi(playerRD);
    const problemMu = this.toGlicko2Mu(problemRating);
    const problemPhi = this.toGlicko2Phi(problemRD);

    // Update player (score = 1 for win, 0 for loss)
    const playerResult = this.glicko2Update(
      playerMu,
      playerPhi,
      playerVolatility,
      problemMu,
      problemPhi,
      score
    );

    // Update problem (inverse outcome: if player won, problem "lost")
    const problemResult = this.glicko2Update(
      problemMu,
      problemPhi,
      problemVolatility,
      playerMu,
      playerPhi,
      1 - score
    );

    // Convert back to Glicko scale
    const newPlayerRating = this.fromGlicko2Mu(playerResult.mu);
    const newProblemRating = this.fromGlicko2Mu(problemResult.mu);
    const newPlayerRD = this.fromGlicko2Phi(playerResult.phi);
    const newProblemRD = this.fromGlicko2Phi(problemResult.phi);

    return {
      newPlayerRating: Math.round(newPlayerRating * 10) / 10,
      newProblemRating: Math.round(newProblemRating * 10) / 10,
      newPlayerRD: Math.round(newPlayerRD * 10) / 10,
      newProblemRD: Math.round(newProblemRD * 10) / 10,
      newPlayerVolatility: playerResult.sigma,
      newProblemVolatility: problemResult.sigma,
    };
  }
}
