import * as assert from "assert";
import {
	CERTIFICATE_HEIGHT,
	CERTIFICATE_WIDTH,
	certificateFileBase,
	certificateNode,
	longDate,
	renderCertificateHtml,
	type CertificateInput,
} from "../certificates/certificateTemplate";

function input(over: Partial<CertificateInput> = {}): CertificateInput {
	return {
		displayName: "Varun Patkar",
		examCode: "AZ-104",
		examTitle: "Azure Administrator Associate",
		domainId: "2",
		domainName: "Implement and manage storage",
		date: "2026-03-14",
		accuracy: 0.86,
		daysCompleted: 7,
		vendor: "Microsoft",
		...over,
	};
}

describe("renderCertificateHtml", () => {
	it("produces a self-contained document", () => {
		const html = renderCertificateHtml(input());
		assert.ok(html.startsWith("<!DOCTYPE html>"));
		assert.ok(html.includes('<style id="cert-style">'));
		assert.ok(html.includes('id="cert"'));
		assert.ok(!html.includes("<link"), "a certificate must not depend on an external stylesheet");
		assert.ok(!html.includes("<script"), "the document itself carries no script");
	});

	it("contains every field it was handed", () => {
		const html = renderCertificateHtml(input());
		assert.ok(html.includes("Varun Patkar"));
		assert.ok(html.includes("AZ-104"));
		assert.ok(html.includes("Azure Administrator Associate"));
		assert.ok(html.includes("Implement and manage storage"));
		assert.ok(html.includes("Microsoft"));
		assert.ok(html.includes("14 March 2026"));
		assert.ok(html.includes("86%"));
		assert.ok(html.includes("7"));
	});

	it("draws its ornament as inline svg at a fixed print size", () => {
		const html = renderCertificateHtml(input());
		assert.ok(html.includes("<svg"));
		assert.ok(html.includes("<polygon"), "the guilloche is vector, not an image");
		assert.ok(html.includes(`width="${CERTIFICATE_WIDTH}"`));
		assert.ok(html.includes(`height="${CERTIFICATE_HEIGHT}"`));
	});

	it("is deterministic for the same input", () => {
		assert.strictEqual(renderCertificateHtml(input()), renderCertificateHtml(input()));
	});

	it("varies the ornament between domains", () => {
		const one = certificateNode(input({ domainId: "1" }));
		const two = certificateNode(input({ domainId: "2" }));
		assert.notStrictEqual(one, two);
	});

	it("escapes a display name carrying a script tag", () => {
		const html = renderCertificateHtml(input({ displayName: '<script>alert("pwned")</script>' }));
		assert.ok(!html.includes("<script>"), "user text must never become markup");
		assert.ok(!html.includes("</script>"));
		assert.ok(html.includes("&lt;script&gt;"));
	});

	it("escapes every other user-controlled field too", () => {
		const html = renderCertificateHtml(
			input({
				examCode: '"><img src=x onerror=alert(1)>',
				examTitle: "<b>bold</b>",
				domainName: "Storage & <em>files</em>",
				vendor: "<i>vendor</i>",
			})
		);
		assert.ok(!html.includes("<img src=x"));
		assert.ok(!html.includes("<b>bold</b>"));
		assert.ok(!html.includes("<em>files</em>"));
		assert.ok(html.includes("&amp;"));
	});

	it("falls back to friendly copy for empty text", () => {
		const html = renderCertificateHtml(input({ displayName: "   ", domainName: "" }));
		assert.ok(html.includes("A Determined Candidate"));
		assert.ok(html.includes("Domain 2"));
	});

	it("clamps a nonsense accuracy instead of printing it", () => {
		assert.ok(renderCertificateHtml(input({ accuracy: 4 })).includes("100%"));
		assert.ok(renderCertificateHtml(input({ accuracy: -1 })).includes("0%"));
		assert.ok(renderCertificateHtml(input({ accuracy: Number.NaN })).includes("0%"));
	});
});

describe("longDate", () => {
	it("spells the month out", () => {
		assert.strictEqual(longDate("2026-03-14"), "14 March 2026");
		assert.strictEqual(longDate("2026-12-01"), "1 December 2026");
	});

	it("passes anything unparseable straight through", () => {
		assert.strictEqual(longDate("not a date"), "not a date");
		assert.strictEqual(longDate(""), "");
	});
});

describe("certificateFileBase", () => {
	it("builds a predictable, path-safe file stem", () => {
		assert.strictEqual(certificateFileBase("2"), "domain-2");
		assert.strictEqual(certificateFileBase("Manage Identity"), "domain-manage-identity");
	});

	it("refuses to escape its folder", () => {
		assert.strictEqual(certificateFileBase("../../etc/passwd"), "domain-etc-passwd");
		assert.strictEqual(certificateFileBase("   "), "domain-unknown");
	});
});
