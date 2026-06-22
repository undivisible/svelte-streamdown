<script lang="ts">
  import {
    renderStreamdownBlocks,
    type StreamdownOptions,
    type RenderedBlock
  } from "./markdown";
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
    remend,
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
    remend
  });

  let blocks: RenderedBlock[] = $state([]);

  $effect(() => {
    const currentMarkdown = markdown;
    const currentOptions = options;
    renderStreamdownBlocks(currentMarkdown, currentOptions).then((result) => {
      blocks = result;
    });
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
