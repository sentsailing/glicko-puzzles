/**
 * Second pass: fix remaining trailing orphan "$" in choices.
 * After the first pass, patterns like "$math$  $" remain.
 * Also handles "<br \>$" and similar trailing artifacts.
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function fixChoice(choice: string): string {
  let c = choice;

  // Strip trailing whitespace + $ that follows a closing $...$
  // e.g. "$\text{hello}$  $" → "$\text{hello}$"
  c = c.replace(/(\$)\s+\$\s*$/, "$1");

  // Strip trailing "<br />" or "<br \>" artifacts
  c = c.replace(/<br\s*\\?\/?>\s*\$?\s*$/, "");

  // If it ends with just "$" and is clearly not math (no opening $),
  // strip the trailing $
  // Count dollar signs — if odd, the last one is orphaned
  const dollars = c.match(/\$/g) || [];
  if (dollars.length % 2 === 1) {
    // Try stripping trailing orphan $
    if (c.match(/[^\\]\$\s*$/) && !c.match(/^\$/)) {
      c = c.replace(/\$\s*$/, "");
    }
  }

  return c.trim();
}

async function main() {
  const problems = await prisma.problem.findMany({
    where: { answerType: "MULTIPLE_CHOICE" },
    select: { id: true, source: true, sourceNumber: true, choices: true },
  });

  let fixCount = 0;

  for (const prob of problems) {
    const fixed = prob.choices.map(fixChoice);
    const changed = fixed.some((f, i) => f !== prob.choices[i]);

    if (changed) {
      fixCount++;
      console.log(`[${prob.source} #${prob.sourceNumber}]`);
      for (let i = 0; i < prob.choices.length; i++) {
        if (prob.choices[i] !== fixed[i]) {
          console.log(`  "${prob.choices[i]}" → "${fixed[i]}"`);
        }
      }

      await prisma.problem.update({
        where: { id: prob.id },
        data: { choices: fixed },
      });
    }
  }

  console.log(`\nFixed ${fixCount} problems`);

  // Verify: count remaining odd-dollar choices
  const all = await prisma.problem.findMany({
    where: { answerType: "MULTIPLE_CHOICE" },
    select: { source: true, sourceNumber: true, choices: true },
  });
  let remaining = 0;
  for (const prob of all) {
    for (const c of prob.choices) {
      const matches = c.match(/\$/g) || [];
      if (matches.length % 2 === 1) {
        remaining++;
        console.log(`  REMAINING: [${prob.source} #${prob.sourceNumber}] ${JSON.stringify(c)}`);
      }
    }
  }
  console.log(`\nRemaining odd-dollar choices: ${remaining}`);
}

main().finally(() => prisma.$disconnect());
