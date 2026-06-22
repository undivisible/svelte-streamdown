import { type BundledLanguage } from "shiki";
import { visit } from "unist-util-visit";

interface RehypeShikiOptions {
  themes?: [string, string];
}

// Singleton highlighter — created once, shared across all calls.
let highlighterReady: Promise<any> | null = null;

const ensureHighlighter = (): Promise<any> => {
  if (!highlighterReady) {
    highlighterReady = import("shiki").then((shiki) =>
      shiki.createHighlighter({
        themes: ["github-light", "github-dark"],
        langs: [],
      }),
    );
  }
  return highlighterReady;
};

const htmlStyleToCSS = (htmlStyle: Record<string, string>): string =>
  Object.entries(htmlStyle)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");

export const rehypeShiki = (options: RehypeShikiOptions = {}) => {
  const themes = options.themes ?? ["github-light", "github-dark"];

  return async (tree: any) => {
    let h;
    try {
      h = await ensureHighlighter();
    } catch {
      return;
    }

    // Collect pre > code pairs
    const codeNodes: Array<{ pre: any; code: any; lang: string }> = [];
    visit(tree, "element", (node: any) => {
      if (node.tagName !== "pre") return;
      const code = node.children?.find((c: any) => c.tagName === "code");
      if (!code) return;
      const langClass = code.properties?.className?.find((c: string) =>
        c.startsWith("language-"),
      );
      const lang = (langClass?.replace("language-", "") ?? "") as string;
      codeNodes.push({ pre: node, code, lang });
    });

    // Load languages on demand, skip invalid ones
    for (const { lang } of codeNodes) {
      if (!lang || lang === "text") continue;
      const loaded = h.getLoadedLanguages();
      if (loaded.includes(lang)) continue;
      try {
        await h.loadLanguage(lang as BundledLanguage);
      } catch {
        // Partial streaming token — skip
      }
    }

    for (const { pre, code, lang } of codeNodes) {
      const textNode = code.children?.find((c: any) => c.type === "text");
      if (!textNode) continue;

      const codeText = textNode.value as string;
      const validLang = h.getLoadedLanguages().includes(lang as BundledLanguage)
        ? lang
        : "text";

      try {
        const result = h.codeToTokens(codeText, {
          lang: validLang as BundledLanguage,
          themes: { light: themes[0], dark: themes[1] },
        });

        // Set background color on <pre> so code blocks get shiki's bg
        // even when the page has a dark background
        if (result.bg) {
          if (!pre.properties) pre.properties = {};
          pre.properties.style = `background-color:${result.bg}`;
        }

        // Highlight tokens with dual-theme CSS vars
        code.children = result.tokens.map((line: any) => ({
          type: "element",
          tagName: "span",
          properties: { className: ["line"] },
          children: line.map((token: any) => ({
            type: "element",
            tagName: "span",
            properties: {
              style: token.htmlStyle
                ? htmlStyleToCSS(token.htmlStyle)
                : undefined,
            },
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
    }
  };
};
