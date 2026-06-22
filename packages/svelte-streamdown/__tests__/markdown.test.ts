import { describe, expect, it } from "vitest";
import {
  normalizeHtmlIndentation,
  renderMarkdownToHtml,
  renderStreamdownBlocks,
} from "../src/lib/markdown";
import { parseMarkdownIntoBlocks } from "../src/lib/parse-blocks";

describe("renderMarkdownToHtml", () => {
  it("renders markdown to sanitized html", async () => {
    const html = await renderMarkdownToHtml(
      "# Hello\n\n<script>alert('x')</script>\n\n[tel](tel:+15555555555)",
    );

    expect(html).toContain("<h1>Hello</h1>");
    expect(html).not.toContain("<script>");
    expect(html).toContain('href="tel:+15555555555"');
  });

  it("supports gfm tables", async () => {
    const html = await renderMarkdownToHtml("| A | B |\n| - | - |\n| 1 | 2 |");

    expect(html).toContain("<table>");
    expect(html).toContain("<td>1</td>");
  });

  it("filters elements", async () => {
    const html = await renderMarkdownToHtml("# Hello\n\nWorld", {
      allowedElements: ["p"],
      unwrapDisallowed: true,
    });

    expect(html).not.toContain("<h1>");
    expect(html).toContain("Hello");
    expect(html).toContain("<p>World</p>");
  });
});

describe("renderStreamdownBlocks", () => {
  it("repairs incomplete streaming markdown", async () => {
    const blocks = await renderStreamdownBlocks("**Hello");

    expect(blocks[0].html).toContain("<strong>Hello</strong>");
  });

  it("keeps static output as one block", async () => {
    const blocks = await renderStreamdownBlocks("# One\n\n# Two", {
      mode: "static",
    });

    expect(blocks).toHaveLength(1);
    expect(blocks[0].html).toContain("<h1>One</h1>");
    expect(blocks[0].html).toContain("<h1>Two</h1>");
  });
});

describe("parseMarkdownIntoBlocks", () => {
  it("splits independent markdown blocks", () => {
    expect(parseMarkdownIntoBlocks("# One\n\nTwo")).toEqual([
      "# One\n\n",
      "Two",
    ]);
  });
});

describe("normalizeHtmlIndentation", () => {
  it("normalizes indented html tags", () => {
    expect(normalizeHtmlIndentation("<div>\n    <p>Hi</p>\n</div>")).toBe(
      "<div>\n<p>Hi</p>\n</div>",
    );
  });
});
