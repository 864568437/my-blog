/**
 * Cloudflare Worker 入口
 * 静态资源由 ASSETS 绑定（dist/）直接服务，Worker 只处理 /api/github 在线编辑代理
 * 认证逻辑复用 github-proxy.js（平台无关，支持服务端 GitHub App 认证）
 */
import { handleGithubProxy } from "./github-proxy.js";

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		// 归一化尾部斜杠：/api/github/ 与 /api/github 等价
		const pathname = url.pathname.replace(/\/+$/, "") || "/";
		if (pathname === "/api/github") {
			return handleGithubProxy(request, env);
		}
		return env.ASSETS.fetch(request);
	},
};
