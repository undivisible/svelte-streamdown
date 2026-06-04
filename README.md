# Svelte Streamdown

Svelte Streamdown is a Svelte 5 streaming markdown renderer for AI chat interfaces. It ports the useful streaming markdown behavior from Vercel's Streamdown into a focused Svelte package and keeps `remend` for incomplete markdown repair.

## Packages

- `packages/svelte-streamdown` - the Svelte component package.
- `packages/remend` - incomplete markdown repair utilities retained from upstream Streamdown.

## Usage

```svelte
<script lang="ts">
  import { Streamdown } from "svelte-streamdown";
  import "svelte-streamdown/styles.css";

  let markdown = $state("**Streaming** markdown");
</script>

<Streamdown {markdown} animated />
```

The package exposes:

- `Streamdown` - the main Svelte component.
- `styles.css` - default markdown styling.

## Development

Install dependencies with Bun:

```sh
bun install
```

Run the main quality gates:

```sh
bun run format:check
bun run typecheck
bun run lint
bun run test
bun run build
```

Build only the publishable packages:

```sh
bun run build:packages
```

Run the `remend` benchmark suite:

```sh
bun run bench
```

## License

New Svelte Streamdown code is licensed under MPL-2.0. Apache-2.0 upstream license material is retained in `LICENSE-APACHE` for copied or derived upstream Streamdown and `remend` work.
