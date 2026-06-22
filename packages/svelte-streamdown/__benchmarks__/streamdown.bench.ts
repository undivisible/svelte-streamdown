import { bench, describe } from "vitest";
import { renderStreamdownBlocks } from "../src/lib/markdown";

// ── Test documents ──────────────────────────────────────────────

const SMALL = `# Hello

This is a **bold** and _italic_ text with \`code\` and [links](https://example.com).

- Item 1
- Item 2
- Item 3

> Blockquote here.`;

const MEDIUM = `# Streaming Markdown Renderer

This is a **Svelte port** of Vercel's Streamdown. It renders markdown as it arrives, token by token.

## Features

- **Streaming-optimized** — handles incomplete markdown gracefully
- **Code highlighting** — Shiki-powered with dual-theme CSS
- **Math** — LaTeX via KaTeX
- **CJK support** — correct punctuation handling

\`\`\`typescript
interface StreamdownProps {
  markdown: string;
  mode?: "streaming" | "static";
  animated?: boolean;
  caret?: boolean | string;
}

export function renderMarkdown(options: StreamdownProps): string {
  const processor = createProcessor(options);
  const tree = processor.runSync(processor.parse(options.markdown));
  return toHtml(tree);
}
\`\`\`

### Math

Inline: $E = mc^2$ and display:

$$
f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}
$$

### Table

| Feature | Status | Priority |
|---------|--------|----------|
| Streaming | Done | High |
| Code highlight | Done | High |
| Math | Done | Medium |
| Mermaid | Done | Medium |

---

This is a long document to test performance with realistic content. It includes multiple sections, code blocks, tables, and math expressions to simulate a real-world AI chat response. The streaming renderer needs to handle this efficiently, processing each character as it arrives without blocking the main thread.

### Why performance matters

When an AI model generates a response, the markdown arrives character by character. A slow renderer means visible lag between generation and display. Users perceive this as the AI being slow, even when the model itself is fast.

The key optimization is **incremental rendering** — only re-process blocks that have changed, not the entire document. Combined with efficient parsing (unified/remark vs marked), this gives us sub-millisecond render times for typical updates.`;

const LARGE = `
# Complete Markdown Benchmark

This document tests all supported markdown features in a single render.

## Text Formatting

**Bold text**, *italic text*, ~~strikethrough~~, \`inline code\`, [links](https://example.com "Title").

### Nested formatting

**Bold with _italic_ inside** and *italic with **bold** inside*.

## Lists

### Unordered

- First item
- Second item with **bold**
- Third item with \`code\`
  - Nested item
  - Another nested item

### Ordered

1. Step one
2. Step two with [link](https://example.com)
3. Step three

### Task list

- [x] Completed task
- [ ] Pending task
- [ ] Another pending task

## Code

### Inline

Use \`console.log("hello")\` to print.

### Block

\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55
\`\`\`

### TypeScript

\`\`\`typescript
interface Config {
  theme: "light" | "dark";
  plugins: string[];
  render: (markdown: string) => string;
}

const defaultConfig: Config = {
  theme: "dark",
  plugins: ["remark-gfm", "rehype-katex"],
  render: (md) => md.toUpperCase(),
};
\`\`\`

## Blockquotes

> This is a blockquote.
>
> It can span multiple paragraphs.
>
> > Nested blockquote.

## Tables

| Name | Type | Required | Default |
|------|------|----------|---------|
| markdown | string | Yes | - |
| mode | string | No | "streaming" |
| animated | boolean | No | false |
| caret | string | No | false |

## Horizontal Rule

---

## Links and Images

[External link](https://github.com)

[Link with title](https://github.com "GitHub")

## Math

Inline: $E = mc^2$

Block:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

## HTML (passthrough)

<div>
  <p>Raw HTML content</p>
</div>

## Mixed content

This paragraph has **bold**, *italic*, \`code\`, and a [link](https://example.com). It also has a list:

1. First with **bold**
2. Second with \`code\`
3. Third with [link](https://example.com)

> And a blockquote at the end.

---

*End of benchmark document.*`;

// ── Benchmarks ─────────────────────────────────────────────────

describe("renderStreamdownBlocks", () => {
  bench("small doc (120 chars)", async () => {
    await renderStreamdownBlocks(SMALL, { mode: "static" });
  });

  bench("medium doc (1.5KB)", async () => {
    await renderStreamdownBlocks(MEDIUM, { mode: "static" });
  });

  bench("large doc (3KB)", async () => {
    await renderStreamdownBlocks(LARGE, { mode: "static" });
  });

  bench("streaming mode - medium", async () => {
    await renderStreamdownBlocks(MEDIUM, { mode: "streaming" });
  });

  bench("streaming mode - large", async () => {
    await renderStreamdownBlocks(LARGE, { mode: "streaming" });
  });
});

describe("streaming throughput", () => {
  bench("process 100 chars", async () => {
    for (let i = 0; i < 100; i++) {
      await renderStreamdownBlocks(MEDIUM.slice(0, i + 1), {
        mode: "streaming",
      });
    }
  });
});
