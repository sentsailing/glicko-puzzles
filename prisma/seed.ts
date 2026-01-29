import { PrismaClient } from "@prisma/client";

type Difficulty = "EASY" | "MEDIUM" | "HARD";
type AnswerType = "FREE_RESPONSE" | "MULTIPLE_CHOICE";

const prisma = new PrismaClient();

interface SeedProblem {
  content: string;
  answer: string;
  answerType?: AnswerType;
  choices?: string[];
  rating: number;
  ratingDeviation: number;
  volatility: number;
  difficulty: Difficulty;
}

// Seed problems use a low RD (50) because we're confident in their assigned ratings.
// Volatility starts at default 0.06.
const SEED_RD = 50;
const SEED_VOLATILITY = 0.06;

const problems: SeedProblem[] = [
  // ===== EASY (Rating 800-1100) =====
  {
    content: "What is 7 + 8?",
    answer: "15",
    rating: 800,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "EASY",
  },
  {
    content: "What is 12 × 5?",
    answer: "60",
    rating: 820,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "EASY",
  },
  {
    content: "What is 100 - 37?",
    answer: "63",
    rating: 840,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "EASY",
  },
  {
    content: "What is 144 ÷ 12?",
    answer: "12",
    rating: 860,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "EASY",
  },
  {
    content: "What is 25% of 80?",
    answer: "20",
    rating: 900,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "EASY",
  },
  {
    content: "If x + 5 = 12, what is x?",
    answer: "7",
    rating: 920,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "EASY",
  },
  {
    content: "What is the perimeter of a square with side length 9?",
    answer: "36",
    rating: 950,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "EASY",
  },
  {
    content: "What is 3²?",
    answer: "9",
    rating: 980,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "EASY",
  },
  {
    content: "How many minutes are in 2.5 hours?",
    answer: "150",
    rating: 1000,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "EASY",
  },
  {
    content: "What is the smallest prime number greater than 10?",
    answer: "11",
    rating: 1050,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "EASY",
  },

  // ===== MEDIUM (Rating 1100-1500) =====
  {
    content: "Solve for x: 2x - 7 = 13",
    answer: "10",
    rating: 1100,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "MEDIUM",
  },
  {
    content: "What is the area of a triangle with base 8 and height 5?",
    answer: "20",
    rating: 1150,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "MEDIUM",
  },
  {
    content: "If f(x) = 3x + 2, what is f(4)?",
    answer: "14",
    rating: 1180,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "MEDIUM",
  },
  {
    content: "What is √196?",
    answer: "14",
    rating: 1200,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "MEDIUM",
  },
  {
    content: "Simplify: 2³ × 2⁴",
    answer: "128",
    rating: 1220,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "MEDIUM",
  },
  {
    content: "What is 15% of 240?",
    answer: "36",
    rating: 1250,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "MEDIUM",
  },
  {
    content: "A rectangle has area 72 and width 8. What is its length?",
    answer: "9",
    rating: 1280,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "MEDIUM",
  },
  {
    content: "What is the sum of the first 10 positive integers?",
    answer: "55",
    rating: 1320,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "MEDIUM",
  },
  {
    content: "Solve: |x - 3| = 7. Give the larger solution.",
    answer: "10",
    rating: 1350,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "MEDIUM",
  },
  {
    content: "If 3x + 2y = 16 and y = 2, what is x?",
    answer: "4",
    rating: 1400,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "MEDIUM",
  },
  {
    content: "What is the greatest common divisor of 48 and 180?",
    answer: "12",
    rating: 1450,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "MEDIUM",
  },
  {
    content: "A circle has diameter 14. What is its circumference? (Use π = 22/7)",
    answer: "44",
    rating: 1480,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "MEDIUM",
  },

  // ===== HARD (Rating 1500-2000) =====
  {
    content: "What is the value of 5! (5 factorial)?",
    answer: "120",
    rating: 1520,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "HARD",
  },
  {
    content: "Solve x² - 5x + 6 = 0. Give the larger root.",
    answer: "3",
    rating: 1600,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "HARD",
  },
  {
    content: "In a right triangle, legs are 5 and 12. What is the hypotenuse?",
    answer: "13",
    rating: 1650,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "HARD",
  },
  {
    content: "How many diagonals does a hexagon have?",
    answer: "9",
    rating: 1700,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "HARD",
  },
  {
    content: "What is log₂(64)?",
    answer: "6",
    rating: 1750,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "HARD",
  },
  {
    content: "If sin(θ) = 3/5 in a right triangle, what is cos(θ)? (Give as a decimal)",
    answer: "0.8",
    rating: 1820,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "HARD",
  },
  {
    content: "What is the sum of the interior angles of a pentagon (in degrees)?",
    answer: "540",
    rating: 1880,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "HARD",
  },
  {
    content: "How many ways can you arrange the letters in 'MATH'?",
    answer: "24",
    rating: 1950,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "HARD",
  },

  // ===== MULTIPLE CHOICE EXAMPLES =====
  {
    content: "What is the value of $\\sqrt{25} + \\sqrt{16}$?",
    answer: "C",
    answerType: "MULTIPLE_CHOICE",
    choices: ["7", "8", "9", "10", "11"],
    rating: 900,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "EASY",
  },
  {
    content: "If $f(x) = x^2 - 4x + 3$, what are the roots of $f(x) = 0$?",
    answer: "B",
    answerType: "MULTIPLE_CHOICE",
    choices: ["$x = 2$ and $x = 3$", "$x = 1$ and $x = 3$", "$x = -1$ and $x = -3$", "$x = 0$ and $x = 3$", "$x = 1$ and $x = 4$"],
    rating: 1300,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "MEDIUM",
  },
  {
    content: "How many integers between 1 and 100 are divisible by either 3 or 5?",
    answer: "D",
    answerType: "MULTIPLE_CHOICE",
    choices: ["33", "40", "46", "47", "53"],
    rating: 1600,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "HARD",
  },
  {
    content: "What is the sum of the geometric series $1 + \\frac{1}{2} + \\frac{1}{4} + \\frac{1}{8} + \\cdots$?",
    answer: "B",
    answerType: "MULTIPLE_CHOICE",
    choices: ["1", "2", "$\\frac{3}{2}$", "$\\infty$", "$\\frac{1}{2}$"],
    rating: 1750,
    ratingDeviation: SEED_RD,
    volatility: SEED_VOLATILITY,
    difficulty: "HARD",
  },
];

