/* Quiz: one question per screen, keyboard-first, with a results screen that pays out loud. */
(function () {
	"use strict";

	const cp = window.certPrep;
	const esc = cp.escapeHtml;

	let examId = "";
	let current = undefined;
	let selection = [];
	let selectionFor = "";
	let cursor = 0;
	let celebrated = false;

	function pct(fraction) {
		return Math.round(Math.min(1, Math.max(0, fraction || 0)) * 100);
	}

	function isGrouped(question) {
		return question.kind === "yesno" || question.kind === "matching";
	}

	function resetSelection(question, model) {
		const key = question.id + "#" + model.index + "#" + (model.feedback ? "f" : "o");
		if (selectionFor === key) {
			return;
		}
		selectionFor = key;
		selection = isGrouped(question) ? question.groups.map(function () { return ""; }) : [];
		cursor = 0;
	}

	function ready(question) {
		if (!question) {
			return false;
		}
		if (isGrouped(question)) {
			return selection.every(function (value) { return value !== ""; });
		}
		return selection.length > 0;
	}

	/* ---------- top bar ---------- */

	function topBar(model) {
		const fraction = model.total > 0 ? (model.index + (model.feedback ? 1 : 0)) / model.total : 0;
		const streakCold = model.streak === 0;
		return [
			'<div class="cp-quizbar cp-reveal">',
			'<div class="cp-ring" data-ring="' +
				fraction +
				'"><span class="cp-ring-label"><b>' +
				(model.index + 1) +
				"</b><small>of " +
				model.total +
				"</small></span></div>",
			'<div class="cp-grow">',
			'<div class="cp-eyebrow">' + esc(model.code) + " · Day " + model.day + " · " + esc(model.kindLabel) + "</div>",
			'<div style="font-weight:600">Q ' + (model.index + 1) + " of " + model.total + "</div>",
			"</div>",
			model.question
				? '<span class="cp-pill cp-pill--cyan">' + esc(model.question.domainName) + "</span>"
				: "",
			'<span class="cp-streak-chip' + (streakCold ? " cp-streak-chip--cold" : "") + '">🔥 ' + model.streak + "</span>",
			model.retryMode ? '<span class="cp-pill cp-pill--xp">Retry run</span>' : "",
			"</div>",
		].join("");
	}

	/* ---------- question body ---------- */

	function flatOption(option, index, feedback) {
		const picked = selection.indexOf(option.key) >= 0;
		let modifier = picked ? " cp-opt--picked" : "";
		if (feedback) {
			const isAnswer = feedback.expected.indexOf(option.key) >= 0;
			if (isAnswer) {
				modifier = " cp-opt--correct";
			} else if (feedback.response.indexOf(option.key) >= 0) {
				modifier = " cp-opt--wrong";
			} else {
				modifier = "";
			}
		}
		return [
			'<button class="cp-opt' + modifier + '"',
			feedback ? " disabled" : "",
			index === cursor && !feedback ? ' data-cursor="1"' : "",
			' data-action="pick" data-key="' + esc(option.key) + '">',
			'<span class="cp-opt-key">' + (index + 1) + "</span>",
			"<span>" + esc(option.label) + "</span>",
			"</button>",
		].join("");
	}

	function groupBlock(group, groupIndex, feedback) {
		const options = group.options
			.map(function (option, optionIndex) {
				const picked = selection[groupIndex] === option.key;
				let modifier = picked ? " cp-opt--picked" : "";
				if (feedback) {
					if (feedback.expected[groupIndex] === option.key) {
						modifier = " cp-opt--correct";
					} else if (feedback.response[groupIndex] === option.key) {
						modifier = " cp-opt--wrong";
					} else {
						modifier = "";
					}
				}
				return (
					'<button class="cp-opt' +
					modifier +
					'"' +
					(feedback ? " disabled" : "") +
					' data-action="pickGroup" data-group="' +
					groupIndex +
					'" data-key="' +
					esc(option.key) +
					'"><span class="cp-opt-key">' +
					(optionIndex + 1) +
					"</span><span>" +
					esc(option.label) +
					"</span></button>"
				);
			})
			.join("");
		return (
			'<div class="cp-group' +
			(groupIndex === cursor && !feedback ? " cp-group--active" : "") +
			'"><div class="cp-group-label">' +
			esc(group.label) +
			'</div><div class="cp-group-opts">' +
			options +
			"</div></div>"
		);
	}

	function explanation(model) {
		const feedback = model.feedback;
		if (!feedback) {
			return "";
		}
		const citation = feedback.sourceUrl
			? '<div style="margin-top:10px"><button class="cp-btn--link" data-action="source" data-href="' +
				esc(feedback.sourceUrl) +
				'">' +
				esc(feedback.sourceLabel || "Read the source") +
				" ↗</button></div>"
			: feedback.sourceLabel
				? '<div class="cp-note" style="margin-top:10px">Source: ' + esc(feedback.sourceLabel) + "</div>"
				: "";
		return [
			'<div class="cp-explain">',
			"<b>" + esc(feedback.message) + "</b>",
			feedback.explanation ? "<div>" + esc(feedback.explanation) + "</div>" : "",
			citation,
			"</div>",
		].join("");
	}

	function actions(model) {
		const last = model.index >= model.total - 1;
		if (model.feedback) {
			return (
				'<div class="cp-actions"><button class="cp-btn cp-btn--primary" data-action="' +
				(last ? "finish" : "next") +
				'">' +
				(last ? "See my results →" : "Next question →") +
				'</button><span class="cp-sub" style="align-self:center">press <span class="cp-kbd">Enter</span></span></div>'
			);
		}
		const hint =
			'<span class="cp-sub" style="align-self:center">' +
			(model.question && model.question.kind === "multi" ? "select every option that applies · " : "") +
			'<span class="cp-kbd">1–9</span> pick · <span class="cp-kbd">↑↓</span> move · <span class="cp-kbd">Enter</span> submit</span>';

		// Single-choice commits on click; everything else needs an explicit submit.
		if (model.question && model.question.kind === "single") {
			return '<div class="cp-actions">' + hint + "</div>";
		}
		return (
			'<div class="cp-actions"><button class="cp-btn cp-btn--primary" data-action="submit"' +
			(ready(model.question) ? "" : " disabled") +
			">Submit answer</button>" +
			hint +
			"</div>"
		);
	}

	function quizScreen(model) {
		const question = model.question;
		resetSelection(question, model);
		const body = isGrouped(question)
			? question.groups
					.map(function (group, index) {
						return groupBlock(group, index, model.feedback);
					})
					.join("")
			: '<div class="cp-opts">' +
				question.options
					.map(function (option, index) {
						return flatOption(option, index, model.feedback);
					})
					.join("") +
				"</div>";

		return [
			'<div class="cp-page">',
			topBar(model),
			'<h1 class="cp-question">' + esc(question.prompt) + "</h1>",
			body,
			explanation(model),
			actions(model),
			"</div>",
		].join("");
	}

	/* ---------- results ---------- */

	function resultsScreen(model) {
		const results = model.results;
		const lines = results.xpLines
			.map(function (line, index) {
				return (
					'<div class="cp-xpline" style="animation-delay:' +
					(320 + index * 180) +
					'ms"><span>' +
					esc(line.label) +
					"</span><b>" +
					(line.value >= 0 ? "+" : "") +
					line.value +
					"</b></div>"
				);
			})
			.join("");

		const domains = results.domains
			.map(function (domain) {
				return (
					'<div class="cp-meter"><div class="cp-meter-head"><b>' +
					esc(domain.domainName) +
					"</b><small>" +
					domain.correct +
					"/" +
					domain.total +
					' · ' +
					pct(domain.accuracy) +
					'%</small></div><div class="cp-meter-track"><i class="cp-meter-fill" data-fill="' +
					domain.accuracy +
					'"></i></div></div>'
				);
			})
			.join("");

		const topics = results.weakTopics.length
			? '<div class="cp-chips">' +
				results.weakTopics
					.map(function (topic) {
						return '<span class="cp-pill cp-pill--ghost">' + esc(topic) + "</span>";
					})
					.join("") +
				"</div>"
			: '<p class="cp-sub">Nothing flagged. That is the good ending.</p>';

		return [
			'<div class="cp-page">',
			'<header class="cp-page-head cp-reveal">',
			'<div class="cp-grow">',
			'<div class="cp-eyebrow">' + esc(model.code) + " · Day " + model.day + " · attempt " + results.attempt + "</div>",
			'<div class="cp-bigscore" data-count="' + pct(results.accuracy) + '">0%</div>',
			'<h1 class="cp-headline">' + esc(results.headline) + "</h1>",
			'<p class="cp-sub" style="max-width:52ch">' + esc(results.body) + "</p>",
			'<div class="cp-row cp-row--wrap" style="margin-top:14px">',
			'<span class="cp-pill cp-pill--cyan">' + results.correct + " / " + results.total + " correct</span>",
			'<span class="cp-pill cp-pill--xp">🔥 ' + results.streak + " day streak</span>",
			"</div>",
			"</div>",
			'<div class="cp-xptally">' +
				lines +
				'<div class="cp-xpline cp-xpline--total" style="animation-delay:' +
				(320 + results.xpLines.length * 180) +
				'ms"><span>XP banked</span><b>+' +
				results.xpTotal +
				"</b></div></div>",
			"</header>",
			'<div class="cp-layout"><div class="cp-grow">',
			'<section class="cp-card cp-reveal"><h2 class="cp-title" style="font-size:13px;margin-bottom:10px">Domain breakdown</h2>' +
				(domains || '<p class="cp-sub">No breakdown available.</p>') +
				"</section>",
			'<section class="cp-card cp-reveal" style="margin-top:16px"><h2 class="cp-title" style="font-size:13px;margin-bottom:10px">Topics to review</h2>' +
				topics +
				"</section>",
			'<div class="cp-cta-footer cp-reveal">',
			'<div class="cp-eyebrow">' + esc(results.nextAction) + "</div>",
			'<div class="cp-actions" style="justify-content:center">',
			'<button class="cp-btn cp-btn--primary" data-action="back">← Back to campaign</button>',
			results.missedCount > 0
				? '<button class="cp-btn" style="width:auto" data-action="retry">Retry the ' +
					results.missedCount +
					" I missed</button>"
				: "",
			"</div></div>",
			"</div>",
			'<aside class="cp-rail"><section class="cp-card cp-reveal"><h2 class="cp-title" style="font-size:13px;margin-bottom:10px">Run summary</h2>' +
				'<div class="cp-row" style="gap:18px"><span class="cp-stat"><b>' +
				results.total +
				'</b><small>questions</small></span><span class="cp-stat"><b>' +
				results.missedCount +
				'</b><small>missed</small></span><span class="cp-stat"><b>+' +
				results.xpTotal +
				"</b><small>XP</small></span></div></section></aside>",
			"</div></div>",
		].join("");
	}

	function render(model) {
		if (!model) {
			return '<div class="cp-page"><p class="cp-sub">Shuffling the deck…</p></div>';
		}
		if (model.phase === "results" && model.results) {
			return resultsScreen(model);
		}
		if (model.phase === "empty" || !model.question) {
			return (
				'<div class="cp-page"><div class="cp-empty"><span class="cp-empty-glyph">🃏</span><b class="cp-title" style="font-size:18px">No questions to serve</b><p class="cp-sub" style="margin-top:8px">' +
				esc(model.emptyMessage || "This day has no gradable questions yet.") +
				'</p><button class="cp-btn cp-btn--ghost" style="margin-top:16px" data-action="back">Back to campaign</button></div></div>'
			);
		}
		return quizScreen(model);
	}

	function countUp(element, target) {
		if (cp.reducedMotion) {
			element.textContent = target + "%";
			return;
		}
		const started = performance.now();
		const duration = 1100;
		function step(now) {
			const t = Math.min(1, (now - started) / duration);
			const eased = 1 - Math.pow(1 - t, 3);
			element.textContent = Math.round(target * eased) + "%";
			if (t < 1) {
				window.requestAnimationFrame(step);
			}
		}
		window.requestAnimationFrame(step);
	}

	function afterRender(model, root) {
		current = model;
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
			const score = root.querySelector(".cp-bigscore");
			if (score) {
				countUp(score, Number(score.dataset.count) || 0);
			}
		});

		if (model && model.results && model.results.celebrate && !celebrated) {
			celebrated = true;
			window.setTimeout(function () {
				cp.celebrate(root.querySelector(".cp-bigscore"));
			}, 420);
		}
		if (model && model.phase !== "results") {
			celebrated = false;
		}
	}

	function submit() {
		if (!current || !current.question || current.feedback || !ready(current.question)) {
			return;
		}
		cp.post("quiz/answer", { questionId: current.question.id, response: selection.slice() });
	}

	function advance() {
		if (!current) {
			return;
		}
		if (current.index >= current.total - 1) {
			cp.post("quiz/finish");
		} else {
			cp.post("quiz/next");
		}
	}

	function pickFlat(key) {
		if (!current || !current.question || current.feedback) {
			return;
		}
		if (current.question.kind === "multi") {
			const at = selection.indexOf(key);
			if (at >= 0) {
				selection.splice(at, 1);
			} else {
				selection.push(key);
			}
		} else {
			selection = [key];
		}
	}

	document.addEventListener("keydown", function (event) {
		if (!current || current.phase === "results") {
			return;
		}
		const question = current.question;
		if (!question) {
			return;
		}

		if (event.key === "Enter") {
			event.preventDefault();
			if (current.feedback) {
				advance();
			} else {
				submit();
			}
			return;
		}
		if (current.feedback) {
			return;
		}

		const digit = Number(event.key);
		if (Number.isInteger(digit) && digit >= 1 && digit <= 9) {
			event.preventDefault();
			if (isGrouped(question)) {
				const group = question.groups[cursor];
				const option = group && group.options[digit - 1];
				if (option) {
					selection[cursor] = option.key;
					cursor = Math.min(question.groups.length - 1, cursor + 1);
				}
			} else {
				const option = question.options[digit - 1];
				if (option) {
					pickFlat(option.key);
					cursor = digit - 1;
				}
			}
			redraw();
			return;
		}

		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			event.preventDefault();
			const length = isGrouped(question) ? question.groups.length : question.options.length;
			cursor = (cursor + (event.key === "ArrowDown" ? 1 : length - 1)) % length;
			redraw();
		}
	});

	function redraw() {
		const root = document.getElementById("root");
		root.innerHTML = render(current);
		afterRender(current, root);
	}

	cp.onMessage("quiz/results", function () {
		celebrated = false;
	});

	cp.mount({
		initialState: undefined,
		render: render,
		afterRender: afterRender,
		onAction: function (action, detail) {
			if (action === "pick") {
				pickFlat(detail.key);
				if (current && current.question && current.question.kind === "single") {
					submit();
				} else {
					redraw();
				}
			} else if (action === "pickGroup") {
				if (current && !current.feedback) {
					selection[Number(detail.group)] = detail.key;
					cursor = Number(detail.group);
					redraw();
				}
			} else if (action === "submit") {
				submit();
			} else if (action === "next") {
				cp.post("quiz/next");
			} else if (action === "finish") {
				cp.post("quiz/finish");
			} else if (action === "retry") {
				cp.post("quiz/retryMissed");
			} else if (action === "back") {
				cp.post("command/backToDashboard", { examId: examId });
			} else if (action === "source" && detail.href) {
				cp.post("command/openSource", { url: detail.href });
			}
		},
	});
})();
