/**
 * A deliberately small markdown renderer for session notes.
 *
 * Security posture: the source is escaped *first*, and only tags this module emits ever reach
 * the webview. No raw HTML from the document is passed through, and link targets are scheme-checked.
 */

const CALLOUT_KINDS = ["note", "tip", "warning", "important", "caution"] as const;
export type CalloutKind = (typeof CALLOUT_KINDS)[number];

const LIST_ITEM = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const FENCE = /^\s*(```+|~~~+)\s*([A-Za-z0-9_+#.-]*)\s*$/;
const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const RULE = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/;
const CALLOUT = /^\[!([A-Za-z]+)\]\s*(.*)$/;

export function escapeHtml(value: string): string {
	return String(value ?? "").replace(/[&<>"']/g, (char) => {
		switch (char) {
			case "&":
				return "&amp;";
			case "<":
				return "&lt;";
			case ">":
				return "&gt;";
			case '"':
				return "&quot;";
			default:
				return "&#39;";
		}
	});
}

/** Allows http(s), mailto and document-relative targets; everything else (javascript:, data:) is dropped. */
export function sanitizeUrl(raw: string): string | undefined {
	const url = String(raw ?? "").trim();
	if (url.length === 0) {
		return undefined;
	}
	const scheme = /^([A-Za-z][A-Za-z0-9+.-]*):/.exec(url);
	if (!scheme) {
		return url;
	}
	const protocol = scheme[1].toLowerCase();
	return protocol === "http" || protocol === "https" || protocol === "mailto" ? url : undefined;
}

export function renderMarkdown(source: string): string {
	const lines = String(source ?? "")
		.replace(/\r\n?/g, "\n")
		.split("\n");
	return renderLines(lines).join("\n");
}

function renderLines(lines: string[]): string[] {
	const out: string[] = [];
	let index = 0;

	while (index < lines.length) {
		const line = lines[index];

		if (line.trim().length === 0) {
			index += 1;
			continue;
		}

		const fence = FENCE.exec(line);
		if (fence) {
			index = emitCode(lines, index, fence[1][0], fence[2], out);
			continue;
		}

		const heading = HEADING.exec(line);
		if (heading) {
			const level = heading[1].length;
			out.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
			index += 1;
			continue;
		}

		if (RULE.test(line)) {
			out.push("<hr />");
			index += 1;
			continue;
		}

		if (/^\s*>/.test(line)) {
			index = emitQuote(lines, index, out);
			continue;
		}

		if (isTableAt(lines, index)) {
			index = emitTable(lines, index, out);
			continue;
		}

		if (LIST_ITEM.test(line)) {
			index = emitList(lines, index, out);
			continue;
		}

		index = emitParagraph(lines, index, out);
	}

	return out;
}

function emitCode(lines: string[], start: number, marker: string, language: string, out: string[]): number {
	const closing = new RegExp(`^\\s*${marker === "`" ? "```+" : "~~~+"}\\s*$`);
	const body: string[] = [];
	let index = start + 1;
	while (index < lines.length && !closing.test(lines[index])) {
		body.push(lines[index]);
		index += 1;
	}
	const cls = language ? ` class="language-${escapeHtml(language.toLowerCase())}"` : "";
	out.push(`<pre class="cp-pre"><code${cls}>${escapeHtml(body.join("\n"))}</code></pre>`);
	return index < lines.length ? index + 1 : index;
}

function emitQuote(lines: string[], start: number, out: string[]): number {
	const body: string[] = [];
	let index = start;
	while (index < lines.length && /^\s*>/.test(lines[index])) {
		body.push(lines[index].replace(/^\s*>\s?/, ""));
		index += 1;
	}

	const callout = CALLOUT.exec(body[0] ?? "");
	const kind = callout ? (callout[1].toLowerCase() as CalloutKind) : undefined;
	if (kind && (CALLOUT_KINDS as readonly string[]).includes(kind)) {
		const rest = [callout ? callout[2] : "", ...body.slice(1)];
		out.push(
			`<div class="cp-callout cp-callout--${kind}"><p class="cp-callout-label">${labelFor(kind)}</p>` +
				`${renderLines(rest).join("\n")}</div>`
		);
		return index;
	}

	out.push(`<blockquote>${renderLines(body).join("\n")}</blockquote>`);
	return index;
}

function labelFor(kind: CalloutKind): string {
	const glyphs: Record<CalloutKind, string> = {
		note: "◆ Note",
		tip: "✦ Tip",
		warning: "▲ Warning",
		important: "❖ Important",
		caution: "▲ Caution",
	};
	return glyphs[kind];
}

function isTableAt(lines: string[], index: number): boolean {
	const header = lines[index] ?? "";
	const divider = lines[index + 1] ?? "";
	if (!header.trim().startsWith("|")) {
		return false;
	}
	return /^\s*\|?[\s:|-]*-[\s:|-]*\|[\s:|-]*$/.test(divider) && divider.includes("-");
}

function splitRow(line: string): string[] {
	const trimmed = line.trim().replace(/^\|/, "").replace(/\|\s*$/, "");
	return trimmed.split("|").map((cell) => cell.trim());
}

function emitTable(lines: string[], start: number, out: string[]): number {
	const header = splitRow(lines[start]);
	let index = start + 2;
	const rows: string[][] = [];
	while (index < lines.length && lines[index].trim().startsWith("|")) {
		rows.push(splitRow(lines[index]));
		index += 1;
	}

	const head = header.map((cell) => `<th>${renderInline(cell)}</th>`).join("");
	const body = rows
		.map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join("")}</tr>`)
		.join("");
	out.push(`<div class="cp-table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`);
	return index;
}

