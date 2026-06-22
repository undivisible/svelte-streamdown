<script lang="ts">
  import {
    renderSingleBlock,
    type StreamdownOptions,
    type RenderedBlock,
  } from "./markdown";
  import { parseMarkdownIntoBlocks } from "./parse-blocks";
  import remendPkg from "remend";
  import HastNode from "./HastNode.svelte";

  let {
    markdown = "",
    mode = "streaming",
    dir = "auto",
    allowedElements,
    disallowedElements,
    allowElement,
    rehypePlugins,
    remarkPlugins,
    remarkRehypeOptions,
    skipHtml,
    unwrapDisallowed,
    urlTransform,
    parseIncompleteMarkdown = true,
    normalizeHtmlIndentation = false,
    remend: remendOpts,
    animated = false,
    caret = false,
    class: className = ""
  }: StreamdownOptions & {
    markdown?: string;
    animated?: boolean;
    caret?: boolean | string;
    class?: string;
  } = $props();

  let options = $derived({
    mode,
    dir,
    allowedElements,
    disallowedElements,
    allowElement,
    rehypePlugins,
    remarkPlugins,
    remarkRehypeOptions,
    skipHtml,
    unwrapDisallowed,
    urlTransform,
    parseIncompleteMarkdown,
    normalizeHtmlIndentation,
    remend: remendOpts,
  });

  let blocks: RenderedBlock[] = $state([]);
  let blockCache: Map<string, RenderedBlock> = new Map();
  let inflight: Map<number, Promise<void>> = new Map();

  $effect(() => {
    const currentMarkdown = markdown;
    const currentOptions = options;

    const shouldRepair =
      currentOptions.mode !== "static" &&
      currentOptions.parseIncompleteMarkdown !== false;
    const repaired = shouldRepair
      ? remendPkg(currentMarkdown, currentOptions.remend)
      : currentMarkdown;
    const blockStrings =
      currentOptions.mode === "static"
        ? [repaired]
        : parseMarkdownIntoBlocks(repaired);

    // Snapshot: which blocks are new/changed
    const newBlocks: Array<RenderedBlock | null> = blockStrings.map(
      (s) => blockCache.get(s) ?? null,
    );
    const uncached = blockStrings
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => !blockCache.has(s));

    // Update synchronously with cached data (placeholder for uncached)
    blocks = newBlocks.map((b, i) =>
      b ?? {
        key: `${i}:pending`,
        markdown: blockStrings[i],
        html: "",
        tree: { type: "root", children: [] },
        dir: (currentOptions.dir === "rtl" ? "rtl" : "ltr") as "ltr" | "rtl",
      },
    );

    // Cancel in-flight renders from previous effect
    for (const [idx, p] of inflight) {
      // These will just overwrite stale data — Svelte keyed each handles it
    }
    inflight.clear();

    // Render uncached blocks individually
    for (const { s, i } of uncached) {
      const promise = renderSingleBlock(s, i, currentOptions).then(
        (rendered) => {
          blockCache.set(s, rendered);
          // Update the specific block in the array
          blocks[i] = rendered;
        },
      );
      inflight.set(i, promise);
    }
  });
</script>

<div class={`svelte-streamdown ${className}`} data-streamdown-root>
  {#each blocks as block (block.key)}
    <div
      data-streamdown-block
      data-sd-animate={animated ? "" : undefined}
      dir={block.dir}
    >
      <HastNode node={block.tree} />
    </div>
  {/each}
  {#if caret}
    <span class="svelte-streamdown__caret" aria-hidden="true"
      >{typeof caret === "string" ? caret : "▋"}</span
    >
  {/if}
</div>
