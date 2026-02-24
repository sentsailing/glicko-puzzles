import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ===================================================================
// Types
// ===================================================================

type Difficulty = "EASY" | "MEDIUM" | "HARD";
type AnswerType = "FREE_RESPONSE" | "MULTIPLE_CHOICE";

interface ContestConfig {
  pagePrefix: string; // e.g. "2024_AMC_8"
  problemCount: number;
  answerType: AnswerType;
  difficultyMap: (n: number) => { difficulty: Difficulty; rating: number };
}

interface ScrapedProblem {
  content: string;
  answer: string;
  answerType: AnswerType;
  choices: string[];
  rating: number;
  ratingDeviation: number;
  volatility: number;
  difficulty: Difficulty;
  source: string;
  sourceNumber: number;
}

// ===================================================================
// Constants
// ===================================================================

const API = "https://artofproblemsolving.com/wiki/api.php";
const SEED_RD = 150;
const SEED_VOLATILITY = 0.06;

// Rate limit: wait between API calls to be respectful
const RATE_LIMIT_MS = 500;

// ===================================================================
// Contest Configurations
// ===================================================================

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function amc8Difficulty(n: number): { difficulty: Difficulty; rating: number } {
  if (n <= 8) return { difficulty: "EASY", rating: lerp(800, 950, (n - 1) / 7) };
  if (n <= 17) return { difficulty: "MEDIUM", rating: lerp(1100, 1400, (n - 9) / 8) };
  return { difficulty: "HARD", rating: lerp(1500, 1950, (n - 18) / 7) };
}

function amc10Difficulty(n: number): { difficulty: Difficulty; rating: number } {
  if (n <= 8) return { difficulty: "EASY", rating: lerp(1000, 1200, (n - 1) / 7) };
  if (n <= 17) return { difficulty: "MEDIUM", rating: lerp(1300, 1600, (n - 9) / 8) };
  return { difficulty: "HARD", rating: lerp(1700, 2100, (n - 18) / 7) };
}

function amc12Difficulty(n: number): { difficulty: Difficulty; rating: number } {
  if (n <= 8) return { difficulty: "EASY", rating: lerp(1100, 1300, (n - 1) / 7) };
  if (n <= 17) return { difficulty: "MEDIUM", rating: lerp(1400, 1700, (n - 9) / 8) };
  return { difficulty: "HARD", rating: lerp(1800, 2200, (n - 18) / 7) };
}

function aimeDifficulty(n: number): { difficulty: Difficulty; rating: number } {
  if (n <= 5) return { difficulty: "EASY", rating: lerp(1500, 1700, (n - 1) / 4) };
  if (n <= 10) return { difficulty: "MEDIUM", rating: lerp(1800, 2100, (n - 6) / 4) };
  return { difficulty: "HARD", rating: lerp(2200, 2600, (n - 11) / 4) };
}

function getContestConfig(contest: string, year: number): ContestConfig {
  // Build the wiki page prefix like "2024_AMC_8" or "2024_AIME_I"
  const pagePrefix = `${year}_${contest.replace(/ /g, "_")}`;

  const key = contest.toUpperCase();
  if (key === "AMC 8" || key === "AJHSME") {
    return { pagePrefix, problemCount: 25, answerType: "MULTIPLE_CHOICE", difficultyMap: amc8Difficulty };
  }
  if (key.startsWith("AMC 10")) {
    return { pagePrefix, problemCount: 25, answerType: "MULTIPLE_CHOICE", difficultyMap: amc10Difficulty };
  }
  if (key.startsWith("AMC 12")) {
    return { pagePrefix, problemCount: 25, answerType: "MULTIPLE_CHOICE", difficultyMap: amc12Difficulty };
  }
  if (key.startsWith("AIME")) {
    return { pagePrefix, problemCount: 15, answerType: "FREE_RESPONSE", difficultyMap: aimeDifficulty };
  }
  throw new Error(`Unknown contest: ${contest}`);
}