interface OpenList {
	indent: number;
	ordered: boolean;
}

function emitList(lines: string[], start: number, out: string[]): number {
	const stack: OpenList[] = [];
	let index = start;

	while (index < lines.length) {
		const match = LIST_ITEM.exec(lines[index]);
		if (!match) {
			if (lines[index].trim().length === 0 && LIST_ITEM.test(lines[index + 1] ?? "")) {
				index += 1;
				continue;
			}
			break;
		}

		const indent = match[1].replace(/\t/g, "  ").length;
		const ordered = /\d/.test(match[2]);

		while (stack.length > 0 && indent < stack[stack.length - 1].indent) {
			out.push(stack.pop()?.ordered ? "</ol>" : "</ul>");
		}
		if (stack.length === 0 || indent > stack[stack.length - 1].indent) {
			stack.push({ indent, ordered });
			out.push(ordered ? "<ol>" : "<ul>");
		}

		out.push(`<li>${renderItemBody(match[3])}</li>`);
		index += 1;
	}

	while (stack.length > 0) {
		out.push(stack.pop()?.ordered ? "</ol>" : "</ul>");
	}
	return index;
}

/** `- [x] done` reads as a checklist in the source, so it should read as one on screen too. */
function renderItemBody(text: string): string {
	const task = /^\[([ xX])\]\s*(.*)$/.exec(text);
	if (!task) {
		return renderInline(text);
	}
	const done = task[1].toLowerCase() === "x";
	return `<span class="cp-check${done ? " cp-check--on" : ""}">${done ? "✓" : ""}</span>${renderInline(task[2])}`;
}

function emitParagraph(lines: string[], start: number, out: string[]): number {
	const body: string[] = [];
	let index = start;
	while (index < lines.length) {
		const line = lines[index];
		if (
			line.trim().length === 0 ||
			FENCE.test(line) ||
			HEADING.test(line) ||
			RULE.test(line) ||
			/^\s*>/.test(line) ||
			LIST_ITEM.test(line) ||
			isTableAt(lines, index)
		) {
			break;
		}
		body.push(line.trim());
		index += 1;
	}
	if (body.length > 0) {
		out.push(`<p>${body.map(renderInline).join("<br />")}</p>`);
	}
	return index === start ? start + 1 : index;
}

/** Escapes first, then layers on only the inline tags we generate. Code spans opt out of emphasis. */
export function renderInline(text: string): string {
	const escaped = escapeHtml(text);
	const out: string[] = [];
	const code = /`([^`]+)`/g;
	let last = 0;
	let match: RegExpExecArray | null;

	while ((match = code.exec(escaped)) !== null) {
		out.push(emphasize(escaped.slice(last, match.index)));
		out.push(`<code>${match[1]}</code>`);
		last = code.lastIndex;
	}
	out.push(emphasize(escaped.slice(last)));
	return out.join("");
}

function emphasize(text: string): string {
	return text
		.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_all, alt: string, src: string) => {
			const url = sanitizeUrl(src);
			return url ? `<img src="${url}" alt="${alt}" />` : alt;
		})
		.replace(/\[([^\]]*)\]\(([^)\s]+)\)/g, (_all, label: string, href: string) => {
			const url = sanitizeUrl(href);
			return url ? `<a href="${url}">${label}</a>` : label;
		})
		.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
		.replace(/__([^_]+)__/g, "<strong>$1</strong>")
		.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, "$1<em>$2</em>")
		.replace(/(^|[^_\w])_([^_\n]+)_(?!\w)/g, "$1<em>$2</em>")
		.replace(/~~([^~]+)~~/g, "<del>$1</del>");
}

/** Rough reading time used by the session header. */
export function readingMinutes(source: string): number {
	const words = String(source ?? "").split(/\s+/).filter((word) => word.length > 0).length;
	return Math.max(1, Math.round(words / 220));
}
