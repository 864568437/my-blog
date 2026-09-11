/**
 * Cloudflare Worker 入口
 * 静态资源由 ASSETS 绑定（dist/）直接服务，Worker 处理两个动态接口：
 *   - /api/github   在线编辑代理（github-proxy.js）
 *   - /api/ai-chat  AI 对话代理（ai-proxy.js）
 * 认证逻辑复用平台无关的 handler（同时支持服务端 GitHub App 认证）
 */
import { handleAiProxy } from "./ai-proxy.js";
import { handleGithubProxy } from "./github-proxy.js";

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		// 归一化尾部斜杠：/api/github/ 与 /api/github 等价
		const pathname = url.pathname.replace(/\/+$/, "") || "/";
		if (pathname === "/api/github") {
			return handleGithubProxy(request, env);
		}
		if (pathname === "/api/ai-chat") {
			return handleAiProxy(request, env);
		}
		return env.ASSETS.fetch(request);
	},
};