async function main() {
  console.log("🌱 Starting seed...\n");

  // Clear existing data
  await prisma.attempt.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.player.deleteMany();

  console.log("🗑️  Cleared existing data\n");

  // Insert problems
  for (const problem of problems) {
    await prisma.problem.create({
      data: {
        content: problem.content,
        answer: problem.answer,
        answerType: problem.answerType ?? "FREE_RESPONSE",
        choices: problem.choices ?? [],
        rating: problem.rating,
        ratingDeviation: problem.ratingDeviation,
        volatility: problem.volatility,
        difficulty: problem.difficulty,
      },
    });
  }

  console.log(`✅ Inserted ${problems.length} problems\n`);

  // Print summary
  const easyCount = problems.filter((p) => p.difficulty === "EASY").length;
  const mediumCount = problems.filter((p) => p.difficulty === "MEDIUM").length;
  const hardCount = problems.filter((p) => p.difficulty === "HARD").length;

  console.log("📊 Summary:");
  console.log(`   EASY:   ${easyCount} problems (rating 800-1100)`);
  console.log(`   MEDIUM: ${mediumCount} problems (rating 1100-1500)`);
  console.log(`   HARD:   ${hardCount} problems (rating 1500-2000)`);
  console.log(`   TOTAL:  ${problems.length} problems\n`);

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
