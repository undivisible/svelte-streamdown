import { type BundledLanguage } from "shiki";
import { visit } from "unist-util-visit";

interface RehypeShikiOptions {
  themes?: [string, string];
}

let highlighterPromise: ReturnType<
  typeof import("shiki").createHighlighter
> | null = null;

const getHighlighter = async () => {
  if (!highlighterPromise) {
    const shiki = await import("shiki");
    highlighterPromise = shiki.createHighlighter({
      themes: ["github-light", "github-dark"],
      langs: [],
    });
  }
  return highlighterPromise;
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
      h = await getHighlighter();
    } catch {
      return;
    }

    const codeNodes: Array<{ code: any; lang: string }> = [];
    visit(tree, "element", (node: any) => {
      if (node.tagName !== "pre") return;
      const code = node.children?.find((c: any) => c.tagName === "code");
      if (!code) return;
      const langClass = code.properties?.className?.find((c: string) =>
        c.startsWith("language-"),
      );
      const lang = (langClass?.replace("language-", "") ?? "") as string;
      codeNodes.push({ code, lang });
    });

    const loaded = h.getLoadedLanguages();
    const needed = [
      ...new Set(
        codeNodes
          .map((n) => n.lang)
          .filter((l) => l && l !== "text" && !loaded.includes(l)),
      ),
    ];
    if (needed.length > 0) {
      await Promise.all(
        needed.map((l) => h!.loadLanguage(l as BundledLanguage)),
      );
    }

    for (const { code, lang } of codeNodes) {
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

        // shiki v4: token.htmlStyle contains color + --shiki-dark CSS vars
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
