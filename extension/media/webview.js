/* Shared webview runtime: one vscode api handle, a postMessage helper, and a mount convention. */
(function () {
	"use strict";

	const vscode = typeof acquireVsCodeApi === "function" ? acquireVsCodeApi() : undefined;
	const handlers = new Map();

	function post(type, payload) {
		if (!vscode) {
			return;
		}
		vscode.postMessage(payload === undefined ? { type: type } : Object.assign({ type: type }, payload));
	}

	function onMessage(type, handler) {
		handlers.set(type, handler);
	}

	window.addEventListener("message", function (event) {
		const message = event && event.data;
		if (!message || typeof message.type !== "string") {
			return;
		}
		const handler = handlers.get(message.type);
		if (handler) {
			handler(message);
		}
	});

	function escapeHtml(value) {
		return String(value === undefined || value === null ? "" : value).replace(/[&<>"']/g, function (char) {
			return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
		});
	}

	/**
	 * Renders `render(state)` into #root and re-runs it on every `state/update`.
	 * Clicks are delegated by `data-action` so re-renders never need re-binding.
	 */
	function mount(options) {
		const root = document.getElementById("root");
		let state = options.initialState;

		function draw() {
			root.innerHTML = options.render(state);
			if (options.afterRender) {
				options.afterRender(state, root);
			}
		}

		root.addEventListener("click", function (event) {
			const target = event.target.closest("[data-action]");
			if (!target) {
				return;
			}
			event.preventDefault();
			const detail = {};
			for (const name of Object.keys(target.dataset)) {
				if (name !== "action") {
					detail[name] = target.dataset[name];
				}
			}
			options.onAction(target.dataset.action, detail, target);
		});

		onMessage("state/update", function (message) {
			state = message.state;
			draw();
		});

		if (options.messages) {
			for (const type of Object.keys(options.messages)) {
				onMessage(type, options.messages[type]);
			}
		}

		draw();
		post("webview/ready");
	}

	const reducedMotion =
		typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	/** Short gold/cyan burst used when something is unlocked. No-op under reduced motion. */
	function celebrate(originElement) {
		if (reducedMotion) {
			return;
		}
		const rect = originElement
			? originElement.getBoundingClientRect()
			: { left: window.innerWidth / 2, top: window.innerHeight / 3, width: 0, height: 0 };
		const layer = document.createElement("div");
		layer.className = "cp-burst";
		const colors = ["#ffb02e", "#ffe0a3", "#45e6cf", "#9b6dff"];
		for (let i = 0; i < 22; i += 1) {
			const spark = document.createElement("i");
			spark.className = "cp-spark";
			const angle = (Math.PI * 2 * i) / 22 + Math.random();
			const distance = 40 + Math.random() * 70;
			spark.style.left = rect.left + rect.width / 2 + "px";
			spark.style.top = rect.top + rect.height / 2 + "px";
			spark.style.background = colors[i % colors.length];
			spark.style.setProperty("--cp-dx", Math.cos(angle) * distance + "px");
			spark.style.setProperty("--cp-dy", Math.sin(angle) * distance + "px");
			spark.style.animationDelay = i * 8 + "ms";
			layer.appendChild(spark);
		}
		document.body.appendChild(layer);
		window.setTimeout(function () {
			layer.remove();
		}, 1600);
	}

	window.certPrep = {
		post: post,
		onMessage: onMessage,
		mount: mount,
		escapeHtml: escapeHtml,
		celebrate: celebrate,
		reducedMotion: reducedMotion,
	};
})();
