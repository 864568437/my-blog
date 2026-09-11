/**
 * 草稿暂存辅助函数
 * 为各编辑器提供统一的草稿保存/恢复/提交逻辑
 */
import {
	clearDraftsByPage,
	createRepoFile,
	type DraftChange,
	getDraftsByPage,
	getRepoFile,
	registerSubmitHandler,
	saveDraft,
	showToast,
	updateRepoFile,
} from "./editMode";
import { announceKvUpdate, type KvDataType, putKvData } from "./kvData";

// ============ Repo 文件类型编辑器草稿辅助 ============

export interface RepoDraftContext {
	pageKey: string;
	pageName: string;
	getContent: () => string;
	setContent: (content: string) => void;
	getPath: () => string;
	getSha: () => string | null;
	setSha: (sha: string | null) => void;
	getOriginalContent: () => string;
	setOriginalContent: (content: string) => void;
	getCommitMsg?: (isEdit: boolean) => string;
	onSubmitted?: () => void;
}

export function setupRepoDrafts(ctx: RepoDraftContext) {
	const {
		pageKey,
		pageName,
		getContent,
		setContent,
		getPath,
		getSha,
		setSha,
		getOriginalContent,
		setOriginalContent,
		onSubmitted,
	} = ctx;

	function saveToDrafts(): DraftChange | null {
		const content = getContent();
		const original = getOriginalContent();
		if (content === original && getDraftsByPage(pageKey).length === 0) {
			showToast("没有需要暂存的更改", "info");
			return null;
		}
		clearDraftsByPage(pageKey);
		const isEdit = !!getSha() || !!original;
		const change = saveDraft({
			pageKey,
			pageName,
			description: isEdit ? `更新 ${pageName}` : `创建 ${pageName}`,
			operation: isEdit ? "update" : "create",
			payload: {
				type: "repo",
				path: getPath(),
				sha: getSha(),
				content,
				isEdit,
			},
		});
		showToast(`已暂存 ${pageName} 到本地`, "success");
		return change;
	}

	function restoreFromDrafts(): boolean {
		const drafts = getDraftsByPage(pageKey);
		if (drafts.length === 0) return false;
		const latest = drafts[drafts.length - 1];
		if (
			latest.payload?.type === "repo" &&
			latest.payload.content !== undefined
		) {
			setContent(String(latest.payload.content));
			showToast(`已恢复 ${pageName} 的暂存数据`, "info");
			return true;
		}
		return false;
	}

	async function doSubmit(
		content: string,
		sha: string | null,
		path: string,
		isEdit: boolean,
	): Promise<boolean> {
		let ok = false;
		try {
			let actualSha = sha;
			if (!actualSha) {
				// sha 缺失时先探测远端文件：已存在的文件不带 sha 直接 PUT 会被
				// GitHub 以 422 拒绝，必须改走 update
				const existing = await getRepoFile(path);
				if (existing?.sha) {
					actualSha = existing.sha;
				}
			}
			const effectiveIsEdit = isEdit || !!actualSha;
			const commitMsg = ctx.getCommitMsg
				? ctx.getCommitMsg(effectiveIsEdit)
				: effectiveIsEdit
					? `chore: update ${pageName}`
					: `chore: create ${pageName}`;
			if (actualSha) {
				ok = await updateRepoFile(path, content, actualSha, commitMsg);
			} else {
				ok = await createRepoFile(path, content, commitMsg);
			}
		} catch (error) {
			console.error("[RepoDrafts] doSubmit error:", error);
			showToast(
				`提交 ${pageName} 失败: ${error instanceof Error ? error.message : String(error)}`,
				"error",
			);
			return false;
		}
		if (ok) {
			setOriginalContent(content);
			try {
				const fresh = await getRepoFile(path);
				if (fresh) setSha(fresh.sha);
			} catch {}
			showToast(`${pageName} 已提交到 GitHub`, "success");
		} else {
			showToast(`提交 ${pageName} 失败`, "error");
		}
		return ok;
	}

	async function submitDrafts(): Promise<boolean> {
		const drafts = getDraftsByPage(pageKey);
		let contentToSubmit: string;
		let shaToUse: string | null;
		let pathToUse: string;
		let isEdit: boolean;
		if (drafts.length > 0) {
			const latest = drafts[drafts.length - 1];
			if (
				latest.payload?.type === "repo" &&
				latest.payload.content !== undefined
			) {
				contentToSubmit = String(latest.payload.content);
				shaToUse = (latest.payload.sha as string) || null;
				pathToUse = String(latest.payload.path || getPath());
				isEdit = !!latest.payload.isEdit;
			} else {
				return false;
			}
		} else {
			contentToSubmit = getContent();
			shaToUse = getSha();
			pathToUse = getPath();
			isEdit = !!shaToUse;
		}
		if (contentToSubmit === getOriginalContent() && shaToUse) {
			showToast("没有需要提交的更改", "info");
			return false;
		}
		const ok = await doSubmit(contentToSubmit, shaToUse, pathToUse, isEdit);
		if (ok) {
			clearDraftsByPage(pageKey);
			onSubmitted?.();
		}
		return ok;
	}

	registerSubmitHandler(pageKey, async (draft) => {
		if (draft.payload?.type === "repo" && draft.payload.content !== undefined) {
			const path = String(draft.payload.path || getPath());
			const isEdit = !!draft.payload.sha || !!draft.payload.isEdit;
			return doSubmit(
				String(draft.payload.content),
				(draft.payload.sha as string) || null,
				path,
				isEdit,
			);
		}
		return false;
	});

	function hasLocalChanges(): boolean {
		return (
			getDraftsByPage(pageKey).length > 0 ||
			getContent() !== getOriginalContent()
		);
	}

	return {
		saveToDrafts,
		restoreFromDrafts,
		submitDrafts,
		hasLocalChanges,
		clearDrafts: () => clearDraftsByPage(pageKey),
	};
}

