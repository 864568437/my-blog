/**
 * AI 对话代理 —— 把前端对话转发到 CC Switch 里的 Claude 自定义配置
 * --------------------------------------------------------------
 * 与 github-proxy.js 同构：平台无关的 handleAiProxy(request, env)，
 * 由 Cloudflare Worker / Vercel Edge / 本地 dev 中间件三面接入。
 *
 * 为什么要服务端代理：AISearch.svelte 是浏览器组件，任何写进前端的
 * token 都会被打进 bundle 公开可见。上游密钥（AI_API_KEY）只能由本
 * 代理持有，浏览器永远只跟同源的 /api/ai-chat 说话。
 *
 * 双格式：AI_API_FORMAT=anthropic（默认，官方 SDK）| openai（原生 fetch）。
 * 无论上游是哪种，代理一律向浏览器吐归一化 SSE：
 *   data: {"text":"增量"}\n\n   ...多条...
 *   data: {"error":"信息"}\n\n  （出错时）
 *   data: [DONE]\n\n            （结束）
 * 这样前端只认一种格式，以后换供应商完全不用动前端。
 *
 * 环境变量（对应 CC Switch 的 Claude 自定义配置）：
 *   AI_BASE_URL     上游 base URL（root，不带 /v1）—— ANTHROPIC_BASE_URL
 *   AI_API_KEY      上游 token（机密）             —— ANTHROPIC_AUTH_TOKEN / ANTHROPIC_API_KEY
 *   AI_MODEL        上游模型 id                     —— ANTHROPIC_MODEL
 *   AI_API_FORMAT   anthropic（默认）| openai
 *   AI_AUTH_STYLE   bearer（默认，Authorization: Bearer）| x-api-key
 *   AI_MAX_TOKENS   默认 4096，硬上限 8192
 *   AI_SYSTEM_PROMPT 覆盖内置系统提示词
 *   AI_THINKING     adaptive 时开启扩展思考（仅真 Anthropic 端点支持）
 */

import Anthropic from "@anthropic-ai/sdk";

// ---- 硬上限（滥用防护）----
const MSG_MAX_CHARS = 8000; // 单条消息字符上限
const TOTAL_MAX_CHARS = 32000; // 全部消息合计字符上限
const HISTORY_MAX = 40; // 历史消息条数上限
const MAX_TOKENS_CAP = 8192; // max_tokens 硬上限

const DEFAULT_SYSTEM_PROMPT =
	"你是这个个人博客的 AI 助手，用简洁友好的中文回答访客的问题。" +
	"如果不确定答案，就如实说明，不要编造。";

function corsHeaders(extra = {}) {
	return {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
		"Access-Control-Max-Age": "86400",
		...extra,
	};
}

function jsonResponse(data, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json", ...corsHeaders() },
	});
}

/** 单条归一化 SSE 事件 */
function sseData(obj) {
	return `data: ${JSON.stringify(obj)}\n\n`;
}

/** 流式响应统一头 */
function sseHeaders() {
	return {
		"Content-Type": "text/event-stream; charset=utf-8",
		"Cache-Control": "no-cache, no-transform",
		"X-Accel-Buffering": "no", // 禁止反代缓冲，保证逐字下发
		...corsHeaders(),
	};
}

function hasConfig(env) {
	return !!(env?.AI_BASE_URL && env.AI_API_KEY && env.AI_MODEL);
}

/**
 * 同源校验：浏览器对 POST/PUT/DELETE（即便同源）都会带 Origin，
 * 因此要求 Origin 存在且 host 与请求 host 一致即可挡住裸 curl 滥用，
 * 又不影响本站 UI 的正常请求。
 */
function isSameOrigin(request) {
	const origin = request.headers.get("Origin");
	if (!origin) return false;
	try {
		return new URL(origin).host === new URL(request.url).host;
	} catch {
		return false;
	}
}

/** OpenAI 端点 URL：避免 /v1 重复 */
function openaiUrl(base) {
	const b = base.replace(/\/+$/, "");
	if (/\/chat\/completions$/.test(b)) return b;
	if (/\/v1$/.test(b)) return `${b}/chat/completions`;
	return `${b}/v1/chat/completions`;
}

/**
 * 清洗前端传来的消息：只保留 user/assistant + 字符串 content，
 * 截断超长内容，限制历史条数，并保证首条为 user。
 */
function sanitizeMessages(raw) {
	if (!Array.isArray(raw)) return { error: "messages 必须是数组" };
	let total = 0;
	const cleaned = [];
	for (const m of raw) {
		if (!m || (m.role !== "user" && m.role !== "assistant")) continue;
		const content = typeof m.content === "string" ? m.content : "";
		if (!content.trim()) continue;
		const clipped = content.slice(0, MSG_MAX_CHARS);
		total += clipped.length;
		cleaned.push({ role: m.role, content: clipped });
	}
	// 只保留最近 HISTORY_MAX 条
	const trimmed = cleaned.slice(-HISTORY_MAX);
	// 去掉开头连续的 assistant，保证首条为 user
	while (trimmed.length && trimmed[0].role !== "user") trimmed.shift();
	if (trimmed.length === 0) return { error: "没有有效的用户消息" };
	if (total > TOTAL_MAX_CHARS) return { error: "对话内容过长，请精简后重试" };
	return { messages: trimmed };
}

function resolveMaxTokens(env) {
	const n = Number(env.AI_MAX_TOKENS) || 4096;
	return Math.min(Math.max(1, n), MAX_TOKENS_CAP);
}

