/**
 * One-time script to fix stray dollar signs in MC choices.
 *
 * Patterns found:
 *   "$ infinitely many"  → "infinitely many"        (leading "$ ")
 *   "$ cannot be determined" → "cannot be determined" (leading "$ ")
 *   "$80+10\\pi$$"       → "$80+10\\pi$"             (trailing extra $)
 *   "$\\frac{15}8$$"     → "$\\frac{15}8$"           (trailing extra $)
 *   "480$"               → "480"                      (trailing orphan $)
 *   "$"                  → ""                          (bare $)
 *   "$\\sqrt {2}$$"      → "$\\sqrt{2}$"             (trailing extra $)
 *
 *   Valid patterns (no change needed):
 *   "$\\$1.76$"   → renders as $1.76 (correct)
 *   "$\\$ 24.00$" → renders as $ 24.00 (correct)
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function fixChoice(choice: string): string {
  let c = choice;

  // Fix trailing double $$ → single $ (e.g. "$80+10\pi$$" → "$80+10\pi$")
  if (c.endsWith("$$") && c.startsWith("$")) {
    c = c.slice(0, -1);
  }

  // Fix leading "$ " followed by non-math text (not starting with \)
  if (/^\$\s+[^\\$]/.test(c)) {
    c = c.replace(/^\$\s+/, "");
  }

  // Fix trailing orphan $ (not preceded by \)
  if (c.endsWith("$") && !c.endsWith("\\$") && !c.startsWith("$")) {
    c = c.slice(0, -1);
  }

  // Fix bare "$"
  if (c === "$") {
    c = "";
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
}

main().finally(() => prisma.$disconnect());
