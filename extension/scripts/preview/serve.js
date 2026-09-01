/*
 * Static server for the preview pages. The Playwright relay refuses file:// URLs, and serving
 * over http also makes the shell's real `'self'` CSP behave the way it does in a webview.
 *
 *   node scripts/preview/serve.js [port]     -> http://127.0.0.1:5599/<kind>.html
 */
"use strict";

const fs = require("fs");
const http = require("http");
const path = require("path");

const OUT_DIR = path.join(__dirname, "out");
const MEDIA_DIR = path.resolve(__dirname, "..", "..", "media");
const PORT = Number(process.argv[2]) || 5599;

const TYPES = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".svg": "image/svg+xml",
	".png": "image/png",
};

function resolve(urlPath) {
	const clean = path.posix.normalize(decodeURIComponent(urlPath.split("?")[0]));
	if (clean.startsWith("/media/")) {
		return path.join(MEDIA_DIR, clean.slice("/media/".length));
	}
	return path.join(OUT_DIR, clean === "/" ? "index.html" : clean.slice(1));
}

http
	.createServer((request, response) => {
		// Keep the console clean: an unanswered favicon request logs as an error.
		if (request.url === "/favicon.ico") {
			response.writeHead(204).end();
			return;
		}
		const file = resolve(request.url ?? "/");
		// Never serve outside the two roots we intend to expose.
		if (!file.startsWith(OUT_DIR) && !file.startsWith(MEDIA_DIR)) {
			response.writeHead(403).end("forbidden");
			return;
		}
		fs.readFile(file, (error, body) => {
			if (error) {
				response.writeHead(404).end("not found");
				return;
			}
			response.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" });
			response.end(body);
		});
	})
	.listen(PORT, "127.0.0.1", () => {
		console.log(`preview server on http://127.0.0.1:${PORT}/`);
		for (const name of fs.readdirSync(OUT_DIR).filter((entry) => entry.endsWith(".html"))) {
			console.log(`  http://127.0.0.1:${PORT}/${name}`);
		}
	});
