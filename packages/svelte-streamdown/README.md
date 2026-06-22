# svelte-streamdown

A Svelte 5 markdown renderer for AI-powered streaming applications.

Port of [Vercel Streamdown](https://github.com/vercel/streamdown) for Svelte 5.

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

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `markdown` | `string` | `""` | Markdown content to render |
| `mode` | `"streaming" \| "static"` | `"streaming"` | Streaming mode repairs incomplete syntax; static renders as-is |
| `dir` | `"auto" \| "ltr" \| "rtl"` | `"auto"` | Text direction. `auto` detects per-block |
| `animated` | `boolean \| string` | `false` | Animation: `true` (fade), `"blur"`, `"slide-up"`, `"slide-down"` |
| `caret` | `boolean \| string` | `false` | Caret at end (`"block"`, `"circle"`, or custom char) |
| `parseIncompleteMarkdown` | `boolean` | `true` | Enable incomplete markdown repair |
| `normalizeHtmlIndentation` | `boolean` | `false` | Remove extra indentation from HTML blocks |
| `rehypePlugins` | `PluggableList` | `[]` | Additional rehype plugins |
| `remarkPlugins` | `PluggableList` | `[]` | Additional remark plugins |

## Features

- Streaming-optimized with incomplete markdown repair ([remend](https://github.com/vercel/streamdown/tree/main/packages/remend))
- Code highlighting via Shiki with dual-theme CSS variables (light + dark)
- Code blocks with language label + copy button
- Mermaid diagrams (opt-in, install `mermaid` peer dep)
- Math via KaTeX (opt-in, add `remark-math` + `rehype-katex`)
- CJK punctuation handling
- GitHub Flavored Markdown (tables, task lists, strikethrough)
- Security via rehype-harden
- CSS-framework-agnostic (plain CSS, Tailwind, UnoCSS, etc.)

See [full documentation](https://github.com/undivisible/svelte-streamdown#readme) for theming, animations, plugins, and comparison with upstream.

## License

MPL-2.0. Apache-2.0 upstream license retained.
