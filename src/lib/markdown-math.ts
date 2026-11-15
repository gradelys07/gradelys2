/**
 * Normalizes LaTeX delimiters (`\(...\)` and `\[...\]`) into `$...$` and `$$...$$`
 * expected by `remark-math` / `rehype-katex`, while leaving fenced code blocks and
 * inline code spans completely untouched.
 */
function normalizeProseSegment(segment: string): string {
  // Replace display math \[ ... \] first (supports multiline equations)
  let out = segment.replace(/\\\[([\s\S]+?)\\\]/g, (_match, expr: string) => {
    const trimmed = expr.trim();
    if (!trimmed) return _match;
    return `\n\n$$\n${trimmed}\n$$\n\n`;
  });

  // Replace inline math \( ... \) on single paragraphs
  out = out.replace(/\\\(([^\n]+?)\\\)/g, (_match, expr: string) => {
    const trimmed = expr.trim();
    if (!trimmed) return _match;
    return `$${trimmed}$`;
  });

  return out;
}

export function normalizeMathMarkdown(markdown: string): string {
  if (!markdown) return "";
  // Fast exit when neither escaped LaTeX delimiter appears
  if (!markdown.includes("\\(") && !markdown.includes("\\[")) {
    return markdown;
  }

  let result = "";
  let i = 0;
  let proseStart = 0;
  const len = markdown.length;

  const flushProse = (end: number) => {
    if (end > proseStart) {
      result += normalizeProseSegment(markdown.slice(proseStart, end));
    }
  };

  while (i < len) {
    const atLineStart = i === 0 || markdown[i - 1] === "\n";
    const ch = markdown[i];

    // Check for fenced code blocks (``` or ~~~) at the start of a line
    if (atLineStart && (ch === "`" || ch === "~")) {
      let fenceCount = 0;
      while (i + fenceCount < len && markdown[i + fenceCount] === ch) {
        fenceCount++;
      }
      if (fenceCount >= 3) {
        flushProse(i);
        const fence = ch.repeat(fenceCount);
        let j = markdown.indexOf("\n", i + fenceCount);
        if (j === -1) {
          // Unclosed fence while streaming: keep remainder literal
          result += markdown.slice(i);
          return result;
        }
        let closeIdx = -1;
        let lineCursor = j + 1;
        while (lineCursor < len) {
          const nextNl = markdown.indexOf("\n", lineCursor);
          const lineEnd = nextNl === -1 ? len : nextNl;
          const line = markdown.slice(lineCursor, lineEnd).trim();
          if (line.startsWith(fence) && [...line].every((c) => c === ch)) {
            closeIdx = lineEnd;
            break;
          }
          if (nextNl === -1) break;
          lineCursor = nextNl + 1;
        }
        if (closeIdx === -1) {
          result += markdown.slice(i);
          return result;
        }
        result += markdown.slice(i, closeIdx);
        i = closeIdx;
        proseStart = i;
        continue;
      }
    }

    // Check for inline code spans (`...`)
    if (ch === "`") {
      let tickCount = 0;
      while (i + tickCount < len && markdown[i + tickCount] === "`") {
        tickCount++;
      }
      const closing = "`".repeat(tickCount);
      const closePos = markdown.indexOf(closing, i + tickCount);
      if (closePos !== -1) {
        // Ensure exact backtick count match is preserved cleanly
        let end = closePos + tickCount;
        while (end < len && markdown[end] === "`") {
          end++;
        }
        if (end - closePos === tickCount) {
          flushProse(i);
          result += markdown.slice(i, end);
          i = end;
          proseStart = i;
          continue;
        }
      }
      i += tickCount;
      continue;
    }

    i++;
  }

  flushProse(len);
  return result;
}

