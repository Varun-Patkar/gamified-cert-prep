/**
 * Pure certificate document. No fs, no vscode, no DOM — just a self-contained HTML string.
 *
 * Aesthetic: an engraved security document. Deep indigo plate, gold lathe-work,
 * a guilloche rosette drawn as inline SVG, Didone display type and letterpress small caps.
 * It has to survive being printed and pinned to a wall, so everything is vector.
 */

export interface CertificateInput {
	displayName: string;
	examCode: string;
	examTitle: string;
	domainId: string;
	domainName: string;
	/** ISO date, yyyy-mm-dd. */
	date: string;
	/** 0-1. */
	accuracy: number;
	daysCompleted?: number;
	vendor?: string;
	/** Overrides for the whole-exam certificate; domain certificates leave both unset. */
	eyebrow?: string;
	lead?: string;
}

const WIDTH = 1400;
const HEIGHT = 990;

const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

export function certificateFileBase(domainId: string): string {
	const slug = String(domainId)
		.normalize("NFKD")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return `domain-${slug.length > 0 ? slug : "unknown"}`;
}

export const CERTIFICATE_WIDTH = WIDTH;
export const CERTIFICATE_HEIGHT = HEIGHT;

export function renderCertificateHtml(input: CertificateInput): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(input.examCode)} — ${escapeHtml(input.domainName)}</title>
<style id="cert-style">${certificateCss()}</style>
</head>
<body>
${certificateNode(input)}
</body>
</html>`;
}

/** The sized root node on its own — what the rasterizer wraps in a foreignObject. */
export function certificateNode(input: CertificateInput): string {
	const name = escapeHtml(orFallback(input.displayName, "A Determined Candidate"));
	const code = escapeHtml(orFallback(input.examCode, "EXAM"));
	const examTitle = escapeHtml(orFallback(input.examTitle, "Certification Campaign"));
	const domain = escapeHtml(orFallback(input.domainName, `Domain ${input.domainId}`));
	const vendor = escapeHtml(orFallback(input.vendor, "Cert Prep"));
	const accuracy = Math.round(clamp01(input.accuracy) * 100);
	const days = Math.max(0, Math.floor(input.daysCompleted ?? 0));
	const seed = hash(`${input.domainId}|${input.examCode}`);

	return `<article class="cert" id="cert">
${plate(seed)}
<div class="cert-inner">
	<header class="cert-head">
		<div class="cert-head-row">
			<span class="cert-rule"></span>
			<span class="cert-vendor">${vendor}</span>
			<span class="cert-rule"></span>
		</div>
		<p class="cert-eyebrow">${escapeHtml(orFallback(input.eyebrow, "Certificate of Domain Mastery"))}</p>
	</header>
	<p class="cert-awarded">This is to certify that</p>
	<h1 class="cert-name">${name}</h1>
	<p class="cert-body">${escapeHtml(orFallback(input.lead, "has completed every scheduled session of the domain"))}</p>
	<h2 class="cert-domain">${domain}</h2>
	<p class="cert-body cert-body--wide">within the <strong>${code}</strong> &middot; ${examTitle} campaign,<br />
	sustaining an assessed accuracy of <strong>${accuracy}%</strong>${days > 0 ? ` across <strong>${days}</strong> study day${days === 1 ? "" : "s"}` : ""}.</p>
	<footer class="cert-foot">
		<div class="cert-sig">
			<span class="cert-sig-line"></span>
			<span class="cert-sig-label">Issued</span>
			<span class="cert-sig-value">${escapeHtml(longDate(input.date))}</span>
		</div>
		${seal(code, accuracy)}
		<div class="cert-sig cert-sig--right">
			<span class="cert-sig-line"></span>
			<span class="cert-sig-label">Domain</span>
			<span class="cert-sig-value">${escapeHtml(orFallback(input.domainId, "—"))}</span>
		</div>
	</footer>
