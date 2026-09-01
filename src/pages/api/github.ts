/**
 * GitHub API 代理 - Astro 服务端路由
 * 前端通过此接口转发 GitHub API 请求，解决 CORS 问题
 * 支持服务端 GitHub App 认证（通过环境变量配置）
 */

const GH_API = "https://api.github.com";
const GH_OWNER = import.meta.env?.PUBLIC_GITHUB_OWNER || "fqzlr";
const GH_REPO = import.meta.env?.PUBLIC_GITHUB_REPO || "my-blog";

function corsHeaders(): Record<string, string> {
	return {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
		"Access-Control-Allow-Headers":
			"Content-Type, Authorization, Accept, X-GitHub-Api-Version, User-Agent",
		"Access-Control-Max-Age": "86400",
	};
}

export async function OPTIONS() {
	return new Response(null, {
		status: 204,
		headers: corsHeaders(),
	});
}

export async function GET({ request }: { request: Request }) {
	const url = new URL(request.url);
	const path = url.searchParams.get("path");

	const hasServerAuth = !!(
		import.meta.env?.PUBLIC_GITHUB_APP_ID && import.meta.env?.GH_PRIVATE_KEY
	);
	const hasAppId = !!import.meta.env?.PUBLIC_GITHUB_APP_ID;

	if (!path) {
		return new Response(
			JSON.stringify({
				ok: true,
				status: "proxy-ready",
				serverAuth: hasServerAuth,
				hasAppId,
				appId: hasAppId ? import.meta.env.PUBLIC_GITHUB_APP_ID : "",
				message: hasServerAuth
					? "GitHub proxy with server-side auth is running."
					: hasAppId
						? "GitHub proxy is running. App ID available. Import PEM key to authenticate."
						: "GitHub proxy is running. Import your .pem key to authenticate.",
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
					...corsHeaders(),
				},
			},
		);
	}

	// 带 path 参数的 GET 请求：转发到 GitHub API
	const clientAuth =
		request.headers.get("Authorization") ||
		request.headers.get("authorization");
	const headers: Record<string, string> = {
		Accept: "application/vnd.github+json",
		"X-GitHub-Api-Version": "2022-11-28",
		"User-Agent": "Blog-Editor-Proxy",
	};
	if (clientAuth) {
		headers.Authorization = clientAuth;
	}

	return forwardRequest("GET", path, null, headers);
}

export async function POST({ request }: { request: Request }) {
	let body;
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
			status: 400,
			headers: { "Content-Type": "application/json", ...corsHeaders() },
		});
	}

	const { path, method, headers = {}, body: reqBody } = body;
	if (!path || typeof path !== "string") {
		return new Response(
			JSON.stringify({ error: "Missing 'path' field in request body" }),
			{
				status: 400,
				headers: { "Content-Type": "application/json", ...corsHeaders() },
			},
		);
	}

	const httpMethod = (method || "POST").toUpperCase();
	const extraHeaders: Record<string, string> = { ...headers };

	// 如果客户端没有提供 Authorization，尝试服务端认证
	const hasClientAuth = !!(headers.Authorization || headers.authorization);
	if (
		!hasClientAuth &&
		import.meta.env?.PUBLIC_GITHUB_APP_ID &&
		import.meta.env?.GH_PRIVATE_KEY
	) {
		// 简单起见，使用 Personal Access Token 方式（通过环境变量注入）
		// 完整的 GitHub App JWT 认证在 src/workers/github-proxy.js 中实现
		// 如果用户配置了 GH_TOKEN 环境变量，直接使用它
		if (import.meta.env?.GH_TOKEN) {
			extraHeaders.Authorization = `Bearer ${import.meta.env.GH_TOKEN}`;
		}
	}

	return forwardRequest(httpMethod, path, reqBody, extraHeaders);
}

export async function PUT({ request }: { request: Request }) {
	return POST({ request });
}

export async function PATCH({ request }: { request: Request }) {
	return POST({ request });
}

export async function DELETE({ request }: { request: Request }) {
	return POST({ request });
}

async function forwardRequest(
	method: string,
	path: string,
	reqBody: unknown,
	clientHeaders: Record<string, string>,
): Promise<Response> {
	try {
		const targetUrl = path.startsWith("http")
			? path
			: `${GH_API}/${path.replace(/^\//, "")}`;

		const headers: Record<string, string> = {
			Accept: "application/vnd.github+json",
			"X-GitHub-Api-Version": "2022-11-28",
			"User-Agent": "Blog-Editor-Proxy",
		};

		for (const [key, value] of Object.entries(clientHeaders)) {
			const lower = key.toLowerCase();
			if (lower === "host" || lower === "content-length") continue;
			if (typeof value === "string") {
				headers[key] = value;
			}
		}

		const fetchOpts: RequestInit = { method, headers };
		if (reqBody !== undefined && method !== "GET") {
			headers["Content-Type"] = headers["Content-Type"] || "application/json";
			fetchOpts.body =
				typeof reqBody === "string" ? reqBody : JSON.stringify(reqBody);
		}

		const resp = await fetch(targetUrl, fetchOpts);
		const text = await resp.text();

		const responseHeaders: Record<string, string> = {
			"Content-Type": resp.headers.get("Content-Type") || "application/json",
			...corsHeaders(),
		};

		return new Response(text, {
			status: resp.status,
			headers: responseHeaders,
		});
	} catch (e) {
		return new Response(
			JSON.stringify({
				error: "Proxy request failed",
				message: e instanceof Error ? e.message : String(e),
			}),
			{
				status: 502,
				headers: { "Content-Type": "application/json", ...corsHeaders() },
			},
		);
	}
}
