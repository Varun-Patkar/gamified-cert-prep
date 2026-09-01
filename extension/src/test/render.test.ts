import * as assert from "assert";
import { readingMinutes, renderInline, renderMarkdown, sanitizeUrl } from "../markdown/render";

describe("renderMarkdown escaping", () => {
	it("neutralises raw HTML in the source", () => {
		const html = renderMarkdown('<img src=x onerror="alert(1)"> plain');
		assert.ok(!html.includes("<img"));
		assert.ok(html.includes("&lt;img"));
		assert.ok(!html.includes("onerror=\""));
	});

	it("escapes script tags inside code fences", () => {
		const html = renderMarkdown("```js\n<script>alert('x')</script>\n```");
		assert.ok(html.includes("<pre class=\"cp-pre\"><code class=\"language-js\">"));
		assert.ok(html.includes("&lt;script&gt;"));
		assert.ok(!html.includes("<script>"));
	});

	it("drops javascript: link targets but keeps the label", () => {
		const html = renderMarkdown("[click me](javascript:alert(1))");
		assert.ok(!html.includes("javascript:"));
		assert.ok(html.includes("click me"));
	});

	it("escapes attribute-breaking characters in link labels", () => {
		const html = renderInline('[a" onmouseover="x](https://example.com)');
		assert.ok(html.includes('href="https://example.com"'));
		assert.ok(!html.includes('onmouseover="x"'));
	});
});

describe("sanitizeUrl", () => {
	it("allows http, https, mailto and relative targets", () => {
		assert.strictEqual(sanitizeUrl("https://learn.microsoft.com"), "https://learn.microsoft.com");
		assert.strictEqual(sanitizeUrl("http://example.com"), "http://example.com");
		assert.strictEqual(sanitizeUrl("mailto:a@b.com"), "mailto:a@b.com");
		assert.strictEqual(sanitizeUrl("./sessions/day-01.md"), "./sessions/day-01.md");
	});

	it("rejects dangerous schemes and empties", () => {
		assert.strictEqual(sanitizeUrl("javascript:alert(1)"), undefined);
		assert.strictEqual(sanitizeUrl("data:text/html;base64,PHNjcmlwdD4="), undefined);
		assert.strictEqual(sanitizeUrl("   "), undefined);
	});
});

describe("renderMarkdown blocks", () => {
	it("renders headings", () => {
		assert.strictEqual(renderMarkdown("# Day 1"), "<h1>Day 1</h1>");
		assert.strictEqual(renderMarkdown("### Deep dive"), "<h3>Deep dive</h3>");
	});

	it("renders unordered and ordered lists", () => {
		assert.strictEqual(renderMarkdown("- one\n- two"), "<ul>\n<li>one</li>\n<li>two</li>\n</ul>");
		assert.ok(renderMarkdown("1. first\n2. second").startsWith("<ol>"));
	});

	it("nests indented list items", () => {
		const html = renderMarkdown("- outer\n  - inner");
		assert.strictEqual(html.match(/<ul>/g)?.length, 2);
		assert.strictEqual(html.match(/<\/ul>/g)?.length, 2);
	});

	it("renders task list checkboxes", () => {
		const html = renderMarkdown("- [x] done\n- [ ] todo");
		assert.ok(html.includes('cp-check cp-check--on'));
		assert.ok(html.includes("todo"));
	});

	it("renders tables with a header row", () => {
		const html = renderMarkdown("| A | B |\n| --- | --- |\n| 1 | 2 |");
		assert.ok(html.includes("<th>A</th><th>B</th>"));
		assert.ok(html.includes("<td>1</td><td>2</td>"));
	});

	it("renders blockquotes", () => {
		assert.ok(renderMarkdown("> a thought").includes("<blockquote><p>a thought</p></blockquote>"));
	});

	it("renders GitHub-style callouts as tinted cards", () => {
		const note = renderMarkdown("> [!NOTE]\n> Learn is open in the exam.");
		assert.ok(note.includes('class="cp-callout cp-callout--note"'));
		assert.ok(note.includes("Learn is open in the exam."));

		assert.ok(renderMarkdown("> [!TIP]\n> pace yourself").includes("cp-callout--tip"));
		assert.ok(renderMarkdown("> [!WARNING]\n> careful").includes("cp-callout--warning"));
	});

	it("renders horizontal rules", () => {
		assert.strictEqual(renderMarkdown("---"), "<hr />");
	});

	it("renders fenced code with a language class", () => {
		assert.ok(renderMarkdown("```python\nx = 1\n```").includes('class="language-python"'));
	});
});

describe("renderInline", () => {
	it("handles bold, italic and inline code", () => {
		assert.strictEqual(renderInline("**bold**"), "<strong>bold</strong>");
		assert.strictEqual(renderInline("_soft_"), "<em>soft</em>");
		assert.strictEqual(renderInline("use `az login`"), "use <code>az login</code>");
	});

	it("does not emphasise inside code spans", () => {
		assert.strictEqual(renderInline("`a **b** c`"), "<code>a **b** c</code>");
	});

	it("leaves snake_case alone", () => {
		assert.strictEqual(renderInline("some_var_name"), "some_var_name");
	});

	it("renders links", () => {
		assert.strictEqual(
			renderInline("[docs](https://learn.microsoft.com)"),
			'<a href="https://learn.microsoft.com">docs</a>'
		);
	});
});

describe("readingMinutes", () => {
	it("never returns less than a minute", () => {
		assert.strictEqual(readingMinutes(""), 1);
		assert.strictEqual(readingMinutes("a few words"), 1);
	});

	it("scales with word count", () => {
		assert.strictEqual(readingMinutes(new Array(660).fill("word").join(" ")), 3);
	});
});