</div>
</article>`;
}

/** Engine-turned plate: lathe border, corner rosettes and a central guilloche, all deterministic. */
function plate(seed: number): string {
	const cx = WIDTH / 2;
	const cy = HEIGHT / 2 + 24;
	const rings = [
		rosette(cx, cy, 320, 17 + (seed % 6), 84, 0.07),
		rosette(cx, cy, 252, 23 + (seed % 5), 62, 0.06),
		rosette(cx, cy, 186, 11 + (seed % 7), 48, 0.055),
		rosette(cx, cy, 120, 29 + (seed % 4), 30, 0.05),
	].join("");
	const corners = [
		[92, 92],
		[WIDTH - 92, 92],
		[92, HEIGHT - 92],
		[WIDTH - 92, HEIGHT - 92],
	]
		.map(([x, y]) => rosette(x, y, 40, 7 + (seed % 5), 16, 0.3))
		.join("");

	return `<svg class="cert-plate" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs>
	<linearGradient id="cert-field" x1="0" y1="0" x2="1" y2="1">
		<stop offset="0%" stop-color="#170c31" />
		<stop offset="46%" stop-color="#0d0720" />
		<stop offset="100%" stop-color="#05030f" />
	</linearGradient>
	<linearGradient id="cert-gold" x1="0" y1="0" x2="1" y2="1">
		<stop offset="0%" stop-color="#ffe6b0" />
		<stop offset="42%" stop-color="#ffb02e" />
		<stop offset="100%" stop-color="#a4640a" />
	</linearGradient>
	<radialGradient id="cert-halo" cx="50%" cy="34%" r="62%">
		<stop offset="0%" stop-color="#6b3fd6" stop-opacity="0.42" />
		<stop offset="100%" stop-color="#6b3fd6" stop-opacity="0" />
	</radialGradient>
	<pattern id="cert-lathe" width="24" height="24" patternUnits="userSpaceOnUse">
		<path d="M0 12 q6 -9 12 0 t12 0" fill="none" stroke="#ffb02e" stroke-opacity="0.5" stroke-width="1" />
	</pattern>
</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#cert-field)" />
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#cert-halo)" />
<g fill="none" stroke="url(#cert-gold)" stroke-width="1">${rings}${corners}</g>
<rect x="28" y="28" width="${WIDTH - 56}" height="${HEIGHT - 56}" fill="none" stroke="url(#cert-gold)" stroke-width="3" rx="6" />
<rect x="45" y="45" width="${WIDTH - 90}" height="${HEIGHT - 90}" fill="none" stroke="url(#cert-lathe)" stroke-width="16" />
<rect x="58" y="58" width="${WIDTH - 116}" height="${HEIGHT - 116}" fill="none" stroke="#ffb02e" stroke-opacity="0.6" stroke-width="1" rx="3" />
<rect x="66" y="66" width="${WIDTH - 132}" height="${HEIGHT - 132}" fill="none" stroke="#45e6cf" stroke-opacity="0.24" stroke-width="1" rx="2" />
</svg>`;
}

/** Closed epitrochoid traced as a polygon — the classic banknote lathe curve. */
function rosette(cx: number, cy: number, radius: number, petals: number, arm: number, opacity: number): string {
	const lobes = Math.max(5, Math.floor(petals));
	const steps = Math.min(1440, lobes * 42);
	const points: string[] = [];
	for (let i = 0; i < steps; i += 1) {
		const t = (i / steps) * Math.PI * 2;
		const x = radius * Math.cos(t) + arm * Math.cos(lobes * t);
		const y = radius * Math.sin(t) - arm * Math.sin(lobes * t);
		points.push(`${round(cx + x)},${round(cy + y)}`);
	}
	return `<polygon points="${points.join(" ")}" stroke-opacity="${opacity}" />`;
}

function seal(code: string, accuracy: number): string {
	return `<div class="cert-seal">
	<svg viewBox="0 0 200 200" width="150" height="150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
		<defs>
			<linearGradient id="cert-seal-gold" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0%" stop-color="#ffe6b0" />
				<stop offset="48%" stop-color="#ffb02e" />
				<stop offset="100%" stop-color="#8f5305" />
			</linearGradient>
		</defs>
		<circle cx="100" cy="100" r="74" fill="url(#cert-seal-gold)" />
		<circle cx="100" cy="100" r="74" fill="none" stroke="#3a1f00" stroke-opacity="0.35" stroke-width="2" />
		<circle cx="100" cy="100" r="62" fill="none" stroke="#3a1f00" stroke-opacity="0.4" stroke-width="1" />
		<circle cx="100" cy="100" r="56" fill="none" stroke="#3a1f00" stroke-opacity="0.22" stroke-width="6" stroke-dasharray="2 7" />
		${rayBurst()}
	</svg>
	<span class="cert-seal-text"><b>${accuracy}%</b><small>${code}</small></span>
</div>`;
}

function rayBurst(): string {
	const spikes: string[] = [];
	for (let i = 0; i < 32; i += 1) {
		const angle = (Math.PI * 2 * i) / 32;
		const x1 = 100 + Math.cos(angle) * 74;
		const y1 = 100 + Math.sin(angle) * 74;
		const x2 = 100 + Math.cos(angle) * 84;
		const y2 = 100 + Math.sin(angle) * 84;
		spikes.push(
			`<line x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}" stroke="url(#cert-seal-gold)" stroke-width="6" stroke-linecap="round" />`
		);
	}
	return spikes.join("");
}

