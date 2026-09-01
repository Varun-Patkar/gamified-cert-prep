/* Source approval: the one screen where the user decides what the whole campaign is built from. */
(function () {
	"use strict";

	const cp = window.certPrep;
	const esc = cp.escapeHtml;
	let draftUrl = "";
	let inputFocused = false;

	function pill(card) {
		const tone = card.kind === "community" ? "cp-pill--ghost" : card.kind === "user-supplied" ? "cp-pill--cyan" : "cp-pill";
		return '<span class="cp-pill ' + tone + '">' + esc(card.kindLabel) + "</span>";
	}

	function sourceCard(card) {
		const link = card.url
			? '<a href="' + esc(card.url) + '" data-action="open" data-url="' + esc(card.url) + '">' + esc(card.host) + "</a>"
			: "<span>" + esc(card.host) + "</span>";
		return [
			'<div class="cp-card cp-card--hover cp-reveal" data-included="' + (card.included ? "1" : "0") + '"',
			' style="opacity:' + (card.included ? "1" : "0.5") + '">',
			'<div class="cp-row" style="align-items:flex-start;gap:12px">',
			'<button class="cp-check ' +
				(card.included ? "cp-check--on" : "") +
				'" data-action="toggle" data-id="' +
				esc(card.id) +
				'" title="' +
				(card.included ? "Exclude this source" : "Include this source") +
				'">' +
				(card.included ? "✓" : "") +
				"</button>",
			'<div class="cp-grow">',
			'<div class="cp-row cp-row--wrap" style="gap:8px;align-items:center">',
			pill(card),
			'<span class="cp-pill cp-pill--ghost">' + esc(card.trustLabel) + "</span>",
			"</div>",
			'<b class="cp-title" style="font-size:15px;display:block;margin-top:8px">' + esc(card.title) + "</b>",
			'<div class="cp-sub" style="margin-top:4px">' + link + "</div>",
			card.rationale ? '<p class="cp-note" style="margin-top:8px">' + esc(card.rationale) + "</p>" : "",
			"</div>",
			card.kind === "user-supplied"
				? '<button class="cp-btn cp-btn--link" data-action="remove" data-id="' + esc(card.id) + '">Remove</button>'
				: "",
			"</div>",
			"</div>",
		].join("");
	}

	function adder() {
		return [
			'<div class="cp-card cp-reveal">',
			'<div class="cp-eyebrow">Add your own source</div>',
			'<p class="cp-sub" style="margin-top:6px">Paste a link, or attach a PDF from a practice pack you own. Anything you add is treated as trusted and used verbatim.</p>',
			'<div class="cp-row cp-row--wrap" style="margin-top:12px;gap:8px">',
			'<input id="cp-url" class="cp-input" type="text" inputmode="url" placeholder="https://…" spellcheck="false"',
			' style="flex:1 1 260px;min-width:0" value="' + esc(draftUrl) + '" />',
			'<button class="cp-btn cp-btn--sm" style="width:auto" data-action="addUrl">Add link</button>',
			'<button class="cp-btn cp-btn--sm cp-btn--ghost" style="width:auto" data-action="pickFile">Attach file…</button>',
			"</div>",
			"</div>",
		].join("");
	}

	function render(model) {
		if (!model) {
			return '<div class="cp-page cp-page--narrow"><p class="cp-sub">Gathering sources…</p></div>';
		}

		const list = model.busy
			? '<div class="cp-empty"><span class="cp-empty-glyph">🔎</span><b class="cp-title" style="font-size:17px">Reading the web…</b><p class="cp-sub" style="margin-top:8px">Opening the official objectives page and a few study guides.</p></div>'
			: model.sources.length > 0
				? model.sources.map(sourceCard).join("")
				: '<div class="cp-empty"><span class="cp-empty-glyph">📚</span><b class="cp-title" style="font-size:17px">Nothing found yet</b><p class="cp-sub" style="margin-top:8px">Add a link you trust below, or search again.</p></div>';

		return [
			'<div class="cp-page cp-page--narrow">',
			'<div class="cp-page-head">',
			'<div class="cp-grow">',
			'<div class="cp-eyebrow">' + esc(model.code) + " · Step 1 of 4</div>",
			'<h1 class="cp-headline">' + esc(model.headline) + "</h1>",
			"</div>",
			'<button class="cp-btn cp-btn--sm cp-btn--ghost" style="width:auto" data-action="rediscover">Search again</button>',
			"</div>",
			'<p class="cp-sub" style="margin-bottom:18px">' + esc(model.why) + "</p>",
			model.error ? '<div class="cp-callout cp-callout--warning"><p>' + esc(model.error) + "</p></div>" : "",
			'<div class="cp-stack">',
			list,
			adder(),
			"</div>",
			'<div class="cp-cta-footer cp-reveal">',
			'<div class="cp-eyebrow">' + model.approvedCount + " selected</div>",
			'<button class="cp-btn cp-btn--primary"' +
				(model.canApprove ? "" : " disabled") +
				' data-action="approve">' +
				esc(model.ctaLabel) +
				"</button>",
			"</div>",
			"</div>",
		].join("");
	}

	function afterRender(model, root) {
		const input = root.querySelector("#cp-url");
		if (!input) {
			return;
		}
		input.value = draftUrl;
		if (inputFocused) {
			input.focus();
			input.setSelectionRange(draftUrl.length, draftUrl.length);
		}
		input.addEventListener("input", function () {
			draftUrl = input.value;
		});
		input.addEventListener("focus", function () {
			inputFocused = true;
		});
		input.addEventListener("blur", function () {
			inputFocused = false;
		});
		input.addEventListener("keydown", function (event) {
			if (event.key === "Enter") {
				event.preventDefault();
				submitUrl();
			}
		});
		void model;
	}

	function submitUrl() {
		const url = draftUrl.trim();
		if (!/^https?:\/\/\S+$/i.test(url)) {
			return;
		}
		draftUrl = "";
		cp.post("command/addSourceUrl", { url: url });
	}

	cp.mount({
		render: render,
		afterRender: afterRender,
		onAction: function (action, detail) {
			switch (action) {
				case "toggle":
					cp.post("command/toggleSource", { id: detail.id });
					break;
				case "remove":
					cp.post("command/removeSource", { id: detail.id });
					break;
				case "addUrl":
					submitUrl();
					break;
				case "pickFile":
					cp.post("command/pickSourceFile");
					break;
				case "rediscover":
					cp.post("command/rediscoverSources");
					break;
				case "open":
					cp.post("command/openSource", { url: detail.url });
					break;
				case "approve":
					cp.post("command/approveSources");
					break;
				default:
					break;
			}
		},
	});
})();