export async function handleAiProxy(request, env) {
	if (request.method === "OPTIONS") {
		return new Response(null, { status: 204, headers: corsHeaders() });
	}

	// GET → 状态检查（供前端探测是否已配置）
	if (request.method === "GET") {
		return jsonResponse({
			ok: true,
			status: "proxy-ready",
			configured: hasConfig(env),
			format: env?.AI_API_FORMAT || "anthropic",
			model: env?.AI_MODEL || "",
		});
	}

	if (request.method !== "POST") {
		return jsonResponse({ error: "Method not allowed" }, 405);
	}

	// 同源防护
	if (!isSameOrigin(request)) {
		return jsonResponse({ error: "Forbidden" }, 403);
	}

	if (!hasConfig(env)) {
		return jsonResponse(
			{
				error: "AI 代理未配置",
				detail: "缺少 AI_BASE_URL / AI_API_KEY / AI_MODEL 环境变量",
			},
			503,
		);
	}

	let payload;
	try {
		payload = await request.json();
	} catch {
		return jsonResponse({ error: "Invalid JSON body" }, 400);
	}

	const parsed = sanitizeMessages(payload?.messages);
	if (parsed.error) return jsonResponse({ error: parsed.error }, 400);

	const messages = parsed.messages;
	const system = env.AI_SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT;
	const maxTokens = resolveMaxTokens(env);
	const model = env.AI_MODEL;
	const format = (env.AI_API_FORMAT || "anthropic").toLowerCase();

	try {
		if (format === "openai") {
			return await streamOpenAI({ env, model, system, messages, maxTokens });
		}
		return await streamAnthropic({
			request,
			env,
			model,
			system,
			messages,
			maxTokens,
		});
	} catch (e) {
		return jsonResponse(
			{ error: "上游请求失败", message: e?.message || String(e) },
			502,
		);
	}
}

/* ========== Anthropic 分支：官方 SDK ========== */
async function streamAnthropic({ env, model, system, messages, maxTokens }) {
	const authStyle = (env.AI_AUTH_STYLE || "bearer").toLowerCase();
	const clientOpts = { baseURL: env.AI_BASE_URL };
	if (authStyle === "x-api-key") clientOpts.apiKey = env.AI_API_KEY;
	else clientOpts.authToken = env.AI_API_KEY;

	const client = new Anthropic(clientOpts);

	const body = { model, max_tokens: maxTokens, system, messages };
	if ((env.AI_THINKING || "").toLowerCase() === "adaptive") {
		body.thinking = { type: "adaptive" };
	}

	const upstream = client.messages.stream(body);
	const encoder = new TextEncoder();

	const readable = new ReadableStream({
		async start(controller) {
			try {
				for await (const event of upstream) {
					if (
						event.type === "content_block_delta" &&
						event.delta &&
						event.delta.type === "text_delta"
					) {
						controller.enqueue(
							encoder.encode(sseData({ text: event.delta.text })),
						);
					}
				}
				controller.enqueue(encoder.encode("data: [DONE]\n\n"));
			} catch (e) {
				controller.enqueue(
					encoder.encode(sseData({ error: e?.message || String(e) })),
				);
				controller.enqueue(encoder.encode("data: [DONE]\n\n"));
			} finally {
				controller.close();
			}
		},
		cancel() {
			// 浏览器断开时中止上游，避免继续计费
			try {
				upstream.abort();
			} catch {}
		},
	});

	return new Response(readable, { headers: sseHeaders() });
}

/* ========== OpenAI 分支：原生 fetch ========== */
async function streamOpenAI({ env, model, system, messages, maxTokens }) {
	const url = openaiUrl(env.AI_BASE_URL);
	const authStyle = (env.AI_AUTH_STYLE || "bearer").toLowerCase();
	const headers = { "Content-Type": "application/json" };
	if (authStyle === "x-api-key") headers["api-key"] = env.AI_API_KEY;
	else headers.Authorization = `Bearer ${env.AI_API_KEY}`;

	const upstream = await fetch(url, {
		method: "POST",
		headers,
		body: JSON.stringify({
			model,
			max_tokens: maxTokens,
			stream: true,
			messages: [{ role: "system", content: system }, ...messages],
		}),
	});

	if (!upstream.ok || !upstream.body) {
		const text = await upstream.text().catch(() => "");
		return jsonResponse(
			{
				error: "上游返回错误",
				status: upstream.status,
				detail: text.slice(0, 500),
			},
			502,
		);
	}

	const encoder = new TextEncoder();
	const decoder = new TextDecoder();
	const reader = upstream.body.getReader();
	let buffer = "";

	const readable = new ReadableStream({
		async start(controller) {
			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split("\n");
					buffer = lines.pop() || "";
					for (const line of lines) {
						const trimmed = line.trim();
						if (!trimmed.startsWith("data:")) continue;
						const data = trimmed.slice(5).trim();
						if (data === "[DONE]") continue;
						try {
							const json = JSON.parse(data);
							const delta = json.choices?.[0]?.delta?.content;
							if (delta) {
								controller.enqueue(encoder.encode(sseData({ text: delta })));
							}
						} catch {
							// 忽略无法解析的行（心跳/注释等）
						}
					}
				}
				controller.enqueue(encoder.encode("data: [DONE]\n\n"));
			} catch (e) {
				controller.enqueue(
					encoder.encode(sseData({ error: e?.message || String(e) })),
				);
				controller.enqueue(encoder.encode("data: [DONE]\n\n"));
			} finally {
				controller.close();
			}
		},
		cancel() {
			try {
				reader.cancel();
			} catch {}
		},
	});

	return new Response(readable, { headers: sseHeaders() });
}
