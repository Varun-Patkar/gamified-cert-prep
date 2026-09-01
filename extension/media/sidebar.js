(function () {
	"use strict";

	const cp = window.certPrep;
	const esc = cp.escapeHtml;
	let lastLevel = null;

	function pct(fraction) {
		return Math.round(Math.min(1, Math.max(0, fraction || 0)) * 100);
	}

	function header(model) {
		if (!model) {
			return "";
		}
		const pips = [];
		for (let i = 0; i < model.maxFreezeTokens; i += 1) {
			pips.push('<i class="cp-pip' + (i < model.freezeTokens ? " cp-pip--on" : "") + '"></i>');
		}
		return [
			'<section class="cp-hero cp-reveal">',
			'<div class="cp-row">',
			'<div class="cp-level-badge"><div><small>LVL</small><span>' + model.level + "</span></div></div>",
			"<div>",
			'<p class="cp-eyebrow">' + esc(model.rank) + "</p>",
			'<div class="cp-numeral" style="font-size:20px">' + model.lifetimeXp.toLocaleString() + ' <span class="cp-eyebrow">XP</span></div>',
			"</div>",
			"</div>",
			'<div class="cp-xp" style="margin-top:14px">',
			'<div class="cp-xp-meta"><span>Next level</span><span><strong>' +
				model.currentXp +
				"</strong> / " +
				model.neededXp +
				"</span></div>",
			'<div class="cp-xp-track"><div class="cp-xp-fill" data-fill="' + model.fraction + '"></div></div>',
			"</div>",
			'<div class="cp-streak">',
			'<span class="cp-flame">🔥</span>',
			'<span class="cp-streak-count">' + model.streak + '</span><span class="cp-dim">day streak</span>',
			'<span class="cp-pips" title="Streak freezes">' + pips.join("") + "</span>",
			"</div>",
			'<p class="cp-sub" style="margin-top:10px;font-size:11.5px">' + esc(model.greeting) + "</p>",
			"</section>",
		].join("");
	}

	function activeCard(card, index) {
		const stats = [];
		if (card.countdownLabel) {
			stats.push(stat(card.daysUntilExam >= 0 ? String(card.daysUntilExam) : "—", card.countdownLabel));
		}
		if (typeof card.lastAccuracy === "number") {
			stats.push(stat(pct(card.lastAccuracy) + "%", "last accuracy"));
		}
		stats.push(stat(card.completedDays + "/" + (card.totalDays || "?"), "days cleared"));

		return [
			'<article class="cp-card cp-card--hover cp-reveal" style="animation-delay:' + (120 + index * 80) + 'ms">',
			'<div class="cp-row" style="align-items:flex-start">',
			"<div style=\"flex:1 1 auto;min-width:0\">",
			'<div class="cp-code">' + esc(card.code) + "</div>",
			'<div class="cp-exam-title">' + esc(card.title) + "</div>",
			'<div class="cp-row cp-row--wrap" style="margin-top:8px">',
			'<span class="cp-pill">' + esc(card.vendor) + "</span>",
			'<span class="cp-pill cp-pill--cyan">' + pct(card.fraction) + "% complete</span>",
			"</div>",
			"</div>",
			'<div class="cp-ring" data-ring="' +
				card.fraction +
				'"><span class="cp-ring-label"><b>' +
				card.currentDay +
				"</b><small>of " +
				(card.totalDays || "?") +
				"</small></span></div>",
			"</div>",
			'<div class="cp-row" style="margin-top:14px;gap:18px">' + stats.join("") + "</div>",
			'<p class="cp-sub" style="margin:12px 0 12px;font-size:11.5px">' + esc(card.encouragement) + "</p>",
			card.completionPrompt
				? '<div class="cp-callout cp-callout--tip" style="margin-bottom:12px"><p><b>' +
					esc(card.completionPrompt.headline) +
					"</b></p><p>" +
					esc(card.completionPrompt.body) +
					'</p><button class="cp-btn cp-btn--sm" style="margin-top:10px" data-action="completeExam" data-exam="' +
					esc(card.examId) +
					'">' +
					esc(card.completionPrompt.ctaLabel) +
					"</button></div>"
				: "",
			'<button class="cp-btn cp-btn--primary" data-action="openDay" data-exam="' +
				esc(card.examId) +
				'" data-day="' +
				card.currentDay +
				'">' +
				esc(card.ctaLabel) +
				"</button>",
			"</article>",
		].join("");
	}

	function stat(value, label) {
		return '<span class="cp-stat"><b>' + esc(value) + "</b><small>" + esc(label) + "</small></span>";
	}

	function trophy(item) {
		const links = [];
		if (item.credentialUrl) {
			links.push('<a class="cp-btn--link" href="' + esc(item.credentialUrl) + '">credential</a>');
		}
		if (item.scoreReportFile) {
			links.push(
				'<button class="cp-btn--link" data-action="openFile" data-exam="' +
					esc(item.examId) +
					'" data-file="' +
					esc(item.scoreReportFile) +
					'">score report</button>'
			);
		}
		const meta = [];
		if (item.scoreLabel) {
			meta.push(esc(item.scoreLabel));
		}
		if (typeof item.xp === "number" && item.xp > 0) {
			meta.push(item.xp + " XP");
		}
		meta.push(esc(item.title));

		return [
			'<div class="cp-trophy">',
			'<span class="cp-trophy-medal' + (item.legacy ? " cp-trophy-medal--legacy" : "") + '">★</span>',
			'<div class="cp-trophy-body"><b>' + esc(item.code) + "</b>",
			"<div>" + meta.join(" · ") + "</div>",
			item.legacy ? '<div class="cp-note">earned pre-campaign</div>' : "",
			links.length ? '<div class="cp-trophy-links">' + links.join("") + "</div>" : "",
			"</div>",
			"</div>",
		].join("");
	}

	function syncBar(sync) {
		return [
			'<div class="cp-sync" data-state="' + esc(sync.state) + '">',
			'<span class="cp-sync-dot"></span><span>' + esc(sync.label) + "</span>",
			sync.canCommit ? '<button class="cp-btn--link" style="margin-left:auto" data-action="commitNow">Commit now</button>' : "",
			"</div>",
		].join("");
	}

	function render(model) {
		if (!model) {
			return '<div class="cp-app"><p class="cp-sub">Loading your campaign…</p></div>';
		}
		const parts = ['<div class="cp-app">', header(model.header)];

		if (model.active.length > 0) {
			parts.push('<section><div class="cp-section-head"><h2 class="cp-title" style="font-size:13px">Active prep</h2>');
			parts.push('<span class="cp-eyebrow">' + model.active.length + "</span></div>");
			parts.push('<div class="cp-stack">' + model.active.map(activeCard).join("") + "</div></section>");
		} else if (model.hasAnyExam) {
			parts.push(
				'<div class="cp-empty cp-reveal"><span class="cp-empty-glyph">🌱</span><b class="cp-title" style="font-size:15px">Nothing in flight</b><p class="cp-sub" style="margin-top:6px">Line up your next exam whenever you are ready.</p></div>'
			);
		} else {
			parts.push(
				'<div class="cp-empty cp-reveal"><span class="cp-empty-glyph">🗺️</span><b class="cp-title" style="font-size:16px">' +
					esc(model.emptyHeadline) +
					'</b><p class="cp-sub" style="margin-top:6px">' +
					esc(model.emptyBody) +
					"</p></div>"
			);
		}

		if (model.trophies.length > 0) {
			parts.push(
				'<details class="cp-trophies cp-reveal"><summary>🏆 Trophy case <span class="cp-pill cp-pill--xp">' +
					model.trophies.length +
					"</span></summary>" +
					model.trophies.map(trophy).join("") +
					"</details>"
			);
		}

		parts.push('<button class="cp-btn cp-btn--ghost" data-action="newExam">+ Prepare for a new exam</button>');
		parts.push('<hr class="cp-divider" />');
		parts.push(syncBar(model.sync));
		parts.push("</div>");
		return parts.join("");
	}

	function afterRender(model, root) {
		// Fill from zero on the next frame so the spring transition actually plays.
		window.requestAnimationFrame(function () {
			root.querySelectorAll("[data-fill]").forEach(function (element) {
				element.style.width = pct(Number(element.dataset.fill)) + "%";
			});
			root.querySelectorAll("[data-ring]").forEach(function (element) {
				element.style.setProperty("--cp-ring-fraction", String(Number(element.dataset.ring) || 0));
			});
		});

		if (model && model.header) {
			if (lastLevel !== null && model.header.level > lastLevel) {
				cp.celebrate(root.querySelector(".cp-level-badge"));
			}
			lastLevel = model.header.level;
		}
	}

	cp.mount({
		initialState: undefined,
		render: render,
		afterRender: afterRender,
		onAction: function (action, detail) {
			if (action === "openDay") {
				cp.post("command/openDay", { examId: detail.exam, day: Number(detail.day) });
			} else if (action === "completeExam") {
				cp.post("command/openCompletion", { examId: detail.exam });
			} else if (action === "openFile" || action === "openExam") {
				cp.post("command/openExam", { examId: detail.exam });
			} else if (action === "newExam") {
				cp.post("command/newExam");
			} else if (action === "commitNow") {
				cp.post("command/commitNow");
			}
		},
	});
})();
