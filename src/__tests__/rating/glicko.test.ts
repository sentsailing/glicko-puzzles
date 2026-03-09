import { GlickoRatingSystem } from "@/lib/rating/glicko";

describe("GlickoRatingSystem", () => {
  const system = new GlickoRatingSystem();

  describe("defaults", () => {
    it("returns default rating of 1200", () => {
      expect(system.getDefaultRating()).toBe(1200);
    });

    it("returns default RD of 350", () => {
      expect(system.getDefaultRD()).toBe(350);
    });

    it("returns default volatility of 0.06", () => {
      expect(system.getDefaultVolatility()).toBe(0.06);
    });
  });

  describe("calculateNewRatings", () => {
    it("increases player rating on win", () => {
      const result = system.calculateNewRatings({
        playerRating: 1200,
        problemRating: 1200,
        playerWon: true,
        playerRD: 350,
        problemRD: 350,
        playerVolatility: 0.06,
        problemVolatility: 0.06,
      });
      expect(result.newPlayerRating).toBeGreaterThan(1200);
      expect(result.newProblemRating).toBeLessThan(1200);
    });

    it("decreases player rating on loss", () => {
      const result = system.calculateNewRatings({
        playerRating: 1200,
        problemRating: 1200,
        playerWon: false,
        playerRD: 350,
        problemRD: 350,
        playerVolatility: 0.06,
        problemVolatility: 0.06,
      });
      expect(result.newPlayerRating).toBeLessThan(1200);
      expect(result.newProblemRating).toBeGreaterThan(1200);
    });

    it("gives larger rating change for bigger upsets", () => {
      // Low-rated player beats high-rated problem
      const upset = system.calculateNewRatings({
        playerRating: 800,
        problemRating: 1600,
        playerWon: true,
        playerRD: 100,
        problemRD: 100,
        playerVolatility: 0.06,
        problemVolatility: 0.06,
      });

      // Equal-rated matchup
      const normal = system.calculateNewRatings({
        playerRating: 1200,
        problemRating: 1200,
        playerWon: true,
        playerRD: 100,
        problemRD: 100,
        playerVolatility: 0.06,
        problemVolatility: 0.06,
      });

      const upsetChange = upset.newPlayerRating - 800;
      const normalChange = normal.newPlayerRating - 1200;
      expect(upsetChange).toBeGreaterThan(normalChange);
    });

    it("gives smaller rating change with low RD (more certain)", () => {
      const lowRD = system.calculateNewRatings({
        playerRating: 1200,
        problemRating: 1200,
        playerWon: true,
        playerRD: 50,
        problemRD: 50,
        playerVolatility: 0.06,
        problemVolatility: 0.06,
      });

      const highRD = system.calculateNewRatings({
        playerRating: 1200,
        problemRating: 1200,
        playerWon: true,
        playerRD: 350,
        problemRD: 350,
        playerVolatility: 0.06,
        problemVolatility: 0.06,
      });

      const lowRDChange = Math.abs(lowRD.newPlayerRating - 1200);
      const highRDChange = Math.abs(highRD.newPlayerRating - 1200);
      expect(lowRDChange).toBeLessThan(highRDChange);
    });

    it("decreases RD after a game", () => {
      const result = system.calculateNewRatings({
        playerRating: 1200,
        problemRating: 1200,
        playerWon: true,
        playerRD: 350,
        problemRD: 350,
        playerVolatility: 0.06,
        problemVolatility: 0.06,
      });
      expect(result.newPlayerRD).toBeLessThan(350);
      expect(result.newProblemRD).toBeLessThan(350);
    });

    it("produces symmetric results (player win = problem loss)", () => {
      const result = system.calculateNewRatings({
        playerRating: 1200,
        problemRating: 1200,
        playerWon: true,
        playerRD: 200,
        problemRD: 200,
        playerVolatility: 0.06,
        problemVolatility: 0.06,
      });

      const playerGain = result.newPlayerRating - 1200;
      const problemLoss = 1200 - result.newProblemRating;
      // Should be approximately equal (not exact due to volatility differences)
      expect(Math.abs(playerGain - problemLoss)).toBeLessThan(1);
    });

    it("returns valid numbers (no NaN or Infinity)", () => {
      const result = system.calculateNewRatings({
        playerRating: 1200,
        problemRating: 1200,
        playerWon: true,
      });
      expect(Number.isFinite(result.newPlayerRating)).toBe(true);
      expect(Number.isFinite(result.newProblemRating)).toBe(true);
      expect(Number.isFinite(result.newPlayerRD)).toBe(true);
      expect(Number.isFinite(result.newProblemRD)).toBe(true);
      expect(Number.isFinite(result.newPlayerVolatility)).toBe(true);
      expect(Number.isFinite(result.newProblemVolatility)).toBe(true);
    });

    it("handles extreme rating differences", () => {
      const result = system.calculateNewRatings({
        playerRating: 200,
        problemRating: 2800,
        playerWon: true,
        playerRD: 350,
        problemRD: 350,
        playerVolatility: 0.06,
        problemVolatility: 0.06,
      });
      expect(Number.isFinite(result.newPlayerRating)).toBe(true);
      expect(result.newPlayerRating).toBeGreaterThan(200);
    });
  });
});
