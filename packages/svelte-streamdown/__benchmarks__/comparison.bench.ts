import { bench, describe } from "vitest";

const SMALL = `# Hello\n\n**Bold** and _italic_ with \`code\`.\n\n- Item 1\n- Item 2\n\n> Quote.`;

const MEDIUM = `# Streaming Markdown Renderer\n\nThis is a **Svelte port** of Vercel's Streamdown.\n\n## Features\n\n- **Streaming-optimized** — handles incomplete markdown gracefully\n- **Code highlighting** — Shiki-powered with dual-theme CSS\n- **Math** — LaTeX via KaTeX\n\n\`\`\`typescript\ninterface Props {\n  markdown: string;\n  mode?: "streaming" | "static";\n}\n\`\`\`\n\n| Feature | Status |\n|---------|--------|\n| Streaming | Done |\n| Code highlight | Done |\n\n---\n\nThis paragraph simulates a longer AI response to test throughput. It includes multiple sentences and formatting to stress the parser. The key metric is how fast each renderer can process the markdown and produce a hast tree or HTML output. The streaming renderer needs to handle this efficiently, processing each character as it arrives.`;

const LARGE = `# Complete Benchmark\n\n**Bold**, *italic*, ~~strike~~, \`code\`, [link](https://example.com).\n\n- Item 1\n- Item 2\n  - Nested\n\n1. Step one\n2. Step two\n\n\`\`\`javascript\nfunction hello() {\n  console.log("world");\n}\n\`\`\`\n\n> Blockquote with **bold** and \`code\`.\n\n| A | B | C |\n|---|---|---|\n| 1 | 2 | 3 |\n| 4 | 5 | 6 |\n\n---\n\nParagraph with **bold**, *italic*, \`code\`, and [link](https://example.com). This is a longer paragraph to test parsing performance with mixed inline formatting.`;

// ── Our implementation (unified + remend + shiki) ──────────────

import { renderStreamdownBlocks as ours } from "../src/lib/markdown";

// ── beynar approach: just marked lexer ──────────────────────────

const { Lexer } = await import("marked");
const beynarLex = (md: string) => Lexer.lex(md, { gfm: true });

// ── Upstream unified: just parse step ──────────────────────────

const { unified } = await import("unified");
const { default: remarkParse } = await import("remark-parse");
const unifiedParser = unified().use(remarkParse);
const upstreamParse = (md: string) => unifiedParser.parse(md);

// ── Benchmarks ─────────────────────────────────────────────────

describe("parse-only comparison: small (120 chars)", () => {
  bench("ours (full pipeline)", async () => {
    await ours(SMALL, { mode: "static" });
  });
  bench("beynar (marked lexer)", () => {
    beynarLex(SMALL);
  });
  bench("upstream (unified parse)", () => {
    upstreamParse(SMALL);
  });
});

describe("parse-only comparison: medium (1.5KB)", () => {
  bench("ours (full pipeline)", async () => {
    await ours(MEDIUM, { mode: "static" });
  });
  bench("beynar (marked lexer)", () => {
    beynarLex(MEDIUM);
  });
  bench("upstream (unified parse)", () => {
    upstreamParse(MEDIUM);
  });
});

describe("parse-only comparison: large (3KB)", () => {
  bench("ours (full pipeline)", async () => {
    await ours(LARGE, { mode: "static" });
  });
  bench("beynar (marked lexer)", () => {
    beynarLex(LARGE);
  });
  bench("upstream (unified parse)", () => {
    upstreamParse(LARGE);
  });
});

describe("streaming vs static", () => {
  bench("ours: static (no remend)", async () => {
    await ours(MEDIUM, { mode: "static" });
  });
  bench("ours: streaming (with remend)", async () => {
    await ours(MEDIUM, { mode: "streaming" });
  });
});
