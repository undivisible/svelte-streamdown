# svelte-streamdown

A Svelte 5 markdown renderer for AI-powered streaming applications. Renders markdown as it arrives, token by token, with support for incomplete syntax, code highlighting, math, and CJK text.

Port of [Vercel Streamdown](https://github.com/vercel/streamdown) for Svelte 5.

## Features

- **Streaming-optimized** — handles incomplete markdown gracefully via [remend](https://github.com/vercel/streamdown/tree/main/packages/remend)
- **Code highlighting** — Shiki-powered with dual-theme CSS variables (light + dark)
- **Math** — LaTeX via KaTeX
- **CJK support** — correct punctuation handling for Chinese/Japanese/Korean
- **GitHub Flavored Markdown** — tables, task lists, strikethrough
- **Security** — rehype-harden sanitization
- **Incremental rendering** — only changed blocks re-process through the pipeline

## Install

```bash
npm install svelte-streamdown
```

Requires Svelte 5.

## Usage

```svelte
<script>
  import { Streamdown } from "svelte-streamdown";
  import "svelte-streamdown/styles.css";

  let markdown = $state("**Hello** world");
</script>

<Streamdown {markdown} />
```

## Props

| Prop                       | Type                       | Default       | Description                                                     |
| -------------------------- | -------------------------- | ------------- | --------------------------------------------------------------- |
| `markdown`                 | `string`                   | `""`          | Markdown content to render                                      |
| `mode`                     | `"streaming" \| "static"`  | `"streaming"` | Streaming mode repairs incomplete syntax; static renders as-is  |
| `dir`                      | `"auto" \| "ltr" \| "rtl"` | `"auto"`      | Text direction. `auto` detects per-block                        |
| `animated`                 | `boolean`                  | `false`       | Fade-in animation on new blocks                                 |
| `caret`                    | `boolean \| string`        | `false`       | Show a caret at the end (`"block"`, `"circle"`, or custom char) |
| `parseIncompleteMarkdown`  | `boolean`                  | `true`        | Enable incomplete markdown repair (streaming mode)              |
| `normalizeHtmlIndentation` | `boolean`                  | `false`       | Remove extra indentation from HTML blocks                       |
| `rehypePlugins`            | `PluggableList`            | `[]`          | Additional rehype plugins                                       |
| `remarkPlugins`            | `PluggableList`            | `[]`          | Additional remark plugins                                       |

## Code Highlighting

Code blocks are highlighted with [Shiki](https://shiki.style/) using dual-theme CSS variables. Both light and dark themes are baked into the HTML — your CSS switches between them.

Code blocks include a **header bar** with:
- Language label (e.g. "typescript")
- Copy-to-clipboard button

```css
/* Light mode (default) */
.svelte-streamdown pre:has(code.shiki) {
  background-color: var(--shiki-light-bg);
  color: var(--shiki-light-fg);
}
.svelte-streamdown .shiki .line span {
  color: var(--shiki-light);
}

/* Dark mode via system preference */
@media (prefers-color-scheme: dark) {
  .svelte-streamdown pre:has(code.shiki) {
    background-color: var(--shiki-dark-bg);
  }
  .svelte-streamdown .shiki .line span {
    color: var(--shiki-dark);
  }
}

/* Dark mode via .dark class */
.dark .svelte-streamdown pre:has(code.shiki) {
  background-color: var(--shiki-dark-bg);
}
.dark .svelte-streamdown .shiki .line span {
  color: var(--shiki-dark);
}
```

Languages are loaded on demand — only the ones used in your content are fetched.

## Math

Math rendering via KaTeX. Wrap the package with remark-math and rehype-katex:

```svelte
<script>
  import remarkMath from "remark-math";
  import rehypeKatex from "rehype-katex";
  import "katex/dist/katex.min.css";
</script>

<Streamdown
  {markdown}
  remarkPlugins={[remarkMath]}
  rehypePlugins={[rehypeKatex]}
/>
```

## Mermaid Diagrams

Mermaid is supported as an opt-in feature. Install mermaid as a peer dependency, then use fenced code blocks with `mermaid` language:

````markdown
```mermaid
graph TD
  A[Start] --> B[End]
```
````

Mermaid lazy-loads on mount and renders as SVG. Falls back to preformatted text if the diagram is invalid.

```bash
npm install mermaid
```

## Animations

Pass `animated` as a string to select animation type:

```svelte
<Streamdown {markdown} animated="blur" />
<Streamdown {markdown} animated="slide-up" />
<Streamdown {markdown} animated="slide-down" />
```

Or use the boolean shorthand for fade-in:

```svelte
<Streamdown {markdown} animated />
```

## Custom Plugins

Pass any unified remark/rehype plugins:

```svelte
<Streamdown
  {markdown}
  remarkPlugins={[remarkMath, myRemarkPlugin]}
  rehypePlugins={[rehypeKatex, myRehypePlugin]}
/>
```

## Styling

Import the default stylesheet for base typography:

```js
import "svelte-streamdown/styles.css";
```

Override in your own CSS by targeting `.svelte-streamdown`:

```css
.svelte-streamdown pre {
  background: #1e1e2e;
  border-radius: 8px;
}
```

## Differences from upstream

This is a Svelte port of [Vercel Streamdown](https://github.com/vercel/streamdown) (React). Key differences:

|                   | upstream (React)                            | this (Svelte)                         |
| ----------------- | ------------------------------------------- | ------------------------------------- |
| Framework         | React 18+                                   | Svelte 5                              |
| Lexing            | Custom remark pipeline                      | Same unified/remark pipeline          |
| Code highlighting | Component-level plugin (`@streamdown/code`) | rehype plugin (inline in pipeline)    |
| Math              | Opt-in (`@streamdown/math`)                 | Opt-in via remark-math + rehype-katex |
| Mermaid           | Opt-in (`@streamdown/mermaid`)              | Opt-in (lazy-loaded)                  |
| Animations        | Blur, fade, slide                           | Fade, blur, slide                     |
| Code block header | Copy, download, language                    | Copy, language                        |
| Theme system      | Tailwind + shadcn                           | Plain CSS (user stylesheets)          |
| Streaming repair  | remend                                      | remend (same library)                 |

## License

MPL-2.0. Upstream code from Vercel Streamdown retains Apache-2.0 license.
