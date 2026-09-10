import { getCollection } from "astro:content";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import { profileConfig } from "@/config";
import {
	dynamicSearchText,
	dynamicSlug,
	sortDynamics,
} from "@/utils/dynamic-utils";

const markdownImagePattern = /!\[([^\]]*)\]\((\S+?)(?:\s+["']([^"']*)["'])?\)/g;

/**
 * 从 src/content/dynamic.json 读取编辑器写入的条目（与 markdown 源合并）。
 * 不在此过滤 _draft/_deleted：_deleted 墓碑用于隐藏 markdown 源的对应条目，
 * 过滤逻辑由 GET 统一处理。
 */
function loadJsonEntries(): any[] {
	try {
		const jsonPath = resolve(process.cwd(), "src/content/dynamic.json");
		if (!existsSync(jsonPath)) return [];
		const raw = readFileSync(jsonPath, "utf-8");
		const items = JSON.parse(raw);
		if (!Array.isArray(items)) return [];
		return items;
	} catch {
		return [];
	}
}

export async function GET() {
	const processor = await createMarkdownProcessor();
	const jsonEntries = loadJsonEntries();
	// 已删除条目的墓碑 id：markdown 源同名条目也一并隐藏
	// （在线编辑器不删 md 文件，删除状态只记录在 dynamic.json）
	const deletedIds = new Set(
		jsonEntries
			.filter((item: any) => item._deleted)
			.map((item: any) => String(item.id)),
	);
	const dynamics = sortDynamics(await getCollection("dynamic")).filter(
		(entry) => !deletedIds.has(dynamicSlug(entry.id)),
	);

	// 从 markdown 源构建数据
	const mdData = await Promise.all(
		dynamics.map(async (entry) => {
			const images: Array<{ alt: string; src: string; title?: string }> = [];
			const rawBody = entry.body || "";
			const markdown = rawBody.replace(
				markdownImagePattern,
				(_match, alt: string, src: string, title?: string) => {
					images.push({ alt, src, ...(title ? { title } : {}) });
					return "";
				},
			);
			const rendered = await processor.render(markdown);

			return {
				id: dynamicSlug(entry.id),
				published: entry.data.published.getTime(),
				html: rendered.code,
				body: rawBody,
				images,
				searchText: dynamicSearchText(entry),
				pinned: entry.data.pinned || false,
				tags: entry.data.tags || [],
				location: entry.data.location || "",
				device: entry.data.device || "",
				author: entry.data.author || profileConfig.name || "",
				avatar: entry.data.avatar || profileConfig.avatar || "",
				// 数据来源标记：编辑器据此决定删除时是否需要留墓碑
				source: "md" as const,
			};
		}),
	);

	// 合并 dynamic.json 中不与 markdown 重复的条目（排除草稿与已删墓碑）
	const mdIds = new Set(mdData.map((d) => d.id));
	const jsonData = await Promise.all(
		jsonEntries
			.filter(
				(item: any) => !item._draft && !item._deleted && !mdIds.has(item.id),
			)
			.map(async (item: any) => {
				const images: Array<{ alt: string; src: string; title?: string }> = [];
				const rawBody = item.body || "";
				const markdown = rawBody.replace(
					markdownImagePattern,
					(_match: string, alt: string, src: string, title?: string) => {
						images.push({ alt, src, ...(title ? { title } : {}) });
						return "";
					},
				);
				const rendered = await processor.render(markdown);
				return {
					id: item.id,
					published: new Date(item.published).getTime(),
					html: rendered.code,
					body: rawBody,
					images,
					searchText: `${item.body || ""} ${(item.tags || []).join(" ")}`,
					pinned: item.pinned || false,
					tags: item.tags || [],
					location: item.location || "",
					device: item.device || "",
					author: item.author || profileConfig.name || "",
					avatar: item.avatar || profileConfig.avatar || "",
					source: "json" as const,
				};
			}),
	);

	// 合并并排序（置顶优先，时间倒序）
	const data = [...mdData, ...jsonData].sort((a, b) => {
		if (a.pinned && !b.pinned) return -1;
		if (!a.pinned && b.pinned) return 1;
		return b.published - a.published;
	});

	return new Response(JSON.stringify(data), {
		headers: {
			"Content-Type": "application/json; charset=utf-8",
		},
	});
}
