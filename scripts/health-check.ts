import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  const total = await p.player.count();
  const auth = await p.player.count({ where: { firebaseUid: { not: null } } });
  const withUsername = await p.player.count({ where: { username: { not: null } } });
  const active = await p.player.count({ where: { gamesPlayed: { gt: 0 } } });
  console.log(`Players: ${total} total, ${auth} authenticated, ${withUsername} with username, ${active} active`);

  const recent = await p.player.findMany({
    orderBy: { lastActiveAt: "desc" },
    take: 10,
    select: { id: true, username: true, rating: true, gamesPlayed: true, confirmedTier: true, firebaseUid: true, lastActiveAt: true },
  });
  console.log("\nRecent players:");
  for (const r of recent) {
    const name = r.username || "(anon)";
    const hasAuth = r.firebaseUid ? "yes" : "no";
    console.log(`  ${name} | rating: ${Math.round(r.rating)} | games: ${r.gamesPlayed} | tier: ${r.confirmedTier || "?"} | auth: ${hasAuth} | last: ${r.lastActiveAt.toISOString()}`);
  }

  // Check for duplicate firebaseUids
  const dupes: { firebaseUid: string; cnt: bigint }[] = await p.$queryRaw`SELECT "firebaseUid", COUNT(*) as cnt FROM "Player" WHERE "firebaseUid" IS NOT NULL GROUP BY "firebaseUid" HAVING COUNT(*) > 1`;
  if (dupes.length > 0) {
    console.log("\nWARNING: Duplicate firebaseUids found:");
    for (const d of dupes) {
      console.log(`  ${d.firebaseUid} appears ${d.cnt} times`);
    }
  } else {
    console.log("\nNo duplicate firebaseUids.");
  }

  // Problem stats
  const problems = await p.problem.count();
  const reported = await p.report.count();
  console.log(`\nProblems: ${problems} total, ${reported} reports`);

  // Recent attempts
  const attempts = await p.attempt.count();
  const recentAttempts = await p.attempt.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { correct: true, ratingBefore: true, ratingAfter: true, createdAt: true },
  });
  console.log(`\nAttempts: ${attempts} total`);
  console.log("Recent attempts:");
  for (const a of recentAttempts) {
    const mark = a.correct ? "correct" : "wrong";
    console.log(`  ${mark} | ${Math.round(a.ratingBefore)} -> ${Math.round(a.ratingAfter)} | ${a.createdAt.toISOString()}`);
  }

  // Players with suspiciously many accounts (same IP patterns, etc.) — check for orphan players
  const orphans = await p.player.count({ where: { gamesPlayed: 0 } });
  console.log(`\nOrphan players (0 games): ${orphans}`);
}

main().catch(console.error).finally(() => p.$disconnect());
