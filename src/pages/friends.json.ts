import type { APIRoute } from "astro";
import { parseFriendsConfigFromTS } from "@/utils/parseFriendsConfig";

/**
 * 友链数据 JSON 端点
 * 供 check-flink 仓库读取，自动维护友链列表
 *
 * 访问地址：https://blog.fqzlr.top/friends.json
 * 输出格式：与 check-flink 兼容的标准 JSON
 *
 * 数据源策略：
 * 1. 优先从 GitHub raw 实时拉取最新 friendsConfig.ts，解析后返回
 * 2. 失败时降级到本地编译的静态数据（import 方式）
 * 3. 缓存缩短到 60s，让变更更快生效
 */

const GITHUB_RAW_TS_URL =
	"https://raw.githubusercontent.com/fqzlr/fqzlr-bk/main/src/config/friendsConfig.ts";

export const GET: APIRoute = async () => {
	try {
		// 1. 从 GitHub raw 拉取最新的 friendsConfig.ts
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 5000);

		const resp = await fetch(GITHUB_RAW_TS_URL, {
			signal: controller.signal,
		});
		clearTimeout(timeout);

		if (!resp.ok) {
			throw new Error(`GitHub raw HTTP ${resp.status}`);
		}

		const tsContent = await resp.text();

		// 2. 用正则解析 TS 内容，提取 friendsConfig 数组
		const friends = parseFriendsConfigFromTS(tsContent);

		if (friends.length === 0) {
			throw new Error("解析结果为空，降级到本地数据");
		}

		// 3. 构建与 check-flink 兼容的 JSON 输出
		const linkList = friends
			.filter((f) => f.enabled !== false)
			.map((f) => ({
				name: f.title,
				link: f.siteurl.trim(),
				avatar: f.imgurl,
				descr: f.desc,
				siteshot: "",
				linkpage: f.linkpage?.trim() || "",
			}));

		return new Response(
			JSON.stringify({
				link_list: linkList,
				length: linkList.length,
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json; charset=utf-8",
					// 缩短缓存时间，让变更更快生效
					"Cache-Control": "public, max-age=60, s-maxage=60",
				},
			},
		);
	} catch (error) {
		// 4. 失败时降级到本地编译的静态数据
		console.warn(
			"[friends.json] GitHub raw 获取失败，降级到本地数据:",
			error instanceof Error ? error.message : String(error),
		);

		const { getEnabledFriends } = await import("@/config/friendsConfig");
		const friends = getEnabledFriends();
		const linkList = friends.map((f) => ({
			name: f.title,
			link: f.siteurl.trim(),
			avatar: f.imgurl,
			descr: f.desc,
			siteshot: "",
			linkpage: f.linkpage?.trim() || "",
		}));

		return new Response(
			JSON.stringify({
				link_list: linkList,
				length: linkList.length,
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json; charset=utf-8",
					"Cache-Control": "public, max-age=60, s-maxage=60",
				},
			},
		);
	}
};