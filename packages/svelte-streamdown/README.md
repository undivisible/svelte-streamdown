# Svelte Streamdown

A Svelte 5 markdown renderer designed for AI-powered streaming.

## Installation

```sh
bun add svelte-streamdown
```

## Usage

```svelte
<script lang="ts">
  import { Streamdown } from "svelte-streamdown";
  import "svelte-streamdown/styles.css";

  let markdown = $state("**Streaming** markdown");
</script>

<Streamdown {markdown} animated />
```

## API

- `markdown` - markdown content to render.
- `animated` - animates newly streamed blocks when enabled.

Import `svelte-streamdown/styles.css` for the default rendered markdown styles.
