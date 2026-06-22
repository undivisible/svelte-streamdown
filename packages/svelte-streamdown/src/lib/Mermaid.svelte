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

  // Debounce: only render after chart stops changing for 300ms
  let timer: ReturnType<typeof setTimeout> | null = null;

  $effect(() => {
    const current = chart;
    if (!current || !container) return;
    if (current === lastChart) return;

    // Reset on new content
    error = false;
    rendered = false;

    // Debounce during streaming
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      if (current !== chart) return; // stale
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
        if (container) {
          container.innerHTML = svg;
          rendered = true;
        }
      } catch {
        error = true;
      }
    }, 300);

    return () => {
      if (timer) clearTimeout(timer);
    };
  });
</script>

<div class="sd-mermaid">
  <div bind:this={container}></div>
  {#if error}
    <pre class="sd-mermaid-error">{chart}</pre>
  {:else if !rendered}
    <pre class="sd-mermaid-loading">{chart}</pre>
  {/if}
</div>
