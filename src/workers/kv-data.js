/**
 * KV 数据 API —— 友链/笔记本/日常规划的实时读写
 * --------------------------------------------------------------
 * 路由（由 src/workers/index.js 分发）：
 *   GET  /api/data/{friends|notebooks|routines}  读取（页面客户端 fetch）
 *   GET  /api/data/auth                           取 installation token（编辑器写入用）
 *   POST /api/data/{friends|notebooks|routines}  写入（需 GitHub token 验证）
 *   GET  /friends.json                            check-flink 兼容形状（取代旧 Astro 端点）
 *
 * KV 数据形状（key = `data:{type}`）：
 *   friends  → { items: FriendLink[],       updatedAt, updatedBy }
 *   notebooks→ { folders: [], notes: [],     updatedAt, updatedBy }
 *   routines → { items: RoutineItem[],       updatedAt, updatedBy }
 *
 * 设计约定（见仓库 KV 迁移方案）：
 *   - KV 是唯一活跃数据源，last-write-wins，无版本控制；
 *   - TS 配置文件冻结，仅作构建期 SSR 兜底与种子；
 *   - 读 30s 内存缓存（KV 边缘最终一致 ≤60s，30s 缓存不损新鲜度）；
 *   - 写鉴权：installation token 对目标仓库有 push 权限；
 *   - 不做乐观锁/限流（个人博客，token 验证即门槛）。
 */

import { corsHeaders, jsonResponse } from "./http-utils.js";
import { getInstallationTokenServer } from "./github-proxy.js";

const TYPES = ["friends", "notebooks", "routines"];
const KV_PREFIX = "data:";
const MEM_CACHE_MS = 30 * 1000;
const TOKEN_CACHE_MS = 5 * 60 * 1000;
const MAX_BODY_BYTES = 1024 * 1024; // 1MB
const MAX_ARRAY_LEN = 500;

// 模块级缓存（Worker isolate 生命周期内有效）
const memCache = new Map(); // type → { body: string, etag, expiry }
const tokenCache = new Map(); // token → { ok, ownerLogin, expiry }

/* ========== 读取 ========== */

async function readFromKv(env, type) {
	if (!env?.KV) return null;
	try {
		const raw = await env.KV.get(KV_PREFIX + type);
		if (!raw) return null;
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

async function getCached(type, env, force = false) {
	const now = Date.now();
	const hit = memCache.get(type);
	if (!force && hit && now < hit.expiry) return hit;
	const data = await readFromKv(env, type);
	if (!data) return null;
	const entry = {
		body: JSON.stringify(data),
		etag: `"${type}-${data.updatedAt || "seed"}"`,
		expiry: now + MEM_CACHE_MS,
	};
	memCache.set(type, entry);
	return entry;
}

/* ========== 写入鉴权 ========== */

/**
 * 验证 Bearer token 对目标仓库有 push 权限。
 * 用 GET /repos/{owner}/{repo}：一次调用同时验证 token 有效性 + 权限。
 * 结果缓存 5 分钟，避免每次写都打 GitHub。
 */
async function verifyWriteToken(env, token) {
	const cached = tokenCache.get(token);
	if (cached && Date.now() < cached.expiry) return cached;

	const owner = env?.PUBLIC_GITHUB_OWNER || "fqzlr";
	const repo = env?.PUBLIC_GITHUB_REPO || "my-blog";
	let result = { ok: false, ownerLogin: "" };
	try {
		const resp = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/vnd.github+json",
				"X-GitHub-Api-Version": "2022-11-28",
				"User-Agent": "Blog-KV-Proxy",
			},
		});
		if (resp.ok) {
			const data = await resp.json();
			if (data?.permissions?.push) {
				result = {
					ok: true,
					ownerLogin: data?.owner?.login || owner,
					expiry: Date.now() + TOKEN_CACHE_MS,
				};
			}
		}
	} catch {
		// 网络异常视为未通过
	}
	tokenCache.set(token, result);
	return result;
}

/* ========== payload 校验（克制：只查形状与必填字段） ========== */

const VALIDATORS = {
	friends: (d) =>
		Array.isArray(d.items) &&
		d.items.length <= MAX_ARRAY_LEN &&
		d.items.every(
			(i) => typeof i?.title === "string" && typeof i?.siteurl === "string",
		),
	notebooks: (d) =>
		Array.isArray(d.folders) &&
		Array.isArray(d.notes) &&
		d.folders.length <= MAX_ARRAY_LEN &&
		d.notes.length <= MAX_ARRAY_LEN &&
		d.folders.every(
			(f) => typeof f?.slug === "string" && typeof f?.name === "string",
		) &&
		d.notes.every(
			(n) =>
				typeof n?.id === "string" && typeof n?.folder === "string",
		),
	routines: (d) =>
		Array.isArray(d.items) &&
		d.items.length <= MAX_ARRAY_LEN &&
		d.items.every(
			(i) => typeof i?.id === "string" && typeof i?.name === "string",
		),
};

