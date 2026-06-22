<script lang="ts">
  import type { Element } from "hast";

  let {
    node,
  }: {
    node: Element;
  } = $props();

  const chart = $derived((node.properties?.dataCode as string) ?? "");
  let container: HTMLDivElement;
  let error = $state(false);
  let rendered = $state(false);
  let lastChart = "";

  $effect(() => {
    const current = chart;
    if (!current || !container) return;
    if (current === lastChart) return;
    lastChart = current;
    error = false;
    rendered = false;

    (async () => {
      try {
        const mod: any = await import("mermaid");
        const mermaid = mod.default ?? mod;
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
        });

        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg } = await mermaid.render(id, current);
        container.innerHTML = svg;
        rendered = true;
      } catch {
        error = true;
      }
    })();
  });
</script>

<div class="sd-mermaid">
  <!-- Container is ALWAYS rendered so bind:this works -->
  <div bind:this={container}></div>
  {#if error}
    <pre class="sd-mermaid-error">{chart}</pre>
  {:else if !rendered}
    <pre class="sd-mermaid-loading">{chart}</pre>
  {/if}
</div>