// ===================================================================
// API Fetching
// ===================================================================

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWikitext(page: string): Promise<string> {
  const url = `${API}?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json&origin=*`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch wikitext for ${page}: ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(`Wiki API error for ${page}: ${json.error.info}`);
  return json.parse.wikitext["*"];
}

async function fetchRenderedHtml(page: string): Promise<string> {
  const url = `${API}?action=parse&page=${encodeURIComponent(page)}&format=json&origin=*`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch HTML for ${page}: ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(`Wiki API error for ${page}: ${json.error.info}`);
  return json.parse.text["*"];
}

// ===================================================================
// Parsing
// ===================================================================

function parseAnswerKey(wikitext: string): string[] {
  // Answer keys are formatted as "#ANSWER\n#ANSWER\n..."
  const answers: string[] = [];
  for (const line of wikitext.split("\n")) {
    const match = line.match(/^#\s*(.+)$/);
    if (match) {
      answers.push(match[1].trim());
    }
  }
  return answers;
}

function splitProblems(wikitext: string): string[] {
  // Split on ==Problem N== or ===Problem N=== headers (2 or 3 equals signs)
  // Some contest pages (e.g. 2001 AMC 8) use === for grouped problem subsections
  const parts = wikitext.split(/={2,3}\s*Problem\s+(\d+)\s*={2,3}/);
  // parts: [preamble, "1", text1, "2", text2, ...]
  const problems: string[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    const num = parseInt(parts[i]);
    const text = parts[i + 1] || "";
    // Trim everything after ==Solution==, ===Solution===, ==See Also==, or ==Video==
    let cleaned = text.split(/={2,3}\s*(?:Solution|See\s+Also|See\s+also|Video)/i)[0].trim();
    // Truncate at [[...|Solution]] wiki links (these mark end of problem text)
    // Note: wiki links may have spaces around the pipe: [[...|Solution]] or [[...| Solution]]
    cleaned = cleaned.replace(/\[\[[^\]]*\|\s*Solution\s*\]\][\s\S]*$/, "").trim();
    // Truncate at bare "Solution" on its own line (no == header, common on last-problem pages)
    cleaned = cleaned.replace(/\n\s*Solutions?\s*\n[\s\S]*$/, "").trim();
    // Remove trailing bare "Solution" word (if it's the very last thing)
    cleaned = cleaned.replace(/\n\s*Solutions?\s*$/i, "").trim();
    // Remove trailing stray = signs (from partial == headers)
    cleaned = cleaned.replace(/\n\s*=+\s*$/, "").trim();
    problems[num - 1] = cleaned;
  }
  return problems;
}

function convertMathTags(text: string): string {
  // Convert <cmath>...</cmath> to $$...$$
  let result = text.replace(/<cmath>([\s\S]*?)<\/cmath>/g, (_, inner) => `$$${inner.trim()}$$`);
  // Convert <imath>...</imath> to $...$
  result = result.replace(/<imath>([\s\S]*?)<\/imath>/g, (_, inner) => `$${inner.trim()}$`);
  // Convert <math>...</math> to $...$
  result = result.replace(/<math>([\s\S]*?)<\/math>/g, (_, inner) => `$${inner.trim()}$`);
  // Clean up {,} → , (LaTeX number formatting)
  result = result.replace(/\{,\}/g, ",");
  // Remove [[File:...]] embeds — diagrams are handled via rendered HTML images
  result = result.replace(/\[\[File:[^\]]*\]\]/gi, "");
  // Clean up wiki links [[text]] → text
  result = result.replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1");
  // Clean solution links like [[2024 AMC 8 Problems/Problem 1|Solution]]
  result = result.replace(/\[\[[^\]]*\|Solution\]\]/gi, "");
  // Remove <center>...</center> tags (keep content)
  result = result.replace(/<\/?center>/gi, "");
  // Handle <nowiki>...</nowiki> — used to escape dollar signs that aren't LaTeX
  // e.g. <nowiki>$2.40</nowiki> → $2.40 (literal text, not math)
  result = result.replace(/<nowiki>([\s\S]*?)<\/nowiki>/gi, "$1");
  // Convert '''bold''' wiki markup to plain text
  result = result.replace(/'''([^']*?)'''/g, "$1");
  // Remove empty lines at start/end
  result = result.trim();
  return result;
}

