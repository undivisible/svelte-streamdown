<script lang="ts">
  import type { Element, Nodes, Root } from "hast";
  import HastNode from "./HastNode.svelte";

  let { node }: { node: Nodes | Root } = $props();

  const VOID_ELEMENTS = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
  ]);

  const normalizePropertyName = (name: string): string => {
    if (name === "className") {
      return "class";
    }
    if (name === "htmlFor") {
      return "for";
    }
    return name;
  };

  const normalizePropertyValue = (
    value: Element["properties"][string],
  ): string | number | boolean | undefined => {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return value;
    }
    if (Array.isArray(value)) {
      return value.join(" ");
    }
    return undefined;
  };

  const attributesFor = (element: Element) => {
    const attributes: Record<string, string | number | boolean> = {};
    for (const [name, value] of Object.entries(element.properties ?? {})) {
      const normalized = normalizePropertyValue(value);
      if (normalized !== undefined) {
        attributes[normalizePropertyName(name)] = normalized;
      }
    }
    return attributes;
  };
</script>

{#if node.type === "root"}
  {#each node.children as child, index (`root-${index}`)}
    <HastNode node={child} />
  {/each}
{:else if node.type === "text"}
  {node.value}
{:else if node.type === "element"}
  {#if VOID_ELEMENTS.has(node.tagName)}
    <svelte:element this={node.tagName} {...attributesFor(node)} />
  {:else}
    <svelte:element this={node.tagName} {...attributesFor(node)}>
      {#each node.children as child, index (`${node.tagName}-${index}`)}
        <HastNode node={child} />
      {/each}
    </svelte:element>
  {/if}
{/if}
