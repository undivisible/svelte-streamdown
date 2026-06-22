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

/**
 * Build an inline style string from token.htmlStyle.
 * Redirects shiki's direct CSS properties to CSS custom properties
 * so our stylesheet can switch themes via media queries / .dark class.
 *
 * Light color → --shiki-light (used by CSS default)
 * Dark color  → --shiki-dark  (used by CSS dark mode)
 */
const tokenToStyle = (token: any): string | undefined => {
  if (!token.htmlStyle) return undefined;

  const parts: string[] = [];
  for (const [key, value] of Object.entries(token.htmlStyle)) {
    if (key === "color") {
      // Redirect direct color to CSS var — our CSS sets `color: var(--shiki-light)`
      parts.push(`--shiki-light:${value}`);
    } else if (key === "background-color") {
      parts.push(`--shiki-light-bg:${value}`);
    } else {
      // Pass through CSS custom properties like --shiki-dark
      parts.push(`${key}:${value}`);
    }
  }
  return parts.length > 0 ? parts.join(";") : undefined;
};

export const rehypeShiki = (options: RehypeShikiOptions = {}) => {
  const themes = options.themes ?? ["github-light", "github-dark"];

  return async (tree: any) => {
    let h;
    try {
      h = await ensureHighlighter();
    } catch {
      return;
    }

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

        // Set CSS custom properties on <pre> for theme switching.
        // Users override via .svelte-streamdown pre or @media queries.
        const preStyleParts: string[] = [];
        if (result.bg) preStyleParts.push(`--shiki-light-bg:${result.bg}`);
        if (result.fg) preStyleParts.push(`--shiki-light-fg:${result.fg}`);
        // result.rootStyle contains --shiki-dark-bg from the dark theme
        if (result.rootStyle) {
          for (const decl of result.rootStyle.split(";")) {
            const idx = decl.indexOf(":");
            if (idx > 0) {
              const prop = decl.slice(0, idx).trim();
              const val = decl.slice(idx + 1).trim();
              if (prop && val) preStyleParts.push(`${prop}:${val}`);
            }
          }
        }

        if (preStyleParts.length > 0) {
          if (!pre.properties) pre.properties = {};
          pre.properties.style = preStyleParts.join(";");
        }

        // Highlight tokens
        code.children = result.tokens.map((line: any) => ({
          type: "element",
          tagName: "span",
          properties: { className: ["line"] },
          children: line.map((token: any) => ({
            type: "element",
            tagName: "span",
            properties: {
              style: tokenToStyle(token),
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