function extractChoices(text: string): { content: string; choices: string[] } {
  // Find the line containing answer choices.
  // Format 1: \textbf{(A)}, \text{(A)}, \mathrm{(A) \ }, \textbf {(A) }
  // Format 2: (\mathrm{A}), (\mathrm {A})  — parens outside the command
  const CMD = "\\\\(?:text(?:bf|rm)?|math(?:rm|bf)?)";
  const format1Detect = new RegExp(`${CMD}\\s*\\{\\s*\\(A\\)`);
  const format2Detect = new RegExp(`\\(\\s*${CMD}\\s*\\{A\\}`);

  const lines = text.split("\n");
  let choiceLineIdx = -1;
  let format: 1 | 2 = 1;

  for (let i = 0; i < lines.length; i++) {
    if (format1Detect.test(lines[i])) {
      choiceLineIdx = i;
      format = 1;
      break;
    }
    if (format2Detect.test(lines[i])) {
      choiceLineIdx = i;
      format = 2;
      break;
    }
  }

  if (choiceLineIdx === -1) {
    return { content: text, choices: [] };
  }

  // Collect choice text — may span multiple lines in some wiki pages
  let choiceLine = lines[choiceLineIdx].trim();
  let endIdx = choiceLineIdx;
  const eMarker = format === 1 ? /\(E\)/ : /\{E\}/;
  if (!eMarker.test(choiceLine)) {
    for (let j = choiceLineIdx + 1; j < lines.length && j < choiceLineIdx + 20; j++) {
      choiceLine += " " + lines[j].trim();
      endIdx = j;
      if (eMarker.test(lines[j])) break;
    }
  }

  // Remove surrounding $...$ if the whole block is wrapped
  if (choiceLine.startsWith("$") && choiceLine.endsWith("$")) {
    choiceLine = choiceLine.slice(1, -1).trim();
  }

  // Split by the detected format's choice markers
  let parts: string[];
  if (format === 1) {
    // \textbf{(X)...}, \mathrm{(X) \ }, etc. — parens inside braces
    parts = choiceLine.split(new RegExp(`${CMD}\\s*\\{\\s*\\([A-E]\\)[^}]*\\}\\s*(?:\\\\[ ~]|~)?\\s*`));
  } else {
    // (\mathrm{X}), (\mathrm {X}) — parens outside the command
    parts = choiceLine.split(new RegExp(`\\(\\s*${CMD}\\s*\\{[A-E]\\}\\s*\\)\\s*(?:\\\\[ ~\\\\]|~)?\\s*`));
  }
  // parts[0] is before (A), parts[1] is value of A, parts[2] is value of B, etc.

  const choices: string[] = [];
  for (let i = 1; i < parts.length; i++) {
    let value = parts[i].trim();
    // Remove trailing \qquad, \quad, commas, and stray \\ (LaTeX newlines)
    value = value.replace(/\\qquad\s*/g, "").replace(/\\quad\s*/g, "").trim();
    value = value.replace(/\\\\\s*/g, "").trim();
    value = value.replace(/,\s*$/, "").trim();
    // Wrap in $...$ if it contains LaTeX commands (so it renders properly)
    if (value && /\\/.test(value) && !value.startsWith("$")) {
      value = `$${value}$`;
    }
    if (value) choices.push(value);
  }

  // Remove all choice lines from content
  lines.splice(choiceLineIdx, endIdx - choiceLineIdx + 1);
  const content = lines.join("\n").trim();

  return { content, choices };
}

