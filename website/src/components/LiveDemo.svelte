<script lang="ts">
  import { onMount } from "svelte";
  import { Streamdown } from "svelte-streamdown";
  import "svelte-streamdown/styles.css";

  let markdown = $state("");

  let isStreaming = $state(false);
  let streamInterval: ReturnType<typeof setInterval> | null = null;

  const sampleText = `# Hello World

This is **Streamdown** — a Svelte port of Vercel's streaming markdown renderer.

## Features

- Streams in real-time
- Repairs incomplete syntax
- Code blocks, math, tables

\`\`\`ts
const greeting = "Hello from Streamdown";
\`\`\`

Math: $E = mc^2$

---

## How it works

Streamdown processes markdown as it arrives, token by token. The \`remend\` library repairs incomplete syntax before rendering.

\`\`\`svelte
<script>
  import { Streamdown } from "svelte-streamdown";
  import "svelte-streamdown/styles.css";

  let markdown = $state("");
<\/script>

<Streamdown {markdown} />
\`\`\`

### Rendering pipeline

1. **Parse** incoming text into blocks
2. **Repair** incomplete markdown with remend
3. **Transform** through remark → rehype
4. **Sanitize** output for safety
5. **Render** as Svelte components

> No flickering. No broken layouts. Just smooth streaming.

---

*Port of [Vercel Streamdown](https://github.com/vercel/streamdown) for Svelte 5.*`;

  function startStream() {
    if (isStreaming) return;
    isStreaming = true;
    markdown = "";
    let i = 0;

    streamInterval = setInterval(() => {
      if (i < sampleText.length) {
        markdown += sampleText[i];
        i++;
      } else {
        stopStream();
      }
    }, 10);
  }

  function stopStream() {
    if (streamInterval) {
      clearInterval(streamInterval);
      streamInterval = null;
    }
    isStreaming = false;
  }

  function resetDemo() {
    stopStream();
    markdown = sampleText;
  }

  onMount(() => {
    startStream();
  });
</script>

<div class="controls">
  <button onclick={startStream} disabled={isStreaming}>
    {isStreaming ? "streaming…" : "▶ stream"}
  </button>
  <button onclick={stopStream} disabled={!isStreaming}>stop</button>
  <button onclick={resetDemo}>reset</button>
</div>

<div class="panes">
  <div class="pane">
    <div class="label">input</div>
    <textarea
      bind:value={markdown}
      class="input"
      spellcheck="false"
      disabled={isStreaming}
    ></textarea>
  </div>
  <div class="divider"></div>
  <div class="pane">
    <div class="label">output</div>
    <div class="output">
      <Streamdown {markdown} animated />
    </div>
  </div>
</div>

<style>
  .controls {
    display: flex;
    gap: 0.375rem;
    margin-bottom: 0.75rem;
  }

  .controls button {
    padding: 0.375rem 0.875rem;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text-dim);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.1s;
  }

  .controls button:hover:not(:disabled) {
    color: var(--text);
    border-color: var(--border-hover);
  }

  .controls button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .panes {
    display: grid;
    grid-template-columns: 1fr 1px 1fr;
    height: 70vh;
    min-height: 400px;
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
  }

  .pane {
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
  }

  .label {
    padding: 0.375rem 0.75rem;
    font-family: var(--font-mono);
    font-size: 0.625rem;
    font-weight: 500;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    background: var(--bg-raised);
    border-bottom: 1px solid var(--border);
  }

  .divider {
    background: var(--border);
  }

  .input {
    flex: 1;
    padding: 1rem;
    background: transparent;
    border: none;
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    line-height: 1.75;
    resize: none;
    outline: none;
    tab-size: 2;
  }

  .input:disabled {
    opacity: 0.5;
  }

  .output {
    flex: 1;
    padding: 1.25rem;
    overflow-y: auto;
    background: var(--bg-subtle);
    font-size: 0.875rem;
    line-height: 1.7;
  }

  .output :global(h1) {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    letter-spacing: -0.02em;
  }

  .output :global(h2) {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 1.25rem 0 0.5rem;
  }

  .output :global(h3) {
    font-size: 1rem;
    font-weight: 600;
    margin: 1rem 0 0.375rem;
  }

  .output :global(p) {
    margin-bottom: 0.75rem;
    color: var(--text-muted);
  }

  .output :global(ul),
  .output :global(ol) {
    margin-bottom: 0.75rem;
    padding-left: 1.25rem;
    color: var(--text-muted);
  }

  .output :global(li) {
    margin-bottom: 0.25rem;
  }

  .output :global(code) {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    background: rgba(255, 255, 255, 0.06);
    padding: 0.1em 0.3em;
    border-radius: 3px;
    color: var(--text);
  }

  .output :global(pre) {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 0.875rem;
    margin-bottom: 0.75rem;
    overflow-x: auto;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    line-height: 1.7;
  }

  .output :global(pre code) {
    background: none;
    padding: 0;
    color: var(--text-muted);
  }

  .output :global(blockquote) {
    border-left: 2px solid var(--border-hover);
    padding-left: 0.875rem;
    margin: 0.75rem 0;
    color: var(--text-dim);
    font-style: italic;
  }

  .output :global(hr) {
    border: none;
    border-top: 1px solid var(--border);
    margin: 1.25rem 0;
  }

  .output :global(strong) {
    color: var(--text);
    font-weight: 600;
  }

  .output :global(em) {
    color: var(--text-dim);
  }

  @media (max-width: 640px) {
    .panes {
      grid-template-columns: 1fr;
      grid-template-rows: 1fr 1px 1fr;
      height: 600px;
    }

    .divider {
      height: 1px;
    }

    .input {
      min-height: 200px;
    }

    .output {
      min-height: 250px;
    }
  }
</style>