/* ========== 路由 handler ========== */

export async function handleDataApi(request, env) {
	if (request.method === "OPTIONS") {
		return new Response(null, { status: 204, headers: corsHeaders() });
	}

	const url = new URL(request.url);
	const segments = url.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
	// 期望形状：["api", "data", type] 或 ["api", "data", "auth"]
	const type = segments[2];

	// GET /api/data/auth —— 编辑器（server-auth 模式）获取 installation token。
	// 安全水位与现有 /api/github 代理等同（该代理本就为无凭据请求自动注入
	// 同一 token），这里只是把同样的能力显式暴露给编辑器。
	if (type === "auth" && request.method === "GET") {
		const token = await getInstallationTokenServer(env);
		if (!token) {
			return jsonResponse(
				{ error: "服务端未配置 GitHub App 凭据（GH_PRIVATE_KEY）" },
				503,
			);
		}
		return jsonResponse({ token });
	}

	if (!TYPES.includes(type)) {
		return jsonResponse(
			{ error: "未知数据类型", supported: TYPES },
			404,
		);
	}

	// ---------- GET：读取 ----------
	if (request.method === "GET") {
		const entry = await getCached(type, env);
		if (!entry) {
			// KV miss / 异常：503，页面脚本据此回落 SSR
			return jsonResponse({ error: "kv-unavailable" }, 503);
		}
		// ETag / 304（主要服务 /friends.json 等外部消费方）
		const inm = request.headers.get("If-None-Match");
		if (inm && inm === entry.etag) {
			return new Response(null, { status: 304, headers: { ETag: entry.etag, ...corsHeaders() } });
		}
		return new Response(entry.body, {
			status: 200,
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Cache-Control": "no-store",
				ETag: entry.etag,
				...corsHeaders(),
			},
		});
	}

	// ---------- POST：写入 ----------
	if (request.method === "POST") {
		const auth = request.headers.get("Authorization") || "";
		const token = auth.replace(/^Bearer\s+/i, "").trim();
		if (!token) {
			return jsonResponse({ error: "缺少 Authorization: Bearer token" }, 401);
		}
		const verified = await verifyWriteToken(env, token);
		if (!verified.ok) {
			return jsonResponse({ error: "token 无效或无仓库写权限" }, 401);
		}

		const contentLength = Number(request.headers.get("Content-Length") || 0);
		if (contentLength > MAX_BODY_BYTES) {
			return jsonResponse({ error: "payload 超过 1MB 上限" }, 413);
		}

		let payload;
		try {
			const text = await request.text();
			if (text.length > MAX_BODY_BYTES) {
				return jsonResponse({ error: "payload 超过 1MB 上限" }, 413);
			}
			payload = JSON.parse(text);
		} catch {
			return jsonResponse({ error: "Invalid JSON body" }, 400);
		}

		if (!VALIDATORS[type](payload)) {
			return jsonResponse(
				{ error: "数据结构校验失败（缺少必填字段或超出数量上限）" },
				400,
			);
		}

		const record = {
			...payload,
			updatedAt: new Date().toISOString(),
			updatedBy: verified.ownerLogin,
		};
		try {
			await env.KV.put(KV_PREFIX + type, JSON.stringify(record));
		} catch (e) {
			return jsonResponse(
				{ error: "KV 写入失败", message: e?.message || String(e) },
				500,
			);
		}

		// 立即失效内存缓存，下次读取直取 KV
		memCache.delete(type);
		return jsonResponse({ ok: true, type, updatedAt: record.updatedAt });
	}

	return jsonResponse({ error: "Method not allowed" }, 405);
}

/**
 * GET /friends.json —— check-flink 外部服务依赖的兼容形状。
 * 旧实现（src/pages/friends.json.ts，已删除）从 GitHub raw 拉 TS 源码解析；
 * 现在 KV 是唯一数据源，直接读 data:friends。
 */
export async function handleFriendsJson(request, env) {
	if (request.method === "OPTIONS") {
		return new Response(null, { status: 204, headers: corsHeaders() });
	}
	if (request.method !== "GET") {
		return jsonResponse({ error: "Method not allowed" }, 405);
	}

	const entry = await getCached("friends", env);
	if (!entry) {
		return jsonResponse({ error: "kv-unavailable" }, 503);
	}
	const data = JSON.parse(entry.body);
	const linkList = (data.items || [])
		.filter((f) => f.enabled !== false)
		.map((f) => ({
			name: f.title,
			link: f.siteurl,
			avatar: f.avatar,
			descr: f.description,
			siteshot: f.siteshot,
			linkpage: f.linkpage,
		}));

	return new Response(JSON.stringify({ link_list: linkList, length: linkList.length }), {
		status: 200,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "public, max-age=60",
			...corsHeaders(),
		},
	});
}