function certificateCss(): string {
	return `
:root { color-scheme: dark; }
html, body { margin: 0; padding: 0; background: #05030f; }
body { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
.cert {
	position: relative;
	flex: 0 0 auto;
	width: ${WIDTH}px;
	height: ${HEIGHT}px;
	overflow: hidden;
	color: #f3ecff;
	font-family: "Bodoni MT", Didot, "Big Caslon", Georgia, "Times New Roman", serif;
	background: #05030f;
}
.cert-plate { position: absolute; inset: 0; display: block; }
.cert-inner {
	position: absolute;
	inset: 60px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 130px 92px 210px;
	text-align: center;
}
.cert-head {
	position: absolute;
	top: 46px;
	left: 92px;
	right: 92px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
}
.cert-head-row { display: flex; align-items: center; gap: 18px; width: 100%; justify-content: center; }
.cert-rule { flex: 1 1 auto; height: 1px; background: linear-gradient(90deg, transparent, #ffb02e, transparent); }
.cert-vendor {
	font-family: Optima, "Gill Sans MT", "Trebuchet MS", sans-serif;
	font-size: 15px;
	letter-spacing: 0.44em;
	text-transform: uppercase;
	color: #ffd48a;
	white-space: nowrap;
}
.cert-eyebrow {
	margin: 0;
	font-family: Optima, "Gill Sans MT", "Trebuchet MS", sans-serif;
	font-size: 13px;
	letter-spacing: 0.5em;
	text-transform: uppercase;
	color: #45e6cf;
}
.cert-awarded { margin: 0; font-size: 21px; font-style: italic; color: #cbbde8; }
.cert-name {
	margin: 6px 0 0;
	font-size: 84px;
	line-height: 1.06;
	font-weight: 400;
	letter-spacing: -0.015em;
	color: #fff3d6;
	text-shadow: 0 2px 0 rgba(0,0,0,0.55), 0 0 34px rgba(255,176,46,0.34);
	max-width: 100%;
	overflow-wrap: break-word;
}
.cert-body { margin: 22px 0 0; font-size: 20px; line-height: 1.7; color: #cbbde8; }
.cert-body--wide { max-width: 74ch; }
.cert-body strong { color: #ffd48a; font-weight: 400; }
.cert-domain {
	margin: 14px 0 0;
	font-size: 42px;
	font-weight: 400;
	letter-spacing: 0.02em;
	color: #45e6cf;
	border-bottom: 1px solid rgba(69,230,207,0.4);
	padding-bottom: 12px;
	max-width: 100%;
	overflow-wrap: break-word;
}
.cert-foot {
	position: absolute;
	bottom: 46px;
	left: 92px;
	right: 92px;
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 40px;
}
.cert-sig { display: flex; flex-direction: column; align-items: flex-start; width: 260px; }
.cert-sig--right { align-items: flex-end; }
.cert-sig-line { width: 100%; height: 1px; background: linear-gradient(90deg, transparent, #ffb02e, transparent); margin-bottom: 10px; }
.cert-sig-label {
	font-family: Optima, "Gill Sans MT", "Trebuchet MS", sans-serif;
	font-size: 11px;
	letter-spacing: 0.34em;
	text-transform: uppercase;
	color: rgba(243,236,255,0.5);
}
.cert-sig-value { font-size: 20px; color: #f3ecff; margin-top: 4px; }
.cert-seal { position: relative; width: 150px; height: 150px; flex: 0 0 auto; }
.cert-seal svg { display: block; }
.cert-seal-text {
	position: absolute;
	inset: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	color: #3a1f00;
}
.cert-seal-text b { font-size: 32px; font-weight: 400; line-height: 1; }
.cert-seal-text small {
	font-family: Optima, "Gill Sans MT", "Trebuchet MS", sans-serif;
	font-size: 10px;
	letter-spacing: 0.22em;
	text-transform: uppercase;
	margin-top: 4px;
}
@media print {
	@page { size: ${WIDTH}px ${HEIGHT}px; margin: 0; }
	body { min-height: auto; }
}
`;
}

export function longDate(iso: string): string {
	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ""));
	if (!match) {
		return String(iso ?? "");
	}
	const month = MONTHS[Number(match[2]) - 1];
	return month ? `${Number(match[3])} ${month} ${match[1]}` : String(iso);
}

function orFallback(value: string | undefined, fallback: string): string {
	const text = String(value ?? "").trim();
	return text.length > 0 ? text : fallback;
}

function hash(value: string): number {
	let out = 2166136261;
	for (let i = 0; i < value.length; i += 1) {
		out ^= value.charCodeAt(i);
		out = Math.imul(out, 16777619);
	}
	return Math.abs(out);
}

function round(value: number): number {
	return Math.round(value * 100) / 100;
}

function clamp01(value: number): number {
	if (!Number.isFinite(value)) {
		return 0;
	}
	return Math.min(1, Math.max(0, value));
}

/** User-controlled text lands in this document; nothing goes in unescaped. */
export function escapeHtml(value: string): string {
	return String(value ?? "").replace(/[&<>"']/g, (char) => {
		switch (char) {
			case "&":
				return "&amp;";
			case "<":
				return "&lt;";
			case ">":
				return "&gt;";
			case '"':
				return "&quot;";
			default:
				return "&#39;";
		}
	});
}
