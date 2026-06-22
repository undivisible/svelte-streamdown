<script lang="ts">
  import type { Element } from "hast";

  let {
    node,
  }: {
    node: Element;
  } = $props();

  const chart = $derived((node.properties?.dataCode as string) ?? "");
  let container: HTMLDivElement;
  let svgContent = $state("");
  let lastValidSvg = $state("");
  let error = $state(false);
  let lastChart = "";
  let timer: ReturnType<typeof setTimeout> | null = null;

  // Always render the last valid SVG (prevents jumpy disappear/reappear)
  const displaySvg = $derived(svgContent || lastValidSvg);

  $effect(() => {
    const current = chart;
    if (!current || !container) return;
    if (current === lastChart) return;

    // Debounce: wait for streaming to pause
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      if (current !== chart) return; // stale check
      lastChart = current;

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
        svgContent = svg;
        lastValidSvg = svg;
        error = false;
      } catch {
        // Silent fail — keep lastValidSvg visible
        if (!lastValidSvg) {
          error = true;
        }
      }
    }, 400);

    return () => {
      if (timer) clearTimeout(timer);
    };
  });
</script>

<div class="sd-mermaid">
  <div bind:this={container}></div>
  {#if displaySvg}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <div class="sd-mermaid-svg">{@html displaySvg}</div>
  {:else if error}
    <pre class="sd-mermaid-error">{chart}</pre>
  {:else}
    <pre class="sd-mermaid-loading">{chart}</pre>
  {/if}
</div>
