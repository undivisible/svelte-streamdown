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
    if (!current || !container || current === lastChart) return;
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
  {#if error}
    <pre class="sd-mermaid-error">{chart}</pre>
  {:else if !rendered}
    <pre class="sd-mermaid-loading">{chart}</pre>
  {:else}
    <div bind:this={container}></div>
  {/if}
</div>