function extractDiagramImgUrls(html: string): string[] {
  const urls: string[] = [];

  // Strategy 1: Find Asymptote renders — img with class="latexcenter" and [asy] in alt
  const latexCenterRegex = /<img[^>]*class="latexcenter"[^>]*>/g;
  let match;
  while ((match = latexCenterRegex.exec(html)) !== null) {
    const tag = match[0];
    if (tag.includes("[asy]") || tag.includes("asy")) {
      const srcMatch = tag.match(/src="([^"]+)"/);
      if (srcMatch) {
        let src = srcMatch[1];
        if (src.startsWith("//")) src = "https:" + src;
        urls.push(src);
      }
    }
  }

  // Strategy 2: Find uploaded wiki images (class="mw-file-element") inside <figure> or <a>
  // These are used when editors upload custom diagrams instead of using Asymptote
  if (urls.length === 0) {
    const fileImgRegex = /<img[^>]*class="mw-file-element"[^>]*>/g;
    while ((match = fileImgRegex.exec(html)) !== null) {
      const tag = match[0];
      // Skip logos and non-diagram images
      if (tag.includes("AMC_Logo") || tag.includes("MAA_Logo")) continue;
      const srcMatch = tag.match(/src="([^"]+)"/);
      if (srcMatch) {
        let src = srcMatch[1];
        if (src.startsWith("//")) src = "https:" + src;
        urls.push(src);
      }
    }
  }

  return urls;
}

async function processDiagrams(
  wikitext: string,
  problemPage: string,
): Promise<string> {
  // Check for <asy> blocks or [[File:...]] embeds
  const asyBlocks = wikitext.match(/<asy>[\s\S]*?<\/asy>/g) || [];
  const fileEmbeds = wikitext.match(/\[\[File:[^\]]*\]\]/gi) || [];
  const hasDiagrams = asyBlocks.length > 0 || fileEmbeds.length > 0;

  if (!hasDiagrams) return wikitext;

  // Fetch rendered HTML to get diagram image URLs
  await sleep(RATE_LIMIT_MS);
  console.log(`    Fetching rendered HTML for diagrams from ${problemPage}...`);
  const html = await fetchRenderedHtml(problemPage);

  // Extract only the Problem section from HTML to avoid solution diagrams
  let problemHtml = html;
  const problemSectionMatch = html.match(
    /<span[^>]*>Problem<\/span>[\s\S]*?<\/h2>([\s\S]*?)(?:<h2|$)/i
  );
  if (problemSectionMatch) {
    problemHtml = problemSectionMatch[1];
  }

  let imgUrls = extractDiagramImgUrls(problemHtml);

  // If we couldn't find images in the problem section, try the full HTML
  if (imgUrls.length === 0) {
    imgUrls = extractDiagramImgUrls(html);
  }

  let result = wikitext;

  // Replace <asy> blocks with [diagram]<img>[/diagram]
  let imgIdx = 0;
  for (const asyBlock of asyBlocks) {
    const imgUrl = imgUrls[imgIdx];
    if (imgUrl) {
      result = result.replace(
        asyBlock,
        `[diagram]<img src="${imgUrl}" alt="Diagram" style="max-width:100%;height:auto" />[/diagram]`
      );
      imgIdx++;
    } else {
      console.warn(`    Warning: No image found for <asy> block in ${problemPage}`);
      result = result.replace(asyBlock, "[Diagram not available]");
    }
  }

  // Replace [[File:...]] embeds with [diagram]<img>[/diagram]
  for (const fileEmbed of fileEmbeds) {
    const imgUrl = imgUrls[imgIdx] || imgUrls[0]; // fallback to first image
    if (imgUrl) {
      result = result.replace(
        fileEmbed,
        `[diagram]<img src="${imgUrl}" alt="Diagram" style="max-width:100%;height:auto" />[/diagram]`
      );
      imgIdx++;
    } else {
      console.warn(`    Warning: No image found for file embed in ${problemPage}`);
      result = result.replace(fileEmbed, "");
    }
  }

  return result;
}

// ===================================================================
// Main Scraper
// ===================================================================

