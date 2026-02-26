import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  const all = await p.problem.findMany({
    where: { answerType: "MULTIPLE_CHOICE" },
    select: { source: true, sourceNumber: true, choices: true },
  });

  const stray: Array<{ source: string | null; num: number | null; choice: string }> = [];
  for (const prob of all) {
    for (const c of prob.choices) {
      const matches = c.match(/\$/g) || [];
      if (matches.length % 2 === 1) {
        stray.push({ source: prob.source, num: prob.sourceNumber, choice: c });
      }
    }
  }

  console.log("Choices with odd dollar signs:", stray.length);
  stray.slice(0, 30).forEach((s) =>
    console.log(`  [${s.source} #${s.num}]`, JSON.stringify(s.choice))
  );

  // Also check for \textdollar in choices
  const tdChoices: typeof stray = [];
  for (const prob of all) {
    for (const c of prob.choices) {
      if (c.includes("textdollar")) {
        tdChoices.push({ source: prob.source, num: prob.sourceNumber, choice: c });
      }
    }
  }
  console.log("\nChoices with textdollar:", tdChoices.length);
  tdChoices.slice(0, 10).forEach((s) =>
    console.log(`  [${s.source} #${s.num}]`, JSON.stringify(s.choice))
  );
}

main().finally(() => p.$disconnect());
