/* Exam dashboard: the campaign board. All derivation happens host-side in dashboardModel.ts. */
(function () {
	"use strict";

	const cp = window.certPrep;
	const esc = cp.escapeHtml;
	let examId = "";

	function pct(fraction) {
		return Math.round(Math.min(1, Math.max(0, fraction || 0)) * 100);
	}

	function head(model) {
		const pass = model.battlePass;
		const pips = (pass ? pass.pips : model.tier.pips)
			.map(function (on) {
				return '<i class="cp-tier-pip' + (pass ? " cp-tier-pip--sm" : "") + (on ? " cp-tier-pip--on" : "") + '"></i>';
			})
			.join("");

		const tierBlock = model.gamificationEnabled
			? '<button class="cp-tier-open" data-action="openBattlePass" title="Open the battle pass">' +
				'<span class="cp-eyebrow">Battle pass · ' +
				esc(pass ? "Tier " + pass.currentTier + "/" + pass.totalTiers : model.tier.label) +
				"</span>" +
				'<span class="cp-tier-track">' +
				pips +
				"</span>" +
				'<span class="cp-note">' +
				(pass && pass.nextRewardName
					? "next: " + esc(pass.nextRewardName)
					: model.tier.nextLabel
						? "next: " + esc(model.tier.nextLabel)
						: "track complete") +
				"</span>" +
				"</button>"
			: "";

		const countdown = model.examDate
			? '<div class="cp-countdown"><b>' +
				(typeof model.daysUntilExam === "number" && model.daysUntilExam >= 0 ? model.daysUntilExam : "—") +
				'</b><span class="cp-eyebrow">' +
				esc(model.countdownLabel) +
				"</span></div>"
			: '<p class="cp-sub" style="margin-top:6px">' + esc(model.countdownLabel) + "</p>";

		return [
			'<header class="cp-page-head cp-reveal">',
			'<div class="cp-grow">',
			'<div class="cp-row cp-row--wrap">',
			'<span class="cp-pill">' + esc(model.vendor) + "</span>",
			'<span class="cp-pill cp-pill--cyan">' + pct(model.fraction) + "% complete</span>",
			model.streak > 0 ? '<span class="cp-pill cp-pill--xp">🔥 ' + model.streak + " day streak</span>" : "",
			"</div>",
			'<div class="cp-code cp-code--xl" style="margin-top:10px">' + esc(model.code) + "</div>",
			'<div class="cp-exam-title" style="font-size:14px">' + esc(model.title) + "</div>",
			'<h1 class="cp-headline">' + esc(model.headline) + "</h1>",
			'<p class="cp-sub">' + esc(model.encouragement) + "</p>",
			"</div>",
			'<div class="cp-stack" style="align-items:flex-end;gap:14px">',
			countdown,
			tierBlock,
			"</div>",
			'<div class="cp-ring cp-ring--lg" data-ring="' +
				model.fraction +
				'"><span class="cp-ring-label"><b>' +
				pct(model.fraction) +
				"%</b><small>" +
				model.completedDays +
				" of " +
				(model.totalDays || "?") +
				"</small></span></div>",
			"</header>",
		].join("");
	}

	function dayCard(card, index) {
		const modifier =
			card.state === "completed"
				? " cp-day--completed"
				: card.state === "next"
					? " cp-day--next"
					: card.state === "unlockable-early"
						? " cp-day--early"
						: " cp-day--locked";

		const badge =
			typeof card.accuracy === "number"
				? '<span class="cp-badge-acc">' + pct(card.accuracy) + "%</span>"
				: "";
		const lock = card.state === "locked" ? '<span class="cp-lock">🔒</span>' : "";

		const primary =
			'<button class="cp-btn ' +
			(card.state === "next" ? "cp-btn--primary" : "cp-btn--sm") +
			'" data-action="openSession" data-day="' +
			card.day +
			'">' +
			esc(card.actionLabel) +
			"</button>";

		const early =
			card.earlyLabel && card.state !== "next"
				? '<button class="cp-btn cp-btn--ghost cp-btn--sm" data-action="startQuiz" data-day="' +
					card.day +
					'">' +
					esc(card.earlyLabel) +
					"</button>"
				: "";

		return [
			'<article class="cp-day' + modifier + ' cp-reveal" style="animation-delay:' + Math.min(600, index * 26) + 'ms">',
			lock,
			'<div class="cp-day-num">Day ' + card.day + "</div>",
			'<div class="cp-day-title">' + esc(card.title) + "</div>",
			'<div class="cp-day-meta">',
			'<span class="cp-pill cp-pill--ghost">' + esc(card.kindLabel) + "</span>",
			card.date ? "<span>" + esc(card.date) + "</span>" : "",
			card.questionCount > 0 ? "<span>· " + card.questionCount + " Qs</span>" : "",
			badge,
			"</div>",
			'<div class="cp-day-actions">' + primary + early + "</div>",
			"</article>",
		].join("");
	}

	function meter(row) {
		return [
			'<div class="cp-meter">',
			'<div class="cp-meter-head"><b>' +
				esc(row.title) +
				"</b><small>" +
				(row.totalDays > 0 ? row.completedDays + "/" + row.totalDays : row.questionCount + " Qs") +
				(typeof row.accuracy === "number" ? " · " + pct(row.accuracy) + "%" : "") +
				"</small></div>",
			'<div class="cp-meter-track"><i class="cp-meter-fill" data-fill="' + row.fraction + '"></i></div>',
			"</div>",
		].join("");
	}

	function rail(model) {
		const domains = model.domains.length
			? model.domains.map(meter).join("")
			: '<p class="cp-sub">No domain breakdown yet.</p>';

		const focus = model.focusAreas.length
			? model.focusAreas
					.map(function (area) {
						return (
							'<div class="cp-focus-item"><span>' +
							esc(area.topicId) +
							'</span><span class="cp-focus-hits">×' +
							area.hits +
							"</span></div>"
						);
					})
					.join("")
			: '<p class="cp-sub">Nothing flagged yet — take a quiz and weak spots will surface here.</p>';

		const accuracy =
			typeof model.overallAccuracy === "number"
				? '<div class="cp-row" style="gap:18px"><span class="cp-stat"><b>' +
					pct(model.overallAccuracy) +
					'%</b><small>overall accuracy</small></span><span class="cp-stat"><b>' +
					model.answeredQuestions +
					'</b><small>questions answered</small></span></div>'
				: '<p class="cp-sub">Answer your first quiz to start the accuracy record.</p>';

		const certificates =
			model.gamificationEnabled && model.certificates && model.certificates.length > 0
				? '<section class="cp-card cp-reveal"><h2 class="cp-title" style="font-size:13px;margin-bottom:10px">Certificates</h2><div class="cp-medallions">' +
					model.certificates
						.map(function (medallion) {
							return (
								'<button class="cp-medallion" data-action="openCertificate" data-domain="' +
								esc(medallion.domainId) +
								'" title="' +
								esc(medallion.domainName) +
								'"><i>📜</i><span>' +
								esc(medallion.domainName) +
								"</span></button>"
							);
						})
						.join("") +
					"</div></section>"
				: "";

		return [
			'<aside class="cp-rail">',
			'<section class="cp-card cp-reveal"><h2 class="cp-title" style="font-size:13px;margin-bottom:10px">Scoreboard</h2>' +
				accuracy +
				'<hr class="cp-divider" style="margin:12px 0" /><div class="cp-row" style="gap:18px"><span class="cp-stat"><b>' +
				model.xp.toLocaleString() +
				'</b><small>exam XP</small></span><span class="cp-stat"><b>' +
				model.tier.label +
				"</b><small>tier</small></span></div></section>",
			certificates,
			'<section class="cp-card cp-reveal"><h2 class="cp-title" style="font-size:13px;margin-bottom:10px">Domain progress</h2>' +
				domains +
				"</section>",
			'<section class="cp-card cp-reveal"><h2 class="cp-title" style="font-size:13px;margin-bottom:10px">Focus areas</h2>' +
				focus +
				"</section>",
			"</aside>",
		].join("");
	}

	function emptyState(model) {
		return [
			'<div class="cp-empty cp-reveal" style="padding:60px 24px">',
			'<span class="cp-empty-glyph" style="font-size:46px">🗺️</span>',
			'<b class="cp-title" style="font-size:22px">' + esc(model.emptyHeadline) + "</b>",
			'<p class="cp-sub" style="margin:10px auto 20px;max-width:46ch">' + esc(model.emptyBody) + "</p>",
			'<button class="cp-btn cp-btn--primary" style="width:auto;padding:12px 26px" data-action="buildPlan">Build my plan →</button>',
			"</div>",
		].join("");
	}

	function render(model) {
		if (!model) {
			return '<div class="cp-page"><p class="cp-sub">Loading the campaign…</p></div>';
		}
		const board = model.hasPlan
			? '<section><div class="cp-section-head"><h2 class="cp-title">Plan board</h2><span class="cp-eyebrow">' +
				model.completedDays +
				" of " +
				model.totalDays +
				' cleared</span></div><div class="cp-daygrid">' +
				model.days.map(dayCard).join("") +
				"</div></section>"
			: emptyState(model);

		return (
			'<div class="cp-page">' +
			head(model) +
			'<div class="cp-layout"><div class="cp-grow">' +
			board +
			"</div>" +
			rail(model) +
			"</div></div>"
		);
	}

	function afterRender(model, root) {
		if (model) {
			examId = model.examId;
		}
		window.requestAnimationFrame(function () {
			root.querySelectorAll("[data-ring]").forEach(function (element) {
				element.style.setProperty("--cp-ring-fraction", String(Number(element.dataset.ring) || 0));
			});
			root.querySelectorAll("[data-fill]").forEach(function (element) {
				element.style.width = pct(Number(element.dataset.fill)) + "%";
			});
		});
	}

	cp.mount({
		initialState: undefined,
		render: render,
		afterRender: afterRender,
		onAction: function (action, detail) {
			if (action === "openSession") {
				cp.post("command/openSession", { examId: examId, day: Number(detail.day) });
			} else if (action === "startQuiz") {
				cp.post("command/startQuiz", { examId: examId, day: Number(detail.day) });
			} else if (action === "buildPlan") {
				cp.post("command/buildPlan", { examId: examId });
			} else if (action === "openBattlePass") {
				cp.post("command/openBattlePass", { examId: examId });
			} else if (action === "openCertificate") {
				cp.post("command/openCertificate", { examId: examId, domainId: detail.domain });
			}
		},
	});
})();
