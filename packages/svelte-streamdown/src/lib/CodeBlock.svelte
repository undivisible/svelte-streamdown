<script lang="ts">
  import type { Element } from "hast";

  let {
    node,
    children,
  }: {
    node: Element;
    children: any;
  } = $props();

  const lang = $derived((node.properties?.dataLang as string) ?? "");
  const code = $derived((node.properties?.dataCode as string) ?? "");

  let copied = $state(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      // clipboard API may fail in some contexts
    }
  }
</script>

<div class="sd-code-block">
  <div class="sd-code-header">
    {#if lang}
      <span class="sd-code-lang">{lang}</span>
    {/if}
    <button
      class="sd-code-copy"
      onclick={copyCode}
      type="button"
      aria-label="Copy code"
    >
      {#if copied}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg
        >
        Copied
      {:else}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
        </svg>
        Copy
      {/if}
    </button>
  </div>
  {@render children()}
</div>
