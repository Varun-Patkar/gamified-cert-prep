/* Exam completion: the one screen that has to read well whether the news is good or not. */
(function () {
	"use strict";

	const cp = window.certPrep;
	const esc = cp.escapeHtml;
	const FIELDS = ["score", "maxScore", "passingScore", "credentialUrl"];

	/* Local edits live here so a state/update from the host never wipes what is being typed. */
	let draft = {};
	let focused = null;

	function field(id, label, hint, type) {
		return [
			'<label style="display:block">',
			'<span class="cp-eyebrow">' + esc(label) + "</span>",
			'<input class="cp-code" id="cp-' +
				id +
				'" data-field="' +
				id +
				'" type="' +
				type +
				'" spellcheck="false" placeholder="' +
				esc(hint) +
				'" value="' +
				esc(draft[id] || "") +
				'" style="width:100%;padding:9px 12px;margin-top:6px" />',
			"</label>",
		].join("");
	}

	function outcomeButton(choice) {
		const on = draft.outcome === choice.value;
		return [
			'<button class="cp-choice" data-action="outcome" data-value="' +
				esc(choice.value) +
				'" style="' +
				(on ? "border-color:var(--cp-gold,#ffb02e)" : "") +
				'">',
			'<span class="cp-choice-glyph">' + (on ? "●" : "○") + "</span>",
			'<span class="cp-choice-body"><b>' +
				esc(choice.label) +
				"</b><span>" +
				esc(choice.hint) +
				"</span></span>",
			"</button>",
		].join("");
	}

	function render(model) {
		if (!model) {
			return '<div class="cp-page cp-page--narrow"><p class="cp-sub">Opening…</p></div>';
		}

		const report = model.scoreReportName
			? '<p class="cp-note" style="margin-top:8px">Saved as <b>' + esc(model.scoreReportName) + "</b></p>"
			: '<p class="cp-sub" style="margin-top:6px">A PDF or screenshot gets copied into your exam folder and linked from the README. We will try to read the numbers off it for you.</p>';

		const errors = model.errors.length
			? '<div class="cp-callout cp-callout--caution"><p>' +
				model.errors.map(esc).join("</p><p>") +
				"</p></div>"
			: "";

		return [
			'<div class="cp-page cp-page--narrow">',
			'<div class="cp-page-head"><div class="cp-grow">',
			'<div class="cp-eyebrow">' + esc(model.code) + " · " + esc(model.vendor) + "</div>",
			'<h1 class="cp-headline">' + esc(model.headline) + "</h1>",
			'<p class="cp-sub">' + esc(model.body) + "</p>",
			"</div></div>",
			errors,
			'<div class="cp-stack">',
			'<section class="cp-card cp-reveal">',
			'<div class="cp-eyebrow">How did it land?</div>',
			'<div class="cp-stack" style="margin-top:12px">' + model.outcomes.map(outcomeButton).join("") + "</div>",
			"</section>",
			'<section class="cp-card cp-reveal">',
			'<div class="cp-eyebrow">Score report</div>',
			report,
			model.prefillNote ? '<p class="cp-note" style="margin-top:8px">' + esc(model.prefillNote) + "</p>" : "",
			'<button class="cp-btn cp-btn--sm cp-btn--ghost" style="width:auto;margin-top:12px" data-action="pickFile"' +
				(model.busy ? " disabled" : "") +
				">" +
				(model.busy ? esc(model.busyLabel || "Working…") : "Attach score report…") +
				"</button>",
			"</section>",
			'<section class="cp-card cp-reveal">',
			'<div class="cp-eyebrow">The numbers (all optional)</div>',
			'<div class="cp-stack" style="margin-top:12px">',
			field("score", "Your score", "e.g. 812 or 78%", "text"),
			field("maxScore", "Out of", "e.g. 1000", "text"),
			field("passingScore", "Passing score", "e.g. 700", "text"),
			field("credentialUrl", "Credential link", "https://…", "text"),
			"</div>",
			"</section>",
			"</div>",
			'<div class="cp-cta-footer cp-reveal">',
			'<div class="cp-eyebrow">' + esc(model.reassurance) + "</div>",
			'<button class="cp-btn cp-btn--primary" data-action="submit"' +
				(model.busy ? " disabled" : "") +
				">" +
				esc(model.ctaLabel) +
				"</button>",
			"</div>",
			"</div>",
		].join("");
	}

	function afterRender(model, root) {
		root.querySelectorAll("[data-field]").forEach(function (input) {
			const name = input.dataset.field;
			input.addEventListener("input", function () {
				draft[name] = input.value;
			});
			input.addEventListener("focus", function () {
				focused = name;
			});
			input.addEventListener("blur", function () {
				focused = null;
			});
			if (focused === name) {
				input.focus();
				input.setSelectionRange(input.value.length, input.value.length);
			}
		});
		void model;
	}

	function adopt(model) {
		if (!model) {
			return;
		}
		const incoming = model.form || {};
		for (const key of ["outcome"].concat(FIELDS)) {
			// The host only ever fills blanks, so never let it overwrite live typing.
			if (incoming[key] && !draft[key]) {
				draft[key] = incoming[key];
			}
		}
	}

	cp.mount({
		initialState: undefined,
		render: function (model) {
			adopt(model);
			return render(model);
		},
		afterRender: afterRender,
		onAction: function (action, detail) {
			if (action === "outcome") {
				draft.outcome = detail.value;
				// Repaint in place: the host has nothing to add for a radio choice.
				document.querySelectorAll('[data-action="outcome"]').forEach(function (button) {
					const on = button.dataset.value === draft.outcome;
					button.style.borderColor = on ? "var(--cp-gold,#ffb02e)" : "";
					button.querySelector(".cp-choice-glyph").textContent = on ? "●" : "○";
				});
			} else if (action === "pickFile") {
				cp.post("command/pickScoreReport");
			} else if (action === "submit") {
				const form = { outcome: draft.outcome || "" };
				FIELDS.forEach(function (name) {
					form[name] = draft[name] || "";
				});
				cp.post("command/submitCompletion", { form: form });
			}
		},
	});
})();
