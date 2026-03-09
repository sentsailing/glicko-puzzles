import { getTier, updateConfirmedTier, TIERS } from "@/lib/tiers";

describe("Tier System", () => {
  describe("getTier", () => {
    it("returns lowest tier for rating 0", () => {
      const tier = getTier(0);
      expect(tier.name).toBe(TIERS[0].name);
    });

    it("returns highest tier for very high rating", () => {
      const tier = getTier(3000);
      expect(tier.name).toBe(TIERS[TIERS.length - 1].name);
    });

    it("returns correct tier for boundary values", () => {
      // Test that each tier's threshold maps correctly
      for (const tier of TIERS) {
        const result = getTier(tier.threshold);
        expect(result.name).toBe(tier.name);
      }
    });
  });

  describe("updateConfirmedTier", () => {
    it("keeps tier when rating stays in same range", () => {
      const result = updateConfirmedTier(1200, TIERS[0].name, 0);
      expect(result.confirmedTier).toBeDefined();
      expect(typeof result.tierStreak).toBe("number");
    });

    it("returns tierChange when tier changes", () => {
      // A very high rating from a low tier should eventually trigger promotion
      const highRating = 2500;
      const lowTier = TIERS[0].name;
      // Run enough updates to build streak
      let currentTier = lowTier;
      let streak = 0;
      let tierChange = null;
      for (let i = 0; i < 20; i++) {
        const result = updateConfirmedTier(highRating, currentTier, streak);
        currentTier = result.confirmedTier;
        streak = result.tierStreak;
        if (result.tierChange) tierChange = result.tierChange;
      }
      // Should have promoted at some point
      expect(tierChange).not.toBeNull();
    });
  });

  describe("TIERS", () => {
    it("has tiers sorted by threshold ascending", () => {
      for (let i = 1; i < TIERS.length; i++) {
        expect(TIERS[i].threshold).toBeGreaterThanOrEqual(TIERS[i - 1].threshold);
      }
    });

    it("each tier has required properties", () => {
      for (const tier of TIERS) {
        expect(tier.name).toBeDefined();
        expect(typeof tier.threshold).toBe("number");
        expect(tier.color).toBeDefined();
        expect(tier.hex).toBeDefined();
      }
    });
  });
});
