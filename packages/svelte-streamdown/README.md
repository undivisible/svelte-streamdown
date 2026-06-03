# Svelte Streamdown

A Svelte markdown renderer designed for AI-powered streaming.

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
