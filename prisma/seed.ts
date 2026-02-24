import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed script — resets the database (clears all players, attempts, and problems).
 *
 * After running this, use the scraper to populate problems (~3,650 total):
 *
 *   npm run scrape -- --contest "AMC 8" --year 2000-2020
 *   npm run scrape -- --contest "AMC 8" --year 2022-2024
 *   npm run scrape -- --contest "AMC 10A" --year 2002-2024
 *   npm run scrape -- --contest "AMC 10B" --year 2002-2024
 *   npm run scrape -- --contest "AMC 12A" --year 2002-2024
 *   npm run scrape -- --contest "AMC 12B" --year 2002-2024
 *   npm run scrape -- --contest "AIME I" --year 2000-2024
 *   npm run scrape -- --contest "AIME II" --year 2000-2024
 *
 *   Note: 2021 AMC 8 was not held.
 *
 * IMPORTANT: Before deploying to production, rotate all credentials
 * (DATABASE_URL, Firebase keys) if they were ever committed to git.
 */
async function main() {
  console.log("Starting seed...\n");

  // Clear existing data
  await prisma.report.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.player.deleteMany();

  console.log("Cleared all data (players, attempts, problems, reports).\n");
  console.log("Populate problems with the scraper (~3,650 problems):\n");
  console.log('  npm run scrape -- --contest "AMC 8" --year 2000-2020');
  console.log('  npm run scrape -- --contest "AMC 8" --year 2022-2024');
  console.log('  npm run scrape -- --contest "AMC 10A" --year 2002-2024');
  console.log('  npm run scrape -- --contest "AMC 10B" --year 2002-2024');
  console.log('  npm run scrape -- --contest "AMC 12A" --year 2002-2024');
  console.log('  npm run scrape -- --contest "AMC 12B" --year 2002-2024');
  console.log('  npm run scrape -- --contest "AIME I" --year 2000-2024');
  console.log('  npm run scrape -- --contest "AIME II" --year 2000-2024');
  console.log("\n  (2021 AMC 8 was not held)\n");

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