async function scrapeContest(contest: string, year: number): Promise<void> {
  const config = getContestConfig(contest, year);
  const source = `${year} ${contest}`;
  console.log(`\nScraping ${source}...`);
  console.log(`  Page prefix: ${config.pagePrefix}`);
  console.log(`  Problems: ${config.problemCount}, Type: ${config.answerType}\n`);

  // Step 1: Fetch answer key
  const answerKeyPage = `${config.pagePrefix}_Answer_Key`;
  console.log(`  Fetching answer key: ${answerKeyPage}`);
  let answers: string[];
  try {
    const answerWikitext = await fetchWikitext(answerKeyPage);
    answers = parseAnswerKey(answerWikitext);
    console.log(`  Found ${answers.length} answers: ${answers.join(", ")}\n`);
  } catch (err) {
    console.error(`  Failed to fetch answer key: ${err}`);
    return;
  }

  if (answers.length !== config.problemCount) {
    console.warn(`  Warning: Expected ${config.problemCount} answers, got ${answers.length}`);
  }

  // Step 2: Fetch main problems page
  await sleep(RATE_LIMIT_MS);
  const problemsPage = `${config.pagePrefix}_Problems`;
  console.log(`  Fetching problems page: ${problemsPage}`);
  let problemTexts: string[];
  try {
    const problemsWikitext = await fetchWikitext(problemsPage);
    problemTexts = splitProblems(problemsWikitext);
    console.log(`  Split into ${problemTexts.filter(Boolean).length} problems\n`);
  } catch (err) {
    console.error(`  Failed to fetch problems page: ${err}`);
    return;
  }

  // Step 3: Process each problem
  const problems: ScrapedProblem[] = [];

  for (let i = 0; i < config.problemCount; i++) {
    const num = i + 1;
    const raw = problemTexts[i];
    if (!raw) {
      console.warn(`  Problem ${num}: No text found, skipping`);
      continue;
    }

    console.log(`  Processing problem ${num}...`);

    // Handle diagrams first (before convertMathTags strips [[File:...]])
    const individualPage = `${config.pagePrefix}_Problems/Problem_${num}`;
    let content = await processDiagrams(raw, individualPage);

    // Convert math tags
    content = convertMathTags(content);

    // Extract choices for multiple choice problems
    let choices: string[] = [];
    if (config.answerType === "MULTIPLE_CHOICE") {
      const extracted = extractChoices(content);
      content = extracted.content;
      choices = extracted.choices;

      if (choices.length === 0) {
        console.warn(`    Warning: No choices extracted for problem ${num}`);
      } else {
        console.log(`    Choices: ${choices.map((c, j) => `${String.fromCharCode(65 + j)}=${c}`).join(", ")}`);
      }
    }

    // Clean up content (order matters: remove templates first, then trailing text)
    content = content
      .replace(/\n{3,}/g, "\n\n") // collapse multiple blank lines
      .replace(/\n\s*\{\{[^}]*\}\}[\s\S]*$/, "") // remove trailing {{template}} blocks (e.g. {{AIME box}})
      .replace(/\n\s*~[^\n]*$/, "") // remove trailing user signatures (e.g. "~good luck :D")
      .replace(/\n\s*\(?Solutions?\)?\s*$/i, "") // remove trailing "Solution", "(Solution)", "Solutions"
      .replace(/\n\s*=+\s*$/, "") // remove trailing stray = signs
      .trim();

    const { difficulty, rating } = config.difficultyMap(num);
    const answer = answers[i] || "";

    problems.push({
      content,
      answer,
      answerType: config.answerType,
      choices,
      rating,
      ratingDeviation: SEED_RD,
      volatility: SEED_VOLATILITY,
      difficulty,
      source,
      sourceNumber: num,
    });

    console.log(`    [${difficulty}] rating=${rating} answer=${answer}`);
  }

  // Step 4: Insert into database
  console.log(`\n  Inserting ${problems.length} problems into database...`);
  let inserted = 0;
  let skipped = 0;

  for (const problem of problems) {
    try {
      await prisma.problem.upsert({
        where: {
          source_sourceNumber: {
            source: problem.source,
            sourceNumber: problem.sourceNumber,
          },
        },
        update: {
          content: problem.content,
          answer: problem.answer,
          answerType: problem.answerType,
          choices: problem.choices,
          rating: problem.rating,
          ratingDeviation: problem.ratingDeviation,
          volatility: problem.volatility,
          difficulty: problem.difficulty,
        },
        create: {
          content: problem.content,
          answer: problem.answer,
          answerType: problem.answerType,
          choices: problem.choices,
          rating: problem.rating,
          ratingDeviation: problem.ratingDeviation,
          volatility: problem.volatility,
          difficulty: problem.difficulty,
          source: problem.source,
          sourceNumber: problem.sourceNumber,
        },
      });
      inserted++;
    } catch (err) {
      console.error(`    Failed to insert problem ${problem.sourceNumber}: ${err}`);
      skipped++;
    }
  }

  console.log(`  Done: ${inserted} inserted/updated, ${skipped} failed`);
}

