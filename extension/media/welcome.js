(function () {
	"use strict";

	const cp = window.certPrep;
	const esc = cp.escapeHtml;

	function render(state) {
		const folder = state && state.folderName ? state.folderName : "this folder";
		const hasWorkspace = Boolean(state && state.hasWorkspace);

		return [
			'<div class="cp-app">',
			'<section class="cp-hero cp-reveal">',
			'<p class="cp-eyebrow">Gamified Cert Prep</p>',
			'<h1 class="cp-title" style="font-size:24px;margin:6px 0 8px">Let\'s build your campaign.</h1>',
			'<p class="cp-sub">Every certification becomes a day-by-day quest line — XP, streaks, trophies and all — stored in a git repo you own.</p>',
			"</section>",
			'<div class="cp-stack">',
			choice("cloneRepo", "⤓", "Clone a prep repo", "Already have one on GitHub? Pull it down and pick up exactly where you left off.", 90),
			choice(
				"useThisFolder",
				"◆",
				"Use " + esc(folder),
				hasWorkspace
					? "Turn the folder you already have open into your prep repo. Nothing existing gets overwritten."
					: "Open a folder first, then we can set it up right here.",
				160,
				!hasWorkspace
			),
			choice("bindRepo", "✦", "Create a new prep repo", "Pick an empty folder and we'll initialise git and the campaign scaffolding for you.", 230),
			"</div>",
			'<p class="cp-note" style="text-align:center">No account, no cloud. Your progress lives in your own repository.</p>',
			"</div>",
		].join("");
	}

	function choice(action, glyph, title, body, delay, disabled) {
		return (
			'<button class="cp-choice cp-reveal" style="animation-delay:' +
			delay +
			'ms" data-action="' +
			action +
			'"' +
			(disabled ? " disabled" : "") +
			'><span class="cp-choice-glyph">' +
			glyph +
			'</span><span class="cp-choice-body"><b>' +
			esc(title) +
			"</b><span>" +
			esc(body) +
			"</span></span></button>"
		);
	}

	cp.mount({
		initialState: window.__certPrepState || { hasWorkspace: false },
		render: render,
		onAction: function (action, _detail, element) {
			if (action === "cloneRepo") {
				cp.post("command/cloneRepo");
			} else if (action === "useThisFolder") {
				cp.celebrate(element);
				cp.post("command/useThisFolder");
			} else if (action === "bindRepo") {
				cp.post("command/bindRepo");
			}
		},
	});
})();
