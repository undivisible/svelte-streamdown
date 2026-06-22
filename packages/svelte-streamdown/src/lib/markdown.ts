import type { Element, Nodes, Parents, Root } from "hast";
import { toHtml } from "hast-util-to-html";
import { urlAttributes } from "html-url-attributes";
import { harden } from "rehype-harden";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import type { Options as RemarkRehypeOptions } from "remark-rehype";
import remarkRehype from "remark-rehype";
import remend, { type RemendOptions } from "remend";
import type { PluggableList } from "unified";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { parseMarkdownIntoBlocks } from "./parse-blocks";

export type AllowElement = (
  element: Readonly<Element>,
  index: number,
  parent: Readonly<Parents> | undefined,
) => boolean | null | undefined;

export type UrlTransform = (
  url: string,
  key: string,
  node: Readonly<Element>,
) => string | null | undefined;

export interface StreamdownOptions {
  mode?: "static" | "streaming";
  dir?: "auto" | "ltr" | "rtl";
  allowedElements?: readonly string[];
  disallowedElements?: readonly string[];
  allowElement?: AllowElement;
  rehypePlugins?: PluggableList;
  remarkPlugins?: PluggableList;
  remarkRehypeOptions?: Readonly<RemarkRehypeOptions>;
  skipHtml?: boolean;
  unwrapDisallowed?: boolean;
  urlTransform?: UrlTransform;
  parseIncompleteMarkdown?: boolean;
  normalizeHtmlIndentation?: boolean;
  remend?: RemendOptions;
}

export interface RenderedBlock {
  key: string;
  markdown: string;
  html: string;
  tree: Root;
  dir: "ltr" | "rtl";
}

const EMPTY_PLUGINS: PluggableList = [];
const DEFAULT_REMARK_REHYPE_OPTIONS = { allowDangerousHtml: true };
const HTML_BLOCK_START_PATTERN = /^[ \t]*<[\w!/?-]/;
const HTML_LINE_INDENT_PATTERN = /(^|\n)[ \t]{4,}(?=<[\w!/?-])/g;

const defaultSanitizeSchema = {
  ...defaultSchema,
  protocols: {
    ...defaultSchema.protocols,
    href: [...(defaultSchema.protocols?.href ?? []), "tel"],
  },
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), "metastring"],
    // Allow KaTeX attributes
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "className"],
  },
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    // KaTeX elements
    "math", "semantics", "mrow", "mi", "mo", "mn", "msup", "msub",
    "mfrac", "msqrt", "mroot", "mtext", "mpadded", "menclose",
    "mtable", "mtr", "mtd", "mlabeledtr", "munder", "mover",
    "munderover", "mspace", "none", "mglyph",
    // KaTeX spans
    "span",
  ],
};

export const defaultUrlTransform: UrlTransform = (value) => value;

export const normalizeHtmlIndentation = (content: string): string => {
  if (typeof content !== "string" || content.length === 0) {
    return content;
  }
  if (!HTML_BLOCK_START_PATTERN.test(content)) {
    return content;
  }
  return content.replace(HTML_LINE_INDENT_PATTERN, "$1");
};

const handleRawNode = (
  parent: Parents,
  index: number,
  skipHtml: boolean | undefined,
  value: string,
): void => {
  if (skipHtml) {
    parent.children.splice(index, 1);
  } else {
    parent.children[index] = { type: "text", value } as never;
  }
};

const transformUrls = (node: Element, transform: UrlTransform): void => {
  for (const key in urlAttributes) {
    if (
      Object.hasOwn(urlAttributes, key) &&
      Object.hasOwn(node.properties, key)
    ) {
      const value = node.properties[key];
      const test = urlAttributes[key];
      if (test === null || test.includes(node.tagName)) {
        node.properties[key] =
          transform(String(value || ""), key, node) ?? undefined;
      }
    }
  }
};

