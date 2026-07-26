import { getCollection } from "astro:content";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import {
	dynamicSearchText,
	dynamicSlug,
	sortDynamics,
} from "@/utils/dynamic-utils";
import { profileConfig } from "@/config";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const markdownImagePattern = /!\[([^\]]*)\]\((\S+?)(?:\s+["']([^"']*)["'])?\)/g;

/** 从 src/content/dynamic.json 读取编辑器写入的条目（与 markdown 源合并） */
function loadJsonEntries(): any[] {
	try {
		const jsonPath = resolve(process.cwd(), "src/content/dynamic.json");
		if (!existsSync(jsonPath)) return [];
		const raw = readFileSync(jsonPath, "utf-8");
		const items = JSON.parse(raw);
		if (!Array.isArray(items)) return [];
		// 过滤草稿和已删除条目
		return items.filter((item: any) => !item._draft && !item._deleted);
	} catch {
		return [];
	}
}

export async function GET() {
	const processor = await createMarkdownProcessor();
	const dynamics = sortDynamics(await getCollection("dynamic"));

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
			};
		}),
	);

	// 合并 dynamic.json 中不与 markdown 重复的条目
	const mdIds = new Set(mdData.map((d) => d.id));
	const jsonEntries = loadJsonEntries();
	const jsonData = await Promise.all(
		jsonEntries
			.filter((item: any) => !mdIds.has(item.id))
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
