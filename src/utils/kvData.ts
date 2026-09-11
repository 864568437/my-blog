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
export async function putKvData(
	type: KvDataType,
	data: unknown,
): Promise<boolean> {
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