// ============ KV 类型编辑器草稿辅助 ============
/**
 * 与 setupRepoDrafts 同构，但提交目标是 Cloudflare KV（/api/data/:type）
 * 而非 GitHub 文件。localStorage 草稿 / 侧边栏事件链 / hasChanges 判定
 * 全部复用同一套机制，仅 payload 与 doSubmit 不同：
 *   - 草稿 payload type: "kv"，content 为 JSON.stringify(data)
 *   - 提交成功后广播 kv:data-updated，页面同帧重渲染（不 reload）
 *   - 检测到旧 "repo" 草稿直接清除（格式已失效）
 *
 * 数据对象为浅比较（JSON.stringify 相等即无变更），编辑器侧应保证
 * getContent 返回的数据形状稳定（键序一致）。
 */
export interface KvDraftContext {
	pageKey: string;
	pageName: string;
	/** KV 数据类型，决定写入 /api/data/:type 与广播事件的 type */
	type: KvDataType;
	/** 当前编辑数据（对象，非序列化文本） */
	getContent: () => Record<string, unknown>;
	setContent: (data: Record<string, unknown>) => void;
	/** 变更前快照（对象） */
	getOriginalContent: () => Record<string, unknown>;
	setOriginalContent: (data: Record<string, unknown>) => void;
}

export function setupKvDrafts(ctx: KvDraftContext) {
	const {
		pageKey,
		pageName,
		type,
		getContent,
		setContent,
		getOriginalContent,
		setOriginalContent,
	} = ctx;

	const serialize = (d: Record<string, unknown>) => JSON.stringify(d, null, 2);

	function saveToDrafts(): boolean {
		const current = serialize(getContent());
		if (current === serialize(getOriginalContent())) {
			showToast("没有需要暂存的更改", "info");
			return false;
		}
		clearDraftsByPage(pageKey);
		saveDraft({
			pageKey,
			pageName,
			description: `更新 ${pageName}`,
			operation: "update",
			payload: {
				type: "kv",
				content: current,
			},
		});
		showToast(`已暂存 ${pageName} 到本地`, "success");
		return true;
	}

	function restoreFromDrafts(): boolean {
		const drafts = getDraftsByPage(pageKey);
		if (drafts.length === 0) return false;
		const latest = drafts[drafts.length - 1];
		if (latest.payload?.type !== "kv") {
			// 旧的 repo 型草稿（写 GitHub 文件）已失效，直接清除
			clearDraftsByPage(pageKey);
			showToast(`已清除 ${pageName} 的旧格式草稿`, "info");
			return false;
		}
		try {
			setContent(JSON.parse(String(latest.payload.content)));
			showToast(`已恢复 ${pageName} 的暂存数据`, "info");
			return true;
		} catch {
			clearDraftsByPage(pageKey);
			return false;
		}
	}

	async function submitDrafts(): Promise<boolean> {
		const drafts = getDraftsByPage(pageKey);
		let data: Record<string, unknown>;
		if (drafts.length > 0) {
			const latest = drafts[drafts.length - 1];
			if (latest.payload?.type !== "kv") return false;
			try {
				data = JSON.parse(String(latest.payload.content));
			} catch {
				return false;
			}
		} else {
			data = getContent();
		}
		if (serialize(data) === serialize(getOriginalContent())) {
			showToast("没有需要提交的更改", "info");
			return false;
		}
		const ok = await putKvData(type, data);
		if (ok) {
			clearDraftsByPage(pageKey);
			setOriginalContent(JSON.parse(JSON.stringify(data)));
			// 同步当前编辑状态（提交的可能来自暂存草稿）
			setContent(JSON.parse(JSON.stringify(data)));
			announceKvUpdate(type, data);
			showToast(`${pageName} 已实时更新`, "success");
		}
		return ok;
	}

	registerSubmitHandler(pageKey, async (draft) => {
		if (draft.payload?.type !== "kv") return false;
		try {
			const data = JSON.parse(String(draft.payload.content));
			const ok = await putKvData(type, data);
			if (ok) {
				setOriginalContent(JSON.parse(JSON.stringify(data)));
				announceKvUpdate(type, data);
			}
			return ok;
		} catch {
			return false;
		}
	});

	function hasLocalChanges(): boolean {
		return (
			getDraftsByPage(pageKey).length > 0 ||
			serialize(getContent()) !== serialize(getOriginalContent())
		);
	}

	return {
		saveToDrafts,
		restoreFromDrafts,
		submitDrafts,
		hasLocalChanges,
		clearDrafts: () => clearDraftsByPage(pageKey),
	};
}
