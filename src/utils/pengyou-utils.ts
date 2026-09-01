/**
 * 朋友圈（/pengyou/）数据抓取与整形工具
 * 供 pengyou.astro 页面使用
 */
import { type PengyouItem, pengyouConfig } from "@/config/pengyouConfig";

export type { PengyouItem };

function decodeHtmlEntities(str: string): string {
	const entities: { [key: string]: string } = {
		"&lt;": "<",
		"&gt;": ">",
		"&amp;": "&",
		"&quot;": '"',
		"&#39;": "'",
		"&nbsp;": " ",
	};
	return str.replace(/&[a-z]+;/gi, (match) => entities[match] || match);
}

export function parseRssItems(xml: string): {
	title: string;
	link: string;
	pubDate: string;
	description: string;
	content: string;
}[] {
	const results: {
		title: string;
		link: string;
		pubDate: string;
		description: string;
		content: string;
	}[] = [];

	const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
	let match;

	while ((match = itemRegex.exec(xml)) !== null) {
		const itemContent = match[1];

		const titleMatch = itemContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
		const linkMatch = itemContent.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
		const pubDateMatch = itemContent.match(
			/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i,
		);
		const descMatch = itemContent.match(
			/<description[^>]*>([\s\S]*?)<\/description>/i,
		);
		const contentMatch =
			itemContent.match(
				/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i,
			) || itemContent.match(/<encoded[^>]*>([\s\S]*?)<\/encoded>/i);

		let content = (
			contentMatch ? contentMatch[1] : descMatch ? descMatch[1] : ""
		).trim();
		content = decodeHtmlEntities(content);
		content = content.replace(/<[^>]*>/g, "");
		content = content.replace(/\s+/g, " ").trim();
		if (content.length > 200) {
			content = content.substring(0, 200) + "...";
		}

		let title = titleMatch ? titleMatch[1].trim() : "";
		title = decodeHtmlEntities(title);
		title = title.replace(/<[^>]*>/g, "");

		if (title && linkMatch) {
			results.push({
				title,
				link: linkMatch[1].trim(),
				pubDate: pubDateMatch ? pubDateMatch[1].trim() : "",
				description: descMatch
					? descMatch[1].replace(/<[^>]*>/g, "").trim()
					: "",
				content: content || "暂无内容",
			});
		}
	}

	return results;
}

async function fetchRss(url: string, author: string): Promise<PengyouItem[]> {
	try {
		const response = await fetch(url);
		if (!response.ok) return [];
		const xml = await response.text();

		const parsedItems = parseRssItems(xml);

		return parsedItems.map((item) => ({
			title: item.title,
			author,
			date: item.pubDate,
			link: item.link,
			content: item.content,
		}));
	} catch (e) {
		console.error(`Failed to fetch RSS from ${url}:`, e);
		return [];
	}
}

/**
 * 按 pengyouConfig 抓取全部 RSS 源并按时间倒序返回
 */
export async function fetchPengyouItems(): Promise<PengyouItem[]> {
	const { api, rss, data } = pengyouConfig;
	let items: PengyouItem[] = data;

	if (rss && rss.length > 0) {
		const rssItems: PengyouItem[] = [];
		for (const source of rss) {
			if (source.enabled !== false && source.url) {
				const fetched = await fetchRss(source.url, source.name);
				rssItems.push(...fetched);
			}
		}

		rssItems.sort((a, b) => {
			const dateA = new Date(a.date);
			const dateB = new Date(b.date);
			return dateB.getTime() - dateA.getTime();
		});

		items = rssItems;
	}

	if (api && items.length === 0) {
		try {
			const response = await fetch(api);
			if (response.ok) {
				items = await response.json();
			}
		} catch {
			console.error("Failed to fetch friends data from API");
		}
	}

	return items;
}

export function formatPengyouDate(dateString: string): string {
	const date = new Date(dateString);
	if (isNaN(date.getTime())) return "未知时间";

	const now = new Date();
	const diffTime = Math.abs(now.getTime() - date.getTime());
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

	if (diffDays === 0) return "今天";
	if (diffDays === 1) return "昨天";
	if (diffDays < 7) return `${diffDays}天前`;
	if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
	if (diffDays < 365) return `${Math.floor(diffDays / 30)}月前`;
	return `${Math.floor(diffDays / 365)}年前`;
}

export function getPengyouAvatar(item: PengyouItem): string {
	const domain = item.link.split("//")[1]?.split("/")[0] || "";
	return `https://icon.bqb.cool/?url=${domain}`;
}
