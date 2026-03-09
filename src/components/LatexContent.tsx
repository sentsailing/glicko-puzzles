"use client";

import katex from "katex";
import "katex/dist/katex.min.css";

interface LatexContentProps {
  content: string;
}

/**
 * Renders text with LaTeX math expressions and optional SVG diagrams.
 * Supports:
 *   $$...$$ for display (block) math
 *   $...$   for inline math
 *   \(...\) for inline math
 *   \[...\] for display math
 *   [diagram]...[/diagram] for inline SVG diagrams
 *
 * Non-math text is rendered as plain text with the KaTeX (Computer Modern) font.
 */
export function LatexContent({ content }: LatexContentProps) {
  const html = renderContent(content);
  return <div className="latex-content" dangerouslySetInnerHTML={{ __html: html }} />;
}

function renderContent(input: string): string {
  // Split on [diagram]...[/diagram] blocks, preserving them
  const parts = input.split(/(\[diagram\][\s\S]*?\[\/diagram\])/g);

  return parts
    .map((part) => {
      const diagramMatch = part.match(
        /^\[diagram\]([\s\S]*?)\[\/diagram\]$/
      );
      if (diagramMatch) {
        return `<div class="problem-diagram">${sanitizeSvg(diagramMatch[1])}</div>`;
      }
      return processLatex(part);
    })
    .join("");
}

/** Sanitize SVG/HTML content to prevent XSS while allowing safe SVG markup. */
function sanitizeSvg(html: string): string {
  return html
    // Remove script tags and contents
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    // Remove dangerous tags (keep their content)
    .replace(/<\/?(iframe|object|embed|form|input|textarea|button|link|meta|base)[^>]*>/gi, "")
    // Remove event handler attributes
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    // Remove javascript: URLs
    .replace(/(href|xlink:href)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, "$1=\"\"");
}

/** Convert LaTeX commands that KaTeX doesn't fully support to equivalents it does. */
function katexCompat(latex: string): string {
  return latex
    .replace(/\\textdollar/g, "\\$")
    .replace(/\\begin\{tabular\}/g, "\\begin{array}")
    .replace(/\\end\{tabular\}/g, "\\end{array}");
}

function processLatex(input: string): string {
  // Match display math ($$...$$ or \[...\]), then inline math ($...$ or \(...\)).
  // Inline $...$ uses (?:[^$\\]|\\.)+ to treat \$ as an escaped dollar sign
  // inside math, not as a closing delimiter.
  const pattern =
    /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\$((?:[^$\\]|\\.)+?)\$|\\\(([\s\S]+?)\\\)/g;

  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input)) !== null) {
    if (match.index > lastIndex) {
      result += escapeHtml(input.slice(lastIndex, match.index));
    }

    const displayMath = match[1] ?? match[2];
    const inlineMath = match[3] ?? match[4];

    if (displayMath !== undefined) {
      try {
        result += katex.renderToString(katexCompat(displayMath), {
          displayMode: true,
          throwOnError: false,
        });
      } catch {
        result += escapeHtml(match[0]);
      }
    } else if (inlineMath !== undefined) {
      // Promote block-level environments to display mode
      const isBlock = /\\begin\{/.test(inlineMath);
      try {
        result += katex.renderToString(katexCompat(inlineMath), {
          displayMode: isBlock,
          throwOnError: false,
        });
      } catch {
        result += escapeHtml(match[0]);
      }
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < input.length) {
    result += escapeHtml(input.slice(lastIndex));
  }

  return result;
}

/** Safe HTML tags allowed in problem content (formatting only). */
const SAFE_TAG_RE = /^<\/?(u|i|b|em|strong|sup|sub)(\s[^>]*)?>$/i;

function escapeHtml(text: string): string {
  // Preserve safe formatting tags, escape everything else.
  // First handle ampersands and quotes, then process tags individually.
  return text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/<[^>]*>/g, (tag) => {
      if (SAFE_TAG_RE.test(tag)) return tag;
      return tag.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    });
}
