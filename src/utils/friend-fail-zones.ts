/**
 * 失效友链分区分组工具（纯函数，无副作用）
 * 用于将 check-flink result.json 中的 link_status 按 fail_count 分组
 *
 * 在 friends.astro 客户端脚本中复用，单元测试用 node:test
 */

export type FriendStatusItem = {
	name: string;
	link: string;
	latency?: number;
	fail_count?: number;
	has_author_link?: boolean;
	linkpage?: string;
	siteshot?: string;
};

export type FriendItem = {
	name: string;
	link: string;
	avatar?: string;
	desc?: string;
	siteshot?: string;
	fail_count?: number;
};

export type FailZoneRanges = {
	failWindow: [number, number];
	tombstone: [number, number];
};

/** 判断 fail_count 是否落在 [min, max] 区间内 */
export function inRange(n: number, range: [number, number]): boolean {
	if (!Array.isArray(range) || range.length < 2) return false;
	const [min, max] = range;
	return n >= min && n <= max;
}

/**
 * 把 link_status[] 按 failZones 阈值拆成两桶：failWindow（失效暂留）和 tombstone（友链墓碑）
 * 内部各自按 fail_count 降序排序
 */
export function groupByFailCount(
	list: FriendStatusItem[],
	ranges: FailZoneRanges
): { failWindow: FriendStatusItem[]; tombstone: FriendStatusItem[] } {
	const failWindowList: FriendStatusItem[] = [];
	const tombstoneList: FriendStatusItem[] = [];
	for (const it of list || []) {
		const c = it.fail_count || 0;
		if (inRange(c, ranges.failWindow)) failWindowList.push(it);
		else if (inRange(c, ranges.tombstone)) tombstoneList.push(it);
	}
	const sortDesc = (a: FriendStatusItem, b: FriendStatusItem) =>
		(b.fail_count || 0) - (a.fail_count || 0);
	failWindowList.sort(sortDesc);
	tombstoneList.sort(sortDesc);
	return { failWindow: failWindowList, tombstone: tombstoneList };
}

/**
 * 把总友链（总来源）+ fail_count 映射分到三个**互不重复**的分区：
 *   normal:    fail_count === 0
 *   failWindow: fail_count in [1, 6]
 *   tombstone:  fail_count >= 7
 *
 * 互斥保证：每个友链恰好落入一个分区。failMap 中无记录的友链视为 fail_count=0（默认正常）。
 *
 * @param friends   总友链列表（来自 friendsConfig，含 name/link/avatar/desc/siteshot）
 * @param failMap   link → fail_count 映射（来自 check-flink result.json）
 * @param ranges    failWindow/tombstone 区间
 * @returns         { normal, failWindow, tombstone }，三组互不重复
 */
export function partitionAll(
	friends: FriendItem[],
	failMap: Map<string, number> | Record<string, number>,
	ranges: FailZoneRanges
): { normal: FriendItem[]; failWindow: FriendItem[]; tombstone: FriendItem[] } {
	const failLookup =
		failMap instanceof Map
			? (link: string) => failMap.get(link) || 0
			: (link: string) => (failMap && (failMap as any)[link]) || 0;

	const norm = (u: string) => (u || "").replace(/\/$/, "").trim();

	const normal: FriendItem[] = [];
	const failWindow: FriendItem[] = [];
	const tombstone: FriendItem[] = [];

	for (const f of friends || []) {
		if (!f || !f.link) continue;
		const fc = failLookup(norm(f.link)) || 0;
		const tagged: FriendItem = { ...f, fail_count: fc };
		if (inRange(fc, ranges.failWindow)) failWindow.push(tagged);
		else if (inRange(fc, ranges.tombstone)) tombstone.push(tagged);
		else normal.push(tagged); // 0 或负数 → 正常
	}
	const sortDesc = (a: FriendItem, b: FriendItem) =>
		(b.fail_count || 0) - (a.fail_count || 0);
	failWindow.sort(sortDesc);
	tombstone.sort(sortDesc);
	return { normal, failWindow, tombstone };
}
