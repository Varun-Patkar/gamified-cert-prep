/* Battle pass: one horizontal track, ending on exam day. Derivation happens host-side in battlePassModel.ts. */
(function () {
	"use strict";

	const cp = window.certPrep;
	const esc = cp.escapeHtml;
	let examId = "";
	let celebrated = false;

	function pct(fraction) {
		return Math.round(Math.min(1, Math.max(0, fraction || 0)) * 100);
	}

	function head(model) {
		const meter =
			model.totalTiers > 0
				? '<div class="cp-xp" style="min-width:240px">' +
					'<div class="cp-xp-meta"><span>' +
					(model.currentTier >= model.totalTiers
						? "Track complete"
						: "Tier " + (model.currentTier + 1) + " progress") +
					"</span><strong>" +
					model.completedDays +
					"/" +
					model.totalDays +
					" days</strong></div>" +
					'<div class="cp-xp-track"><div class="cp-xp-fill" data-fill="' +
					model.fractionToNext +
					'"></div></div>' +
					'<span class="cp-note">' +
					(model.daysToNextTier > 0
						? model.daysToNextTier +
							" more day" +
							(model.daysToNextTier === 1 ? "" : "s") +
							" unlocks " +
							esc(model.nextRewardName || "the next tier")
						: "Nothing left to unlock — just the exam.") +
					"</span></div>"
				: "";

		return [
			'<header class="cp-page-head cp-reveal">',
			'<div class="cp-grow">',
			'<div class="cp-row cp-row--wrap">',
			'<span class="cp-pill">' + esc(model.vendor) + "</span>",
			'<span class="cp-pill cp-pill--xp">Battle pass</span>',
			'<span class="cp-pill cp-pill--cyan">' + model.currentTier + " / " + model.totalTiers + " tiers</span>",
			"</div>",
			'<div class="cp-code cp-code--xl" style="margin-top:10px">' + esc(model.code) + "</div>",
			'<div class="cp-exam-title" style="font-size:14px">' + esc(model.title) + "</div>",
			'<h1 class="cp-headline">' + esc(model.headline) + "</h1>",
			'<p class="cp-sub">' + esc(model.subhead) + "</p>",
			'<button class="cp-btn cp-btn--link" data-action="backToDashboard">← Back to the campaign board</button>',
			"</div>",
			'<div class="cp-stack" style="align-items:flex-end;gap:14px">' + meter + "</div>",
			"</header>",
		].join("");
	}

	const KIND_LABELS = {
		theme: "Theme",
		frame: "Badge frame",
		milestone: "Milestone",
		certificate: "Certificate",
	};

	function tierCard(tier, index, model) {
		const unlocked = tier.state === "claimed" || tier.state === "unlocked";
		const next = model.tiers[index + 1];
		const nextUnlocked = next && (next.state === "claimed" || next.state === "unlocked");
		// The connector between the last unlocked tier and the next one is the live progress bar.
		const live = unlocked || (index === 0 && model.currentTier === 0);
		const linkFill = nextUnlocked ? 1 : live ? Math.min(1, Math.max(0, model.fractionToNext || 0)) : 0;

		const cert =
			tier.rewardKind === "certificate" && unlocked && tier.domainId
				? '<button class="cp-btn cp-bp-cert-btn" data-action="openCertificate" data-domain="' +
					esc(tier.domainId) +
					'">View certificate</button>'
				: "";

		return [
			'<article class="cp-bp-tier cp-bp-tier--' +
				tier.state +
				(tier.rewardKind === "certificate" ? " cp-bp-tier--cert" : "") +
				' cp-reveal" data-tier="' +
				tier.tier +
				'" style="animation-delay:' +
				Math.min(700, index * 45) +
				'ms">',
			index + 1 < model.totalTiers
				? '<i class="cp-bp-link"><b data-fill="' + linkFill + '"></b></i>'
				: "",
			'<div class="cp-bp-node"><span>' + tier.tier + "</span></div>",
			'<div class="cp-bp-card">',
			unlocked ? '<span class="cp-bp-stamp">✓</span>' : "",
			'<span class="cp-bp-icon">' + esc(tier.rewardIcon) + "</span>",
			'<span class="cp-bp-kind">' + esc(KIND_LABELS[tier.rewardKind] || tier.rewardKind) + "</span>",
			'<b class="cp-bp-name">' + esc(tier.rewardName) + "</b>",
			'<p class="cp-bp-desc">' + esc(tier.rewardDescription) + "</p>",
			cert,
			'<span class="cp-bp-when">Day ' + tier.day + (tier.date ? " · " + esc(tier.date) : "") + "</span>",
			"</div>",
			"</article>",
		].join("");
	}

	function track(model) {
		if (model.totalTiers === 0) {
			return [
				'<div class="cp-empty cp-reveal" style="padding:56px 24px">',
				'<span class="cp-empty-glyph" style="font-size:44px">🎟️</span>',
				'<b class="cp-title" style="font-size:20px">No track yet</b>',
				'<p class="cp-sub" style="margin:10px auto 0;max-width:44ch">Build a plan and the pass lays itself out across your campaign, ending on exam day.</p>',
				"</div>",
			].join("");
		}

		return [
			'<section class="cp-bp-strip cp-reveal">',
			'<div class="cp-bp-rail">',
			model.tiers
				.map(function (tier, index) {
					return tierCard(tier, index, model);
				})
				.join(""),
			'<div class="cp-bp-end cp-reveal">',
			'<div class="cp-bp-flag">🏁</div>',
			"<b>Exam day</b>",
			"<span>" + esc(model.examDayLabel) + "</span>",
			"</div>",
			"</div>",
			"</section>",
		].join("");
	}

	function badges(model) {
		if (!model.badges || model.badges.length === 0) {
			return [
				'<section class="cp-card cp-reveal">',
				'<h2 class="cp-title" style="font-size:14px;margin-bottom:8px">Badges</h2>',
				'<p class="cp-sub">Nothing pinned yet. Perfect runs, comebacks and streaks all leave a badge behind.</p>',
				"</section>",
			].join("");
		}
		return [
			'<section class="cp-reveal">',
			'<div class="cp-section-head"><h2 class="cp-title">Badges</h2><span class="cp-eyebrow">' +
				model.badges.length +
				" earned</span></div>",
			'<div class="cp-badges">',
			model.badges
				.map(function (badge) {
					return (
						'<div class="cp-badge"><span class="cp-badge-glyph">' +
						esc(badge.icon) +
						"</span><span><b>" +
						esc(badge.name) +
						"</b><small>" +
						esc(badge.description) +
						"</small></span></div>"
					);
				})
				.join(""),
			"</div>",
			"</section>",
		].join("");
	}

	function render(model) {
		if (!model) {
			return '<div class="cp-page"><p class="cp-sub">Laying out the track…</p></div>';
		}
		if (!model.enabled) {
			return [
				'<div class="cp-page cp-page--narrow">',
				'<div class="cp-empty cp-reveal" style="padding:64px 24px">',
				'<span class="cp-empty-glyph" style="font-size:44px">🌙</span>',
				'<b class="cp-title" style="font-size:22px">Gamification is turned off</b>',
				'<p class="cp-sub" style="margin:10px auto 0;max-width:48ch">' +
					esc(model.disabledMessage || "") +
					"</p>",
				"</div></div>",
			].join("");
		}
		return (
			'<div class="cp-page">' + head(model) + track(model) + badges(model) + "</div>"
		);
	}

	function afterRender(model, root) {
		if (!model) {
			return;
		}
		examId = model.examId;

		window.requestAnimationFrame(function () {
			root.querySelectorAll("[data-fill]").forEach(function (element) {
				element.style.width = pct(Number(element.dataset.fill)) + "%";
			});

			const focus =
				root.querySelector(".cp-bp-tier--unlocked") ||
				root.querySelector(".cp-bp-tier--current") ||
				root.querySelector(".cp-bp-tier");
			if (focus && focus.scrollIntoView) {
				focus.scrollIntoView({ block: "nearest", inline: "center", behavior: cp.reducedMotion ? "auto" : "smooth" });
			}

			if (!celebrated && model.celebrate && model.celebrate.length > 0) {
				celebrated = true;
				model.celebrate.forEach(function (tier, index) {
					const node = root.querySelector('.cp-bp-tier[data-tier="' + tier + '"] .cp-bp-node');
					window.setTimeout(function () {
						cp.celebrate(node);
					}, index * 260);
				});
			}
		});
	}

	cp.mount({
		initialState: undefined,
		render: render,
		afterRender: afterRender,
		onAction: function (action, detail) {
			if (action === "openCertificate") {
				cp.post("command/openCertificate", { examId: examId, domainId: detail.domain });
			} else if (action === "backToDashboard") {
				cp.post("command/backToDashboard", { examId: examId });
			}
		},
	});
})();
