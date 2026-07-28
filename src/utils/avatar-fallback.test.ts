/**
 * 头像三级容错链测试（Node 18+ 自带 test runner，无外部依赖）
 * 运行：node --test --import tsx src/utils/avatar-fallback.test.ts
 *
 * 也可纯 Node 跑（无 tsx 时手动改后缀 .mjs 并删 import type 注解）
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
	dicebearUrl,
	inlineSvgAvatar,
	googleFaviconUrl,
	fallbackAvatar,
	onErrorFirstJump,
	onErrorSecondJump,
} from "./avatar-fallback.ts";

describe("dicebearUrl", () => {
	it("builds a stable URL with lowercase seed", () => {
		const url = dicebearUrl("  Hello  ");
		assert.equal(url, "https://api.dicebear.com/7.x/notionists/svg?seed=hello");
	});
	it("encodes special characters in seed", () => {
		const url = dicebearUrl("hello world & friends");
		assert.equal(url, "https://api.dicebear.com/7.x/notionists/svg?seed=hello%20world%20%26%20friends");
	});
	it("uses 'guest' as default when seed is empty/undefined/null", () => {
		assert.equal(dicebearUrl(""), "https://api.dicebear.com/7.x/notionists/svg?seed=guest");
		assert.equal(dicebearUrl(undefined), "https://api.dicebear.com/7.x/notionists/svg?seed=guest");
		assert.equal(dicebearUrl(null), "https://api.dicebear.com/7.x/notionists/svg?seed=guest");
	});
	it("preserves unicode characters via encodeURIComponent", () => {
		const url = dicebearUrl("小陆ya");
		assert.equal(url, "https://api.dicebear.com/7.x/notionists/svg?seed=%E5%B0%8F%E9%99%86ya");
	});
});

describe("inlineSvgAvatar", () => {
	// helper: 解码 data URI 后再断言
	const decode = (svg: string) => decodeURIComponent(svg.replace(/^data:image\/svg\+xml;utf8,/, ""));

	it("returns a data URI", () => {
		const svg = inlineSvgAvatar("test");
		assert.ok(svg.startsWith("data:image/svg+xml;utf8,"));
	});
	it("uses first char (uppercased) as text", () => {
		const decoded = decode(inlineSvgAvatar("alice"));
		assert.ok(decoded.includes(">A<"));
	});
	it("handles Chinese name (first char)", () => {
		const decoded = decode(inlineSvgAvatar("小陆ya"));
		assert.ok(decoded.includes(">小<"));
	});
	it("uses '?' when name is empty/undefined/null", () => {
		const d1 = decode(inlineSvgAvatar(""));
		const d2 = decode(inlineSvgAvatar(undefined));
		const d3 = decode(inlineSvgAvatar(null));
		assert.ok(d1.includes(">?<"));
		assert.ok(d2.includes(">?<"));
		assert.ok(d3.includes(">?<"));
	});
	it("uses whitespace-trimmed first non-empty char", () => {
		const decoded = decode(inlineSvgAvatar("  Bob  "));
		assert.ok(decoded.includes(">B<"));
	});
	it("hash produces stable color for same name", () => {
		const a = inlineSvgAvatar("Alice");
		const b = inlineSvgAvatar("Alice");
		assert.equal(a, b);
	});
	it("different names may produce different colors (not strict, but stable)", () => {
		const a = inlineSvgAvatar("A");
		const b = inlineSvgAvatar("B");
		// A=65 → hue=65, B=66 → hue=66, 颜色应不同
		assert.notEqual(a, b);
	});
	it("respects custom size", () => {
		const decoded = decode(inlineSvgAvatar("test", 120));
		assert.ok(decoded.includes('viewBox="0 0 120 120"'));
		assert.ok(decoded.includes('width="120"'));
	});
	it("is URL-encoded in raw data URI", () => {
		const svg = inlineSvgAvatar("test");
		// data URI 中应该没有未编码的 < > 字符（encodeURIComponent 会转义）
		assert.ok(!svg.includes("<text"));
		assert.ok(svg.includes("%3Ctext"));
	});
	it("contains no <script> or dangerous tags", () => {
		const decoded = decode(inlineSvgAvatar("test"));
		assert.ok(!decoded.toLowerCase().includes("<script"));
		assert.ok(!decoded.toLowerCase().includes("onerror="));
	});
});

describe("googleFaviconUrl", () => {
	it("builds Google favicon URL with given size", () => {
		const url = googleFaviconUrl("example.com", 64);
		assert.equal(url, "https://www.google.com/s2/favicons?domain=example.com&sz=64");
	});
	it("strips leading www.", () => {
		const url = googleFaviconUrl("www.example.com", 32);
		assert.equal(url, "https://www.google.com/s2/favicons?domain=example.com&sz=32");
	});
	it("falls back to inline SVG when host is empty", () => {
		const url = googleFaviconUrl("");
		assert.ok(url.startsWith("data:image/svg+xml;utf8,"));
	});
	it("falls back to inline SVG when host is null/undefined", () => {
		const a = googleFaviconUrl(null);
		const b = googleFaviconUrl(undefined);
		assert.ok(a.startsWith("data:image/svg+xml;utf8,"));
		assert.ok(b.startsWith("data:image/svg+xml;utf8,"));
	});
});

describe("fallbackAvatar (SSR initial pick)", () => {
	it("prefers userAvatar when present and non-empty", () => {
		const url = fallbackAvatar("alice", "https://example.com/a.png");
		assert.equal(url, "https://example.com/a.png");
	});
	it("trims whitespace around userAvatar", () => {
		const url = fallbackAvatar("alice", "   https://example.com/a.png   ");
		assert.equal(url, "https://example.com/a.png");
	});
	it("falls back to dicebear when userAvatar is empty", () => {
		const url = fallbackAvatar("alice", "");
		assert.equal(url, "https://api.dicebear.com/7.x/notionists/svg?seed=alice");
	});
	it("falls back to dicebear when userAvatar is undefined", () => {
		const url = fallbackAvatar("alice");
		assert.equal(url, "https://api.dicebear.com/7.x/notionists/svg?seed=alice");
	});
});

describe("onErrorFirstJump / onErrorSecondJump (img onerror chain)", () => {
	it("first jump returns dicebear URL", () => {
		const url = onErrorFirstJump("alice");
		assert.equal(url, "https://api.dicebear.com/7.x/notionists/svg?seed=alice");
	});
	it("second jump returns inline SVG data URI (always works)", () => {
		const url = onErrorSecondJump("alice");
		assert.ok(url.startsWith("data:image/svg+xml;utf8,"));
	});
	it("handles null/undefined in onerror jumps", () => {
		assert.ok(onErrorFirstJump(null).includes("seed=guest"));
		assert.ok(onErrorSecondJump(undefined).startsWith("data:image/svg+xml;utf8,"));
	});
});

describe("three-level fallback chain end-to-end", () => {
	it("userAvatar → dicebear → inlineSvg (all reachable)", () => {
		const name = "Alice";
		const userAvatar = "https://example.com/avatar.png";
		// 1) SSR 选择 userAvatar
		const initial = fallbackAvatar(name, userAvatar);
		assert.equal(initial, userAvatar);
		// 2) 失败后切到 dicebear
		const first = onErrorFirstJump(name);
		assert.equal(first, dicebearUrl(name));
		// 3) 再失败后切到内联 SVG
		const second = onErrorSecondJump(name);
		assert.ok(second.startsWith("data:image/svg+xml;utf8,"));
		// 4) 三个值互不相同（userAvatar 是 https, dicebear 是 svg api, inline 是 data URI）
		assert.notEqual(initial, first);
		assert.notEqual(first, second);
		assert.notEqual(initial, second);
	});
});
