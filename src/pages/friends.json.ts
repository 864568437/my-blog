import type { APIRoute } from "astro";
import { getEnabledFriends } from "@/config/friendsConfig";

/**
 * 友链数据 JSON 端点
 * 供 check-flink 仓库读取，自动维护友链列表
 *
 * 访问地址：https://fqzlr.com/friends.json
 * 输出格式：与 check-flink 兼容的标准 JSON
 */
export const GET: APIRoute = () => {
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
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Cache-Control": "public, max-age=300, s-maxage=300",
			},
		},
	);
};
