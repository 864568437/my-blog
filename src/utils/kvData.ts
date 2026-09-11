/**
 * KV 数据客户端工具 —— 编辑器读写 /api/data/* 的封装
 * --------------------------------------------------------------
 * 配合 src/workers/kv-data.js 的 Worker API 使用：
 *   fetchKvData(type)   读（失败返回 null，调用方回落 SSR/DOM 收集）
 *   putKvData(type, d)  写（内部处理 token 获取 + 错误提示）
 *   getKvAuthToken()    取写入 token（客户端凭据优先，server-auth 走 /api/data/auth）
 *   announceKvUpdate()  广播 kv:data-updated 事件（页面脚本监听后同帧重渲染）
 */

import { getAuthToken, showToast } from "./editMode";

export type KvDataType = "friends" | "notebooks" | "routines";

export interface KvFriendsData {
	items: any[];
	updatedAt?: string;
	updatedBy?: string;
}
export interface KvNotebooksData {
	folders: any[];
	notes: any[];
	updatedAt?: string;
	updatedBy?: string;
}
export interface KvRoutinesData {
	items: any[];
	updatedAt?: string;
	updatedBy?: string;
}

/** token 内存缓存（installation token 有效期 1h，这里缓存 50 分钟） */
let cachedToken: { token: string; at: number } | null = null;
const TOKEN_TTL_MS = 50 * 60 * 1000;

export async function getKvAuthToken(): Promise<string | null> {
	if (cachedToken && Date.now() - cachedToken.at < TOKEN_TTL_MS) {
		return cachedToken.token;
	}
	// 客户端凭据模式（浏览器导入过 PEM）：getAuthToken 返回 JWT 换的 token
	try {
		const clientToken = await getAuthToken();
		if (clientToken) {
			cachedToken = { token: clientToken, at: Date.now() };
			return clientToken;
		}
	} catch {
		// 无客户端凭据，走 server-auth
	}
	// server-auth 模式：Worker 用 GH_PRIVATE_KEY 签发 installation token
	try {
		const resp = await fetch("/api/data/auth", { cache: "no-store" });
		if (resp.ok) {
			const data = await resp.json();
			if (data?.token) {
				cachedToken = { token: data.token, at: Date.now() };
				return data.token;
			}
		}
	} catch {}
	return null;
}

/** 读取 KV 数据；失败（未配置/KV 空/网络）返回 null */
export async function fetchKvData<T>(type: KvDataType): Promise<T | null> {
	try {
		const resp = await fetch(`/api/data/${type}`, { cache: "no-store" });
		if (!resp.ok) return null;
		return (await resp.json()) as T;
	} catch {
		return null;
	}
}

/** 写入 KV 数据；成功返回 true，失败弹 toast 并返回 false */
/** 数一份数据的条目数（items 或 folders+notes 合计）；非数组形状返回 -1 */
function countEntries(d: unknown): number {
	const o = d as Record<string, unknown>;
	if (Array.isArray(o?.items)) return o.items.length;
	if (Array.isArray(o?.folders) && Array.isArray(o?.notes))
		return o.folders.length + o.notes.length;
	return -1;
}

export async function putKvData(
	type: KvDataType,
	data: unknown,
): Promise<boolean> {
	// 空数据保护：提交空列表会整体清掉线上数据（KV last-write-wins 无版本控制）。
	// 编辑器加载失败（KV 拉取异常回落空 DOM 收集）时曾把整表写空，这里强制确认。
	const newCount = countEntries(data);
	if (newCount === 0) {
		const current = await fetchKvData(type);
		const currentCount = countEntries(current);
		if (currentCount > 0) {
			const ok = confirm(
				`提交的数据是空列表，将清空线上现有的 ${currentCount} 条「${type}」数据且无法恢复。确定继续吗？`,
			);
			if (!ok) {
				showToast("已取消提交（空数据保护）", "info");
				return false;
			}
		}
	}
	const token = await getKvAuthToken();
	if (!token) {
		showToast("未获取到写入凭据（GitHub App 未配置）", "error");
		return false;
	}
	try {
		const resp = await fetch(`/api/data/${type}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(data),
		});
		if (resp.ok) return true;
		const err = await resp.json().catch(() => ({}));
		showToast(
			`提交失败（HTTP ${resp.status}）：${err?.error || "未知错误"}`,
			"error",
		);
		return false;
	} catch (e: any) {
		showToast(`提交出错：${e?.message || String(e)}`, "error");
		return false;
	}
}

/** 广播数据更新：三个页面的刷新脚本监听后同帧重渲染（无 reload） */
export function announceKvUpdate(type: KvDataType, data: unknown): void {
	window.dispatchEvent(
		new CustomEvent("kv:data-updated", { detail: { type, data } }),
	);
}
