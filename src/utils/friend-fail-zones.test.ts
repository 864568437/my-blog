/**
 * 失效友链分组逻辑测试（Node 18+ 自带 test runner，无外部依赖）
 * 运行：node --test --import tsx src/utils/friend-fail-zones.test.ts
 *
 * 也可纯 Node 跑（无 tsx 时手动改后缀 .mjs 并删 import type 注解）
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	groupByFailCount,
	inRange,
	partitionAll,
} from "./friend-fail-zones.ts";

describe("inRange", () => {
	it("returns true for n inside [min, max] (inclusive)", () => {
		assert.equal(inRange(1, [1, 6]), true);
		assert.equal(inRange(6, [1, 6]), true);
		assert.equal(inRange(3, [1, 6]), true);
	});
	it("returns false for n outside the range", () => {
		assert.equal(inRange(0, [1, 6]), false);
		assert.equal(inRange(7, [1, 6]), false);
		assert.equal(inRange(100, [1, 6]), false);
	});
	it("returns false for malformed range", () => {
		assert.equal(inRange(1, null as unknown as [number, number]), false);
		assert.equal(inRange(1, [] as unknown as [number, number]), false);
	});
});

describe("groupByFailCount", () => {
	const ranges = {
		failWindow: [1, 6] as [number, number],
		tombstone: [7, 9999] as [number, number],
	};
	const list = [
		{ name: "a-ok", link: "https://a/", fail_count: 0 },
		{ name: "b-1", link: "https://b/", fail_count: 1 },
		{ name: "c-6", link: "https://c/", fail_count: 6 },
		{ name: "d-7", link: "https://d/", fail_count: 7 },
		{ name: "e-15", link: "https://e/", fail_count: 15 },
		{ name: "f-2", link: "https://f/", fail_count: 2 },
	];

	it("separates fail_window vs tombstone by fail_count", () => {
		const { failWindow, tombstone } = groupByFailCount(list, ranges);
		assert.equal(
			failWindow
				.map((x) => x.name)
				.sort()
				.join(","),
			"b-1,c-6,f-2",
		);
		assert.equal(
			tombstone
				.map((x) => x.name)
				.sort()
				.join(","),
			"d-7,e-15",
		);
	});
	it("excludes fail_count = 0 from both buckets", () => {
		const { failWindow, tombstone } = groupByFailCount(list, ranges);
		assert.equal(
			[...failWindow, ...tombstone].some((x) => x.name === "a-ok"),
			false,
		);
	});
	it("sorts each bucket by fail_count desc", () => {
		const { failWindow, tombstone } = groupByFailCount(list, ranges);
		assert.deepEqual(
			failWindow.map((x) => x.fail_count),
			[6, 2, 1],
		);
		assert.deepEqual(
			tombstone.map((x) => x.fail_count),
			[15, 7],
		);
	});
	it("treats missing fail_count as 0", () => {
		const { failWindow, tombstone } = groupByFailCount(
			[{ name: "x", link: "https://x/" } as any],
			ranges,
		);
		assert.equal(failWindow.length, 0);
		assert.equal(tombstone.length, 0);
	});
	it("handles empty list", () => {
		const { failWindow, tombstone } = groupByFailCount([], ranges);
		assert.equal(failWindow.length, 0);
		assert.equal(tombstone.length, 0);
	});
	it("handles null list gracefully", () => {
		const { failWindow, tombstone } = groupByFailCount(null as any, ranges);
		assert.equal(failWindow.length, 0);
		assert.equal(tombstone.length, 0);
	});
});

describe("partitionAll (three zones, mutually exclusive)", () => {
	const ranges = {
		failWindow: [1, 6] as [number, number],
		tombstone: [7, 9999] as [number, number],
	};
	const friends = [
		{ name: "A", link: "https://a.com" },
		{ name: "B", link: "https://b.com" },
		{ name: "C", link: "https://c.com" },
		{ name: "D", link: "https://d.com" },
		{ name: "E", link: "https://e.com" },
	];
	const failMap = new Map<string, number>([
		["https://a.com", 0],
		["https://b.com", 3],
		["https://c.com", 6],
		["https://d.com", 7],
		["https://e.com", 15],
	]);

	it("partitions each friend into exactly one zone", () => {
		const { normal, failWindow, tombstone } = partitionAll(
			friends,
			failMap,
			ranges,
		);
		const total = normal.length + failWindow.length + tombstone.length;
		assert.equal(total, friends.length);
		assert.deepEqual(normal.map((x) => x.name).sort(), ["A"]);
		assert.deepEqual(failWindow.map((x) => x.name).sort(), ["B", "C"]);
		assert.deepEqual(tombstone.map((x) => x.name).sort(), ["D", "E"]);
	});
	it("zero fail_count → normal zone", () => {
		const { normal, failWindow, tombstone } = partitionAll(
			friends,
			failMap,
			ranges,
		);
		assert.ok(normal.every((x) => (x.fail_count || 0) === 0));
		assert.equal(failWindow.length + tombstone.length, 4);
	});
	it("fail_count missing in failMap → treated as 0 (normal)", () => {
		const { normal, failWindow, tombstone } = partitionAll(
			[{ name: "X", link: "https://x.com" }],
			new Map(),
			ranges,
		);
		assert.deepEqual(
			normal.map((x) => x.name),
			["X"],
		);
		assert.equal(failWindow.length, 0);
		assert.equal(tombstone.length, 0);
	});
	it("accepts plain object failMap (not just Map)", () => {
		const { failWindow, tombstone } = partitionAll(
			[
				{ name: "B", link: "https://b.com" },
				{ name: "D", link: "https://d.com" },
			],
			{ "https://b.com": 3, "https://d.com": 9 } as any,
			ranges,
		);
		assert.equal(failWindow.length, 1);
		assert.equal(tombstone.length, 1);
	});
	it("normalizes trailing slashes in links", () => {
		const { failWindow } = partitionAll(
			[{ name: "B", link: "https://b.com/" }],
			new Map([["https://b.com", 3]]),
			ranges,
		);
		assert.equal(failWindow.length, 1);
	});
	it("tags each item with its fail_count (sorted desc)", () => {
		const { failWindow, tombstone } = partitionAll(friends, failMap, ranges);
		assert.deepEqual(
			failWindow.map((x) => x.fail_count),
			[6, 3],
		); // 降序
		assert.deepEqual(
			tombstone.map((x) => x.fail_count),
			[15, 7],
		); // 降序
	});
});
