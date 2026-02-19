import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed script — resets the database (clears all players, attempts, and problems).
 *
 * After running this, use the scraper to populate problems:
 *   npm run scrape -- --contest "AMC 8" --year 1999-2025
 *   npm run scrape -- --contest "AJHSME" --year 1985-1998
 */
async function main() {
  console.log("Starting seed...\n");

  // Clear existing data
  await prisma.attempt.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.player.deleteMany();

  console.log("Cleared all data (players, attempts, problems).\n");
  console.log("Database is empty. Populate problems with the scraper:");
  console.log('  npm run scrape -- --contest "AJHSME" --year 1985-1998');
  console.log('  npm run scrape -- --contest "AMC 8" --year 1999-2020');
  console.log('  npm run scrape -- --contest "AMC 8" --year 2022-2025');
  console.log("  (2021 AMC 8 was not held)\n");

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
