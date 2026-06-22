import { bench, describe } from "vitest";

// ── Test documents ──────────────────────────────────────────────

const SMALL = `# Hello

This is **bold** and _italic_ text with \`code\`.

- Item 1
- Item 2

> Blockquote.`;

const MEDIUM = `# Streaming Markdown Renderer

This is a **Svelte port** of Vercel's Streamdown.

## Features

- **Streaming-optimized** — handles incomplete markdown gracefully
- **Code highlighting** — Shiki-powered with dual-theme CSS
- **Math** — LaTeX via KaTeX

\`\`\`typescript
interface Props {
  markdown: string;
  mode?: "streaming" | "static";
}
\`\`\`

| Feature | Status |
|---------|--------|
| Streaming | Done |
| Code highlight | Done |

---

This paragraph simulates a longer AI response to test throughput. It includes multiple sentences and formatting to stress the parser. The key metric is how fast each renderer can process the markdown and produce a hast tree or HTML output.`;

const LARGE = `# Complete Benchmark

**Bold**, *italic*, ~~strike~~, \`code\`, [link](https://example.com).

- Item 1
- Item 2
  - Nested

1. Step one
2. Step two

\`\`\`javascript
function hello() {
  console.log("world");
}
\`\`\`

> Blockquote with **bold** and \`code\`.

| A | B | C |
|---|---|---|
| 1 | 2 | 3 |
| 4 | 5 | 6 |

---

$E = mc^2$

Paragraph with **bold**, *italic*, \`code\`, and [link](https://example.com). This is a longer paragraph to test parsing performance with mixed inline formatting. `;

// ── Our implementation (unified/remark) ────────────────────────

import { renderStreamdownBlocks as ours } from "../src/lib/markdown";

// ── beynar implementation (marked) ─────────────────────────────
// Import beynar's marked lexer for fair comparison

let beynarParse: (md: string) => any;
try {
  const markedMod = await import("marked");
  const Lexer = markedMod.Lexer;
  beynarParse = (md: string) => Lexer.lex(md, { gfm: true });
} catch {
  beynarParse = () => null;
}

// ── Upstream unified pipeline (same as ours without remend) ────

let unifiedParse: (md: string) => any;
try {
  const unifiedMod = await import("unified");
  const remarkParseMod = await import("remark-parse");
  const unified = unifiedMod.unified;
  const remarkParse = remarkParseMod.default;
  const processor = unified().use(remarkParse);
  unifiedParse = (md: string) => processor.parse(md);
} catch {
  unifiedParse = () => null;
}

// ── Benchmarks ─────────────────────────────────────────────────

describe("pipeline comparison: small doc", () => {
  bench("ours (unified + remend + shiki)", async () => {
    await ours(SMALL, { mode: "static" });
  });

  if (beynarParse) {
    bench("beynar (marked lexer)", () => {
      beynarParse(SMALL);
    });
  }

  if (unifiedParse) {
    bench("upstream (unified parse only)", () => {
      unifiedParse(SMALL);
    });
  }
});

describe("pipeline comparison: medium doc", () => {
  bench("ours (unified + remend + shiki)", async () => {
    await ours(MEDIUM, { mode: "static" });
  });

  if (beynarParse) {
    bench("beynar (marked lexer)", () => {
      beynarParse(MEDIUM);
    });
  }

  if (unifiedParse) {
    bench("upstream (unified parse only)", () => {
      unifiedParse(MEDIUM);
    });
  }
});

describe("pipeline comparison: large doc", () => {
  bench("ours (unified + remend + shiki)", async () => {
    await ours(LARGE, { mode: "static" });
  });

  if (beynarParse) {
    bench("beynar (marked lexer)", () => {
      beynarParse(LARGE);
    });
  }

  if (unifiedParse) {
    bench("upstream (unified parse only)", () => {
      unifiedParse(LARGE);
    });
  }
});

describe("streaming mode", () => {
  bench("ours: streaming (full pipeline + remend)", async () => {
    await ours(MEDIUM, { mode: "streaming" });
  });

  bench("ours: static (no remend)", async () => {
    await ours(MEDIUM, { mode: "static" });
  });
});
