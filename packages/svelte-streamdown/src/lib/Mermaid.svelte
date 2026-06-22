<script lang="ts">
  import type { Element } from "hast";
  import { onMount } from "svelte";

  let {
    node,
  }: {
    node: Element;
  } = $props();

  const chart = (node.properties?.dataCode as string) ?? "";
  let container: HTMLDivElement;
  let error = $state(false);
  let rendered = $state(false);

  onMount(async () => {
    if (!chart || !container) return;

    try {
      // Dynamic import — mermaid is an optional peer dependency
      const mod: any = await import("mermaid");
      const mermaid = mod.default ?? mod;
      mermaid.initialize({
        startOnLoad: false,
        theme: "default",
        securityLevel: "loose",
      });

      const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
      const { svg } = await mermaid.render(id, chart);
      container.innerHTML = svg;
      rendered = true;
    } catch {
      error = true;
    }
  });
</script>

<div class="sd-mermaid">
  {#if error}
    <pre class="sd-mermaid-error">{chart}</pre>
  {:else if !rendered}
    <pre class="sd-mermaid-loading">{chart}</pre>
  {:else}
    <div bind:this={container}></div>
  {/if}
</div>
