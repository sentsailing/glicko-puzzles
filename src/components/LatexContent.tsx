"use client";

import katex from "katex";
import "katex/dist/katex.min.css";

interface LatexContentProps {
  content: string;
}

/**
 * Renders text with LaTeX math expressions.
 * Supports:
 *   $$...$$ for display (block) math
 *   $...$   for inline math
 *   \(...\) for inline math
 *   \[...\] for display math
 *
 * Non-math text is rendered as plain text.
 */
export function LatexContent({ content }: LatexContentProps) {
  const html = renderLatexToHtml(content);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function renderLatexToHtml(input: string): string {
  // Regex to match LaTeX delimiters in order of precedence:
  // 1. $$...$$ (display math)
  // 2. \[...\] (display math)
  // 3. $...$ (inline math, non-greedy)
  // 4. \(...\) (inline math)
  const pattern = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\$([^$\n]+?)\$|\\\(([\s\S]+?)\\\)/g;

  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      result += escapeHtml(input.slice(lastIndex, match.index));
    }

    // Determine which group matched
    const displayMath = match[1] ?? match[2]; // $$ or \[
    const inlineMath = match[3] ?? match[4]; // $ or \(

    if (displayMath !== undefined) {
      try {
        result += katex.renderToString(displayMath, {
          displayMode: true,
          throwOnError: false,
        });
      } catch {
        result += escapeHtml(match[0]);
      }
    } else if (inlineMath !== undefined) {
      try {
        result += katex.renderToString(inlineMath, {
          displayMode: false,
          throwOnError: false,
        });
      } catch {
        result += escapeHtml(match[0]);
      }
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < input.length) {
    result += escapeHtml(input.slice(lastIndex));
  }

  return result;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
