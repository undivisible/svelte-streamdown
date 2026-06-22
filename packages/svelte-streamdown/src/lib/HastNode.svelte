<script lang="ts">
  import type { Element, Nodes, Root } from "hast";
  import HastNode from "./HastNode.svelte";
  import CodeBlock from "./CodeBlock.svelte";
  import Mermaid from "./Mermaid.svelte";

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

  const hasClassName = (el: Element, cls: string): boolean => {
    const cn = el.properties?.className;
    if (Array.isArray(cn)) return cn.includes(cls);
    if (typeof cn === "string") return cn.split(" ").includes(cls);
    return false;
  };

  const attributesFor = (element: Element) => {
    const attributes: Record<string, string | number | boolean> = {};
    for (const [name, value] of Object.entries(element.properties ?? {})) {
      // Skip internal data-* attrs used by CodeBlock wrapper
      if (name === "dataLang" || name === "dataCode") continue;
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
  {#if node.tagName === "div" && hasClassName(node, "sd-mermaid-block")}
    <Mermaid {node} />
  {:else if node.tagName === "div" && hasClassName(node, "sd-code-block")}
    <CodeBlock {node}>
      {#each node.children as child, index (`code-${index}`)}
        <HastNode node={child} />
      {/each}
    </CodeBlock>
  {:else if VOID_ELEMENTS.has(node.tagName)}
    <svelte:element this={node.tagName} {...attributesFor(node)} />
  {:else}
    <svelte:element this={node.tagName} {...attributesFor(node)}>
      {#each node.children as child, index (`${node.tagName}-${index}`)}
        <HastNode node={child} />
      {/each}
    </svelte:element>
  {/if}
{/if}
