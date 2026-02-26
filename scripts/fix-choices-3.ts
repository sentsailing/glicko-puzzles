/**
 * Third pass: fix specific remaining broken choices.
 * - Missing closing $ on 2 choices
 * - Orphan $ in "$0" text
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  let fixCount = 0;

  // Fix 1: 2019 AMC 10B #9 — missing closing $ on "The set of nonnegative integers"
  const p1 = await prisma.problem.findFirst({
    where: { source: "2019 AMC 10B", sourceNumber: 9 },
    select: { id: true, choices: true },
  });
  if (p1) {
    const fixed = p1.choices.map((c) =>
      c === "$\\text{The set of nonnegative integers}"
        ? "$\\text{The set of nonnegative integers}$"
        : c
    );
    if (fixed.some((f, i) => f !== p1.choices[i])) {
      await prisma.problem.update({ where: { id: p1.id }, data: { choices: fixed } });
      console.log("[2019 AMC 10B #9] Fixed missing closing $");
      fixCount++;
    }
  }

  // Fix 2: 2019 AMC 12B #3 — missing closing $ on "clockwise rotation..."
  const p2 = await prisma.problem.findFirst({
    where: { source: "2019 AMC 12B", sourceNumber: 3 },
    select: { id: true, choices: true },
  });
  if (p2) {
    const fixed = p2.choices.map((c) =>
      c === "clockwise rotation about the origin by $180^{\\circ}"
        ? "clockwise rotation about the origin by $180^{\\circ}$"
        : c
    );
    if (fixed.some((f, i) => f !== p2.choices[i])) {
      await prisma.problem.update({ where: { id: p2.id }, data: { choices: fixed } });
      console.log("[2019 AMC 12B #3] Fixed missing closing $");
      fixCount++;
    }
  }

  // Fix 3: 2012 AMC 10B #6 — "Her estimate is $0" → wrap $0 in math
  const p3 = await prisma.problem.findFirst({
    where: { source: "2012 AMC 10B", sourceNumber: 6 },
    select: { id: true, choices: true },
  });
  if (p3) {
    const fixed = p3.choices.map((c) =>
      c === "Her estimate is $0"
        ? "Her estimate is $0$"
        : c
    );
    if (fixed.some((f, i) => f !== p3.choices[i])) {
      await prisma.problem.update({ where: { id: p3.id }, data: { choices: fixed } });
      console.log("[2012 AMC 10B #6] Fixed orphan $ → '$0' → '$0$'");
      fixCount++;
    }
  }

  // Fix 4: 2022 AMC 12B #8 — trailing space inside math before closing $
  // "$\text{two intersecting circles} $  $" was fixed to "$\text{two intersecting circles} $"
  // which still has a trailing space before $. Not a real bug, just cosmetic.

  console.log(`\nFixed ${fixCount} problems`);

  // Recount remaining odd-dollar choices
  const all = await prisma.problem.findMany({
    where: { answerType: "MULTIPLE_CHOICE" },
    select: { source: true, sourceNumber: true, choices: true },
  });
  let remaining = 0;
  for (const prob of all) {
    for (const c of prob.choices) {
      const matches = c.match(/\$/g) || [];
      if (matches.length % 2 === 1) {
        // $\$X.XX$ patterns are legitimate (3 dollar signs: open, escaped, close)
        const trimmed = c.trim();
        const isLegitDollarAmount =
          /^\$\\\$\s*[\d,.]+\$$/  .test(trimmed);
        if (!isLegitDollarAmount) {
          remaining++;
          console.log(`  STILL ODD: [${prob.source} #${prob.sourceNumber}] ${JSON.stringify(c)}`);
        }
      }
    }
  }
  console.log(`\nRemaining non-dollar-amount odd-$ choices: ${remaining}`);
}

main().finally(() => prisma.$disconnect());
