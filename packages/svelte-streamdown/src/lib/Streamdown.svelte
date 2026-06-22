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

  // Per-block cache: only re-renders blocks whose markdown changed
  let blockCache: Map<string, RenderedBlock> = new Map();
  let blocks: RenderedBlock[] = $state([]);
  // Version counter to discard stale effect runs
  let version = 0;

  $effect(() => {
    const currentMarkdown = markdown;
    const currentOptions = options;
    const thisVersion = ++version;

    const shouldRepair =
      currentOptions.mode !== "static" &&
      currentOptions.parseIncompleteMarkdown !== false;
    const repaired = shouldRepair
      ? remendPkg(currentMarkdown, currentOptions.remend)
      : currentMarkdown;
    const blockStrings =
      currentOptions.mode === "static"
        ? [repaired]
        : parseMarkdownIntoBlocks(repaired)
            .filter((b) => b.trim().length > 0);

    // Render only uncached blocks
    const uncached: Array<{ index: number; blockStr: string }> = [];
    const snapshot: (RenderedBlock | null)[] = blockStrings.map((s, i) => {
      const cached = blockCache.get(s);
      if (cached) return cached;
      uncached.push({ index: i, blockStr: s });
      return null;
    });

    if (uncached.length === 0) {
      blocks = snapshot as RenderedBlock[];
      return;
    }

    // Set placeholder blocks so DOM updates immediately
    blocks = snapshot.map((b, i) =>
      b ?? {
        key: `${i}:pending`,
        markdown: blockStrings[i],
        html: "",
        tree: { type: "root", children: [] },
        dir: (currentOptions.dir === "rtl" ? "rtl" : "ltr") as "ltr" | "rtl",
      },
    );

    // Render uncached blocks
    Promise.all(
      uncached.map(({ index, blockStr }) =>
        renderSingleBlock(blockStr, index, currentOptions).then((rendered) => {
          blockCache.set(blockStr, rendered);
          return { index, rendered };
        }),
      ),
    ).then((results) => {
      // Discard if a newer effect run started
      if (thisVersion !== version) return;

      // Merge rendered results into the snapshot
      for (const { index, rendered } of results) {
        snapshot[index] = rendered;
      }
      blocks = snapshot as RenderedBlock[];
    });
  });
</script>

<div class={`svelte-streamdown ${className}`} data-streamdown-root>
  {#each blocks as block, i (i)}
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
