/**
 * AI 对话代理 —— dev 专用 Astro 路由
 * --------------------------------------------------------------
 * 仅本地开发时经 astro.config.mjs 的 aiProxyDevPlugin 调用。
 * 线上纯静态构建下本文件会被预渲染成死文件，实际由 Cloudflare Worker
 * （src/workers/index.js）或 Vercel Edge（api/ai-chat.js）接管。
 *
 * 注意：不要设置 prerender = false——本项目无 adapter（纯静态输出），
 * 与 api/github.ts 保持一致，否则构建直接报 NoAdapterInstalled。
 *
 * 这里负责把 import.meta.env 组装成 env，并预先用 content collections
 * 生成文章上下文（AI_POSTS_CONTEXT），让 handler 跳过自站点 fetch。
 */

import { getSortedPosts } from "@/utils/content-utils";
import { handleAiProxy } from "@/workers/ai-proxy.js";

function baseEnv() {
	return {
		AI_BASE_URL: import.meta.env?.AI_BASE_URL || "",
		AI_API_KEY: import.meta.env?.AI_API_KEY || "",
		AI_MODEL: import.meta.env?.AI_MODEL || "",
		AI_API_FORMAT: import.meta.env?.AI_API_FORMAT || "",
		AI_AUTH_STYLE: import.meta.env?.AI_AUTH_STYLE || "",
		AI_MAX_TOKENS: import.meta.env?.AI_MAX_TOKENS || "",
		AI_SYSTEM_PROMPT: import.meta.env?.AI_SYSTEM_PROMPT || "",
		AI_THINKING: import.meta.env?.AI_THINKING || "",
		AI_USER_AGENT: import.meta.env?.AI_USER_AGENT || "",
		AI_POSTS_CONTEXT: "" as string | undefined,
	};
}

/** 与 allPostMeta.json.ts 同构的元数据 → 注入 handler 的文章上下文 */
async function buildEnv() {
	const env = baseEnv();
	try {
		const posts = await getSortedPosts();
		const text = posts
			.filter((p) => p.data.title && !p.data.password)
			.map((p) => {
				const date = p.data.published?.toISOString().slice(0, 7) || "";
				const meta = [p.data.category, date].filter(Boolean).join(", ");
				return `- 《${p.data.title}》${meta ? `[${meta}]` : ""} /posts/${p.id}/ — ${p.data.description || "（无摘要）"}`;
			})
			.join("\n");
		if (text) env.AI_POSTS_CONTEXT = text;
	} catch {
		// content collections 不可用时留空，handler 会退回自站点 fetch
	}
	return env;
}

export async function GET({ request }: { request: Request }) {
	return handleAiProxy(request, await buildEnv());
}

export async function POST({ request }: { request: Request }) {
	return handleAiProxy(request, await buildEnv());
}

export async function OPTIONS({ request }: { request: Request }) {
	return handleAiProxy(request, baseEnv());
}
