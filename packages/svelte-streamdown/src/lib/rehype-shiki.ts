import { createHighlighter, type BundledLanguage } from "shiki";
import { visit } from "unist-util-visit";

let highlighterPromise: ReturnType<typeof createHighlighter> | null = null;

const getHighlighter = (themes: string[]) => {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes,
      langs: Object.keys(
        import("shiki/langs")
          .then((m) => m.default)
          .catch(() => ({}))
      ) as BundledLanguage[],
    });
  }
  return highlighterPromise;
};

interface RehypeShikiOptions {
  themes?: [string, string];
}

export const rehypeShiki = (options: RehypeShikiOptions = {}) => {
  const themes = options.themes ?? ["github-light", "github-dark"];

  return async (tree: any) => {
    const highlighter = await getHighlighter(themes);

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
        const loadedLangs = highlighter.getLoadedLanguages();
        const validLang = loadedLangs.includes(lang as BundledLanguage)
          ? lang
          : "text";

        const result = highlighter.codeToTokens(codeText, {
          lang: validLang as BundledLanguage,
          themes: { light: themes[0], dark: themes[1] },
        });

        // Replace code content with highlighted tokens
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

        // Add shiki class to pre for theming
        if (!code.properties) code.properties = {};
        code.properties.className = [
          ...(code.properties.className ?? []),
          `shiki`,
          `shiki-themes-${themes[0]}-${themes[1]}`,
        ];
      } catch {
        // Leave as plain text on error
      }
    });
  };
};