const shouldRemoveElement = (
  node: Readonly<Element>,
  index: number | undefined,
  parent: Readonly<Parents> | undefined,
  allowedElements: readonly string[] | undefined,
  disallowedElements: readonly string[] | undefined,
  allowElement: AllowElement | undefined,
): boolean => {
  let remove = false;

  if (allowedElements) {
    remove = !allowedElements.includes(node.tagName);
  } else if (disallowedElements) {
    remove = disallowedElements.includes(node.tagName);
  }

  if (!remove && allowElement && typeof index === "number") {
    remove = !allowElement(node, index, parent);
  }

  return remove;
};

const postProcessTree = (tree: Nodes, options: StreamdownOptions): Root => {
  const {
    allowElement,
    allowedElements,
    disallowedElements,
    skipHtml,
    unwrapDisallowed,
    urlTransform,
  } = options;
  const hasFiltering =
    allowElement ||
    allowedElements ||
    disallowedElements ||
    skipHtml ||
    urlTransform;

  if (!hasFiltering) {
    return tree as Root;
  }

  const transform = urlTransform || defaultUrlTransform;

  visit(tree as Root, (node, index, parent) => {
    if (node.type === "raw" && parent && typeof index === "number") {
      handleRawNode(parent, index, skipHtml, node.value);
      return index;
    }

    if (node.type === "element") {
      transformUrls(node, transform);
      const remove = shouldRemoveElement(
        node,
        index,
        parent,
        allowedElements,
        disallowedElements,
        allowElement,
      );

      if (remove && parent && typeof index === "number") {
        if (unwrapDisallowed && node.children) {
          parent.children.splice(index, 1, ...node.children);
        } else {
          parent.children.splice(index, 1);
        }
        return index;
      }
    }
  });

  return tree as Root;
};

const createProcessor = (options: StreamdownOptions) => {
  const rehypePlugins = options.rehypePlugins || EMPTY_PLUGINS;
  const remarkPlugins = options.remarkPlugins || EMPTY_PLUGINS;
  const remarkRehypeOptions = options.remarkRehypeOptions
    ? { ...DEFAULT_REMARK_REHYPE_OPTIONS, ...options.remarkRehypeOptions }
    : DEFAULT_REMARK_REHYPE_OPTIONS;

  return unified()
    .use(remarkParse)
    .use([remarkGfm, remarkMath, ...remarkPlugins])
    .use(remarkRehype, remarkRehypeOptions)
    .use(rehypeRaw)
    .use(rehypeSanitize, defaultSanitizeSchema)
    .use(rehypeKatex)
    .use(harden, {
      allowedImagePrefixes: ["*"],
      allowedLinkPrefixes: ["*"],
      allowedProtocols: ["*"],
      defaultOrigin: undefined,
      allowDataImages: true,
    })
    .use(rehypePlugins);
};

export const renderMarkdownToHtml = (
  markdown: string,
  options: StreamdownOptions = {},
): string => {
  return toHtml(renderMarkdownToRoot(markdown, options));
};

export const renderMarkdownToRoot = (
  markdown: string,
  options: StreamdownOptions = {},
): Root => {
  const processor = createProcessor(options);
  const normalized = options.normalizeHtmlIndentation
    ? normalizeHtmlIndentation(markdown)
    : markdown;
  const tree = processor.runSync(processor.parse(normalized), normalized);
  return postProcessTree(tree as Nodes, options);
};

export const renderStreamdownBlocks = (
  markdown: string,
  options: StreamdownOptions = {},
): RenderedBlock[] => {
  const shouldRepair =
    options.mode !== "static" && options.parseIncompleteMarkdown !== false;
  const repaired = shouldRepair ? remend(markdown, options.remend) : markdown;
  const blocks =
    options.mode === "static" ? [repaired] : parseMarkdownIntoBlocks(repaired);

  return blocks.map((block, index) => {
    const tree = renderMarkdownToRoot(block, options);
    return {
      key: `${index}:${block.length}:${block.slice(0, 16)}`,
      markdown: block,
      html: toHtml(tree),
      tree,
      dir: options.dir === "rtl" ? "rtl" : "ltr",
    };
  });
};
