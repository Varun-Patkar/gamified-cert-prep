/* Session reader: long-form study notes with a reading progress rail and a quiz hand-off. */
(function () {
	"use strict";

	const cp = window.certPrep;
	const esc = cp.escapeHtml;
	let examId = "";
	let currentDay = 0;

	function pct(fraction) {
		return Math.round(Math.min(1, Math.max(0, fraction || 0)) * 100);
	}

	function stickyHead(model) {
		return [
			'<div class="cp-sticky-head">',
			'<button class="cp-btn cp-btn--sm" style="width:auto" data-action="back">← Campaign</button>',
			'<div class="cp-grow">',
			'<div class="cp-eyebrow">' + esc(model.code) + " · Day " + model.day + "</div>",
			'<div style="font-weight:600">' + esc(model.title) + "</div>",
			"</div>",
			'<span class="cp-pill cp-pill--ghost">' + esc(model.kindLabel) + "</span>",
			'<span class="cp-pill">' + model.readingMinutes + " min read</span>",
			"</div>",
		].join("");
	}

	function banner(model) {
		if (!model.revisit) {
			return "";
		}
		return (
			'<div class="cp-revisit cp-reveal"><span style="font-size:17px">🏅</span><span>' +
			esc(model.revisitNote) +
			"</span>" +
			(typeof model.lastAccuracy === "number"
				? '<span class="cp-badge-acc" style="margin-left:auto">' + pct(model.lastAccuracy) + "%</span>"
				: "") +
			"</div>"
		);
	}

	function footer(model) {
		if (!model.quizAvailable) {
			return (
				'<div class="cp-cta-footer cp-reveal"><p class="cp-sub">No quiz attached to this day — read, rest, and come back tomorrow.</p></div>'
			);
		}
		return [
			'<div class="cp-cta-footer cp-reveal">',
			'<div class="cp-eyebrow">You have read it. Now prove it.</div>',
			'<button class="cp-btn cp-btn--primary" data-action="startQuiz">' + esc(model.ctaLabel) + "</button>",
			model.questionCount > 0
				? '<p class="cp-note" style="margin-top:10px">' + model.questionCount + " questions queued</p>"
				: "",
			"</div>",
		].join("");
	}

	function render(model) {
		if (!model) {
			return '<div class="cp-page cp-page--narrow"><p class="cp-sub">Opening the session…</p></div>';
		}

		const body = model.found
			? '<article class="cp-prose">' + model.html + "</article>"
			: '<div class="cp-empty"><span class="cp-empty-glyph">📄</span><b class="cp-title" style="font-size:17px">Nothing written for Day ' +
				model.day +
				' yet</b><p class="cp-sub" style="margin-top:8px">' +
				esc(model.missingBody) +
				"</p></div>";

		return [
			'<div class="cp-readbar"><i></i></div>',
			'<div class="cp-page cp-page--narrow">',
			stickyHead(model),
			banner(model),
			body,
			footer(model),
			"</div>",
			'<button class="cp-fab" data-action="ask">💬 Ask about this</button>',
		].join("");
	}

	function afterRender(model, root) {
		if (model) {
			examId = model.examId;
			currentDay = model.day;
		}
		// Link clicks are delegated too, so route http(s) targets through the host.
		root.querySelectorAll(".cp-prose a[href]").forEach(function (anchor) {
			anchor.dataset.action = "link";
			anchor.dataset.href = anchor.getAttribute("href");
		});
		updateReadbar();
	}

	function updateReadbar() {
		const bar = document.querySelector(".cp-readbar i");
		if (!bar) {
			return;
		}
		const scrollable = document.body.scrollHeight - window.innerHeight;
		const fraction = scrollable > 0 ? window.scrollY / scrollable : 0;
		bar.style.width = pct(fraction) + "%";
	}

	window.addEventListener("scroll", updateReadbar, { passive: true });
	window.addEventListener("resize", updateReadbar);

	cp.mount({
		initialState: undefined,
		render: render,
		afterRender: afterRender,
		onAction: function (action, detail) {
			if (action === "startQuiz") {
				cp.post("command/startQuiz", { examId: examId, day: currentDay });
			} else if (action === "back") {
				cp.post("command/backToDashboard", { examId: examId });
			} else if (action === "ask") {
				cp.post("command/askAboutSession", { examId: examId, day: currentDay });
			} else if (action === "link" && detail.href) {
				cp.post("command/openSource", { url: detail.href });
			}
		},
	});
})();
