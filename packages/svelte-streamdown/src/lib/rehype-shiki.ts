import { createHighlighter, type BundledLanguage } from "shiki";
import { visit } from "unist-util-visit";

interface RehypeShikiOptions {
  themes?: [string, string];
}

// Pre-initialized highlighter (lazy, sync access after first await)
let highlighter: Awaited<ReturnType<typeof createHighlighter>> | null = null;
let initPromise: Promise<void> | null = null;

const ensureHighlighter = (themes: string[]) => {
  if (highlighter) return;
  if (!initPromise) {
    initPromise = createHighlighter({
      themes,
      langs: [
        "javascript", "typescript", "svelte", "html", "css", "json",
        "bash", "shell", "python", "rust", "go", "yaml", "markdown",
        "sql", "graphql", "toml", "xml", "jsx", "tsx",
      ],
    }).then((h) => {
      highlighter = h;
    });
  }
  // Throw promise to signal async (unified will handle if using run())
  throw initPromise;
};

export const rehypeShiki = (options: RehypeShikiOptions = {}) => {
  const themes = options.themes ?? ["github-light", "github-dark"];

  return (tree: any) => {
    // Try to get highlighter, if not ready yet, skip highlighting
    if (!highlighter) {
      try {
        ensureHighlighter(themes);
      } catch {
        // Promise thrown — highlighter not ready yet, skip
        return;
      }
    }

    visit(tree, "element", (node: any) => {
      if (node.tagName !== "pre") return;

      const code = node.children?.find((c: any) => c.tagName === "code");
      if (!code) return;

      const langClass = code.properties?.className?.find((c: string) =>
        c.startsWith("language-")
      );
      const lang = langClass?.replace("language-", "") ?? "";

      const textNode = code.children?.find((c: any) => c.type === "text");
      if (!textNode) return;

      const codeText = textNode.value as string;

      try {
        const loadedLangs = highlighter!.getLoadedLanguages();
        const validLang = loadedLangs.includes(lang as BundledLanguage)
          ? lang
          : "text";

        const result = highlighter!.codeToTokens(codeText, {
          lang: validLang as BundledLanguage,
          themes: { light: themes[0], dark: themes[1] },
        });

        code.children = result.tokens.map((line: any) => ({
          type: "element",
          tagName: "span",
          properties: { className: ["line"] },
          children: line.map((token: any) => ({
            type: "element",
            tagName: "span",
            properties: { style: `color:${token.color}` },
            children: [{ type: "text", value: token.content }],
          })),
        }));

        if (!code.properties) code.properties = {};
        code.properties.className = [
          ...(code.properties.className ?? []),
          "shiki",
          `shiki-themes-${themes[0]}-${themes[1]}`,
        ];
      } catch {
        // Leave as plain text on error
      }
    });
  };
};

// Call this once at app startup to pre-warm the highlighter (client-side)
export const initShiki = async (themes: string[] = ["github-light", "github-dark"]) => {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes,
      langs: [
        "javascript", "typescript", "svelte", "html", "css", "json",
        "bash", "shell", "python", "rust", "go", "yaml", "markdown",
        "sql", "graphql", "toml", "xml", "jsx", "tsx",
      ],
    });
  }
};