// ===================================================================
// CLI
// ===================================================================

function printUsage(): void {
  console.log(`
Usage: npm run scrape -- --contest <name> --year <year|range>

Contests: "AMC 8", "AJHSME", "AMC 10A", "AMC 10B", "AMC 12A", "AMC 12B", "AIME I", "AIME II"

Examples:
  npm run scrape -- --contest "AMC 8" --year 2024
  npm run scrape -- --contest "AIME I" --year 2024
  npm run scrape -- --contest "AMC 10A" --year 2020-2024
  npm run scrape -- --contest "AMC 8" --year 2020 --year 2021 --year 2022

Options:
  --contest  Contest name (required)
  --year     Year or year range like 2020-2024 (can be repeated)
  --dry-run  Parse and display problems without inserting into database
  --help     Show this help message
`);
}

function parseYears(args: string[]): number[] {
  const years: number[] = [];
  for (const arg of args) {
    if (arg.includes("-")) {
      const [start, end] = arg.split("-").map(Number);
      for (let y = start; y <= end; y++) years.push(y);
    } else {
      years.push(parseInt(arg));
    }
  }
  return years.filter((y) => !isNaN(y));
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.length === 0) {
    printUsage();
    process.exit(0);
  }

  // Parse --contest
  const contestIdx = args.indexOf("--contest");
  if (contestIdx === -1 || !args[contestIdx + 1]) {
    console.error("Error: --contest is required");
    printUsage();
    process.exit(1);
  }
  const contest = args[contestIdx + 1];

  // Parse --year(s)
  const yearArgs: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--year" && args[i + 1]) {
      yearArgs.push(args[i + 1]);
    }
  }
  const years = parseYears(yearArgs);

  if (years.length === 0) {
    console.error("Error: --year is required");
    printUsage();
    process.exit(1);
  }

  const dryRun = args.includes("--dry-run");
  if (dryRun) {
    console.log("DRY RUN MODE — problems will not be inserted into the database\n");
  }

  console.log(`Contest: ${contest}`);
  console.log(`Years: ${years.join(", ")}`);
  console.log(`Total batches: ${years.length}`);

  for (const year of years) {
    try {
      if (dryRun) {
        // For dry run, just validate the config and fetch/parse
        const config = getContestConfig(contest, year);
        console.log(`\n[DRY RUN] ${year} ${contest} — ${config.problemCount} problems`);
      } else {
        await scrapeContest(contest, year);
      }
    } catch (err) {
      console.error(`\nFailed to scrape ${year} ${contest}: ${err}`);
    }
    // Rate limit between contests
    if (years.indexOf(year) < years.length - 1) {
      await sleep(1000);
    }
  }

  // Print final summary
  const total = await prisma.problem.count();
  const scraped = await prisma.problem.count({ where: { source: { not: null } } });
  console.log(`\n========================================`);
  console.log(`Total problems in database: ${total}`);
  console.log(`Scraped problems: ${scraped}`);
  console.log(`========================================`);
}

main()
  .catch((e) => {
    console.error("Scraper failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
