<script lang="ts">
/**
 * DynamicEditor.svelte —— /dynamic/ 页面侧边栏编辑器
 * --------------------------------------------------------------
 * 配合本仓库统一的「侧边栏编辑」模式使用：
 *   - 侧边栏「编辑」按钮会通过 dispatchEvent 广播
 *     `edit:sidebarModeChange / edit:sidebarSaveDraft /
 *      edit:sidebarSubmit / edit:sidebarCancel / edit:sidebarAdd` 事件；
 *   - 每个具体页面的编辑器监听 pageKey 一致的事件并执行对应动作；
 *   - 草稿通过 setupRepoDrafts() 持久化到 localStorage 与 GitHub。
 *
 * 与 src/components/edit/MomentsEditor.svelte 等保持实现风格一致：
 *   - pageKey 必须与 src/config/sidebarConfig.ts 中对应侧边栏按钮
 *     配置的 pageKey 一致（此处为 "dynamic"）；
 *   - 任何 modify 行为都通过 _draft / _deleted 软标记，最终在 submit
 *     阶段过滤并序列化为 JSON 提交到 src/content/dynamic.json。
 *
 * ⚠️ 当前提交目标为 JSON 文件，而 /api/dynamic.json.ts 端点目前仅
 *    读取 src/content/dynamic/*.md。如需启用本编辑器落库，请同步
 *    修改 /api/dynamic.json.ts 优先读取 dynamic.json 源（或在构建
 *    脚本中将 JSON 同步为 markdown）。
 */

import { marked } from "marked";
import { onMount } from "svelte";
import { dynamicConfig, profileConfig } from "@/config";
import { setupRepoDrafts } from "@/utils/draftHelpers";
import {
	deepClone,
	ensureIconify,
	genId,
	getRepoFileMeta,
	showToast,
} from "@/utils/editMode";

/** 单条动态的内部数据模型（与 API 层略有差异：published 为 ISO 字符串） */
interface DynamicItem {
	id: string;
	published: string; // ISO 字符串
	pinned: boolean;
	tags: string[];
	location?: string;
	device?: string;
	author?: string;
	avatar?: string;
	body: string; // Markdown 原文
	_draft?: boolean; // 新建标记：未提交时存在
	_deleted?: boolean; // 删除标记：提交前软删除
}

// ====== 状态 ======
/** 是否处于编辑模式（受侧边栏 modeChange 事件控制） */
let editMode = $state(false);
/** 提交进行中标记：用于禁用按钮、显示 loading */
let saving = $state(false);
/** 当前编辑中的动态列表（被 _deleted 过滤的项不会显示） */
let dynamics = $state<DynamicItem[]>([]);
/** 原始数据快照：用于 cancelEdit() 回滚 */
let originalDynamics = $state<DynamicItem[]>([]);
/** 正在编辑的条目索引（-1 表示未选中） */
let editingIndex = $state(-1);
/** 当前条目的 Markdown 实时预览 HTML */
let editPreview = $state("");
/** 标签输入框临时文本（用于逗号分隔输入） */
let tagsInput = $state("");
/** 图片输入框（本编辑器未使用，保留为扩展位） */
let imagesInput = $state("");
/** 是否展开作者/头像高级选项 */
let showAuthorInput = $state(false);
/** 仓库数据加载完成标记 */
let repoLoaded = $state(false);
/** 初始加载完成标记：避免 onMount 多次触发 loadDynamics */
let initialLoaded = $state(false);
/** 仓库中 src/content/dynamic.json 的 blob sha：提交时必须携带，否则 GitHub 返回 422 */
let fileSha = $state<string | null>(null);

// 侧边栏事件 pageKey：必须与 sidebarConfig.ts 中 dynamic 按钮配置一致
const pageKey = "dynamic";
// 草稿系统展示名（用于 Toast 等 UI 文案）
const pageName = "动态";

/**
 * 将 DynamicItem 序列化为 Markdown frontmatter 文本。
 * 注意：当前实现下并未真正使用（编辑器直接保存 JSON），但保留
 * 用于将来扩展「导出为 .md」能力时使用。
 */
function buildFrontmatter(item: DynamicItem): string {
	const lines = ["---"];
	lines.push(`published: ${item.published}`);
	if (item.pinned) lines.push("pinned: true");
	if (item.tags && item.tags.length > 0) {
		lines.push("tags:");
		item.tags.forEach((t) => lines.push(`  - ${t}`));
	}
	if (item.location) lines.push(`location: "${item.location}"`);
	if (item.device) lines.push(`device: "${item.device}"`);
	if (item.author) lines.push(`author: "${item.author}"`);
	if (item.avatar) lines.push(`avatar: "${item.avatar}"`);
	lines.push("---");
	return lines.join("\n");
}

/**
 * 动态列表排序：置顶优先，按发布时间倒序。
 * 与 src/utils/dynamic-utils.ts 中 sortDynamics 行为保持一致。
 */
function sortDynamics(items: DynamicItem[]): DynamicItem[] {
	return [...items].sort((a, b) => {
		if (a.pinned && !b.pinned) return -1;
		if (!a.pinned && b.pinned) return 1;
		return new Date(b.published).getTime() - new Date(a.published).getTime();
	});
}

/**
 * 草稿系统：包装自 src/utils/draftHelpers.ts 的 setupRepoDrafts。
 * - getContent/setContent 用于序列化整个 dynamics 数组到 localStorage；
 * - getPath 返回仓库目标文件路径（src/content/dynamic.json）；
 * - getOriginalContent/setOriginalContent 用于 cancelEdit 时回滚；
 * - getCommitMsg 在新建/编辑场景下返回不同的 commit 文本。
 * - sha 在 loadDynamics 时通过 getRepoFileMeta 从 GitHub 获取；
 *   dynamic.json 已存在于仓库中，缺失 sha 的 PUT 会被 GitHub 以 422 拒绝。
 */
const drafts = setupRepoDrafts({
	pageKey,
	pageName,
	getContent: () => JSON.stringify(dynamics, null, 2),
	setContent: (v) => {
		try {
			dynamics = JSON.parse(v);
		} catch {
			dynamics = [];
		}
	},
	getPath: () => "src/content/dynamic.json",
	getSha: () => fileSha,
	setSha: (v) => (fileSha = v),
	getOriginalContent: () => JSON.stringify(originalDynamics, null, 2),
	setOriginalContent: (v) => {
		try {
			originalDynamics = JSON.parse(v);
		} catch {
			originalDynamics = [];
		}
	},
	getCommitMsg: (isEdit) =>
		isEdit
			? "chore(dynamic): update dynamic content"
			: "chore(dynamic): add dynamic content",
});

/** 是否有未保存修改（驱动侧边栏「保存」按钮可用状态） */
let hasChanges = $derived(drafts.hasLocalChanges());

/**
 * 将 hasChanges 状态广播到侧边栏。
 * 侧边栏 EditPostButton 会监听 edit:hasChanges 事件来更新 UI。
 */
$effect(() => {
	window.dispatchEvent(
		new CustomEvent("edit:hasChanges", {
			detail: { pageKey, hasChanges },
		}),
	);
});

/**
 * 组件挂载阶段：
 *  1) 加载 Iconify 图标（操作按钮依赖）；
 *  2) 从 localStorage 恢复草稿（若有）；
 *  3) 注册侧边栏事件监听；
 *  4) 首次加载时从 /api/dynamic.json 拉取原始数据。
 */
onMount(() => {
	ensureIconify();
	drafts.restoreFromDrafts();

	window.addEventListener("edit:sidebarModeChange", handleSidebarModeChange);
	window.addEventListener("edit:sidebarSaveDraft", handleSidebarSaveDraft);
	window.addEventListener("edit:sidebarSubmit", handleSidebarSubmit);
	window.addEventListener("edit:sidebarCancel", handleSidebarCancel);
	window.addEventListener("edit:sidebarAdd", handleSidebarAdd);

	if (!initialLoaded) {
		loadDynamics();
	}

	// 清理：组件卸载时移除全部监听
	return () => {
		window.removeEventListener(
			"edit:sidebarModeChange",
			handleSidebarModeChange,
		);
		window.removeEventListener("edit:sidebarSaveDraft", handleSidebarSaveDraft);
		window.removeEventListener("edit:sidebarSubmit", handleSidebarSubmit);
		window.removeEventListener("edit:sidebarCancel", handleSidebarCancel);
		window.removeEventListener("edit:sidebarAdd", handleSidebarAdd);
	};
});

/**
 * 从 /api/dynamic.json 拉取原始数据，映射为内部 DynamicItem。
 * 注意：API 返回的 published 是 number（时间戳），这里统一转为 ISO。
 */
async function loadDynamics() {
	try {
		const res = await fetch("/api/dynamic.json");
		const data = await res.json();
		const items: DynamicItem[] = data.map((d: any) => ({
			id: d.id,
			published: new Date(d.published).toISOString(),
			pinned: d.pinned || false,
			tags: d.tags || [],
			location: d.location || "",
			device: d.device || "",
			author: d.author || "",
			avatar: d.avatar || "",
			body: d.body || "",
		}));
		dynamics = sortDynamics(items);
		originalDynamics = deepClone(dynamics);
		initialLoaded = true;
		repoLoaded = true;
	} catch (e) {
		console.error("Failed to load dynamics", e);
		showToast("加载动态失败", "error");
	}
	// 无论站点 API 结果如何，都取一次仓库文件 sha 供提交使用
	const meta = await getRepoFileMeta("src/content/dynamic.json");
	if (meta) fileSha = meta.sha;
}

/* ========== 侧边栏事件处理 ==========
 * 每个处理函数都先校验 detail.pageKey === pageKey，
 * 避免多个编辑器（如相册/友链/动态）之间的事件串扰。 */

// 侧边栏切换编辑模式：true=进入编辑，false=取消
function handleSidebarModeChange(e: Event) {
	const detail = (e as CustomEvent).detail;
	if (detail?.pageKey !== pageKey) return;
	if (detail.editing) {
		enterEditMode();
	} else {
		cancelEdit();
	}
}

// 侧边栏「保存草稿」按钮
function handleSidebarSaveDraft(e: Event) {
	const detail = (e as CustomEvent).detail;
	if (detail?.pageKey !== pageKey) return;
	saveDraft();
}

// 侧边栏「提交到 GitHub」按钮
function handleSidebarSubmit(e: Event) {
	const detail = (e as CustomEvent).detail;
	if (detail?.pageKey !== pageKey) return;
	submitChanges();
}

// 侧边栏「取消」按钮
function handleSidebarCancel(e: Event) {
	const detail = (e as CustomEvent).detail;
	if (detail?.pageKey !== pageKey) return;
	cancelEdit();
}

// 侧边栏「新增」按钮：在列表头部插入一条 _draft 占位
function handleSidebarAdd(e: Event) {
	const detail = (e as CustomEvent).detail;
	if (detail?.pageKey !== pageKey) return;
	startAdd();
}

/**
 * 进入编辑模式：仅翻转标志位，不立即进入任何条目。
 * DynamicFeed 在 editMode=false 时不会显示本编辑器。
 */
function enterEditMode() {
	editMode = true;
	editingIndex = -1;
	editPreview = "";
}

/**
 * 取消编辑：
 *  - 若有未保存修改，弹 confirm 确认；
 *  - 用原始快照覆盖当前数据；
 *  - 退出编辑模式。
 */
function cancelEdit() {
	if (hasChanges && !confirm("你有未保存的更改，确定要取消吗？")) {
		return;
	}
	dynamics = deepClone(originalDynamics);
	editingIndex = -1;
	editPreview = "";
	editMode = false;
}

/**
 * 新增一条动态：
 *  - id 使用 yyyy-mm-dd-<random> 格式（与动态 markdown 命名习惯一致）；
 *  - author/avatar 默认取自 profileConfig；
 *  - 标记 _draft=true，submit 阶段会被实际写入；
 *  - 插入后立即展开该条目进入编辑态。
 */
function startAdd() {
	const now = new Date();
	const dateStr = now.toISOString().split("T")[0];
	const newItem: DynamicItem = {
		id: `${dateStr}-${genId().slice(0, 8)}`,
		published: now.toISOString(),
		pinned: false,
		tags: [],
		location: "",
		device: "",
		author: profileConfig.name || "",
		avatar: profileConfig.avatar || "",
		body: "",
		_draft: true,
	};
	dynamics = sortDynamics([newItem, ...dynamics]);
	editingIndex = dynamics.findIndex((d) => d.id === newItem.id);
	updatePreview(newItem.body);
	tagsInput = "";
}

/**
 * 切换某条目的编辑态：
 *  - 再次点击同一项时折叠；
 *  - 点击不同项时切换并刷新预览。
 */
function startEdit(index: number) {
	if (editingIndex === index) {
		editingIndex = -1;
		return;
	}
	editingIndex = index;
	const item = dynamics[index];
	tagsInput = item.tags.join(", ");
	updatePreview(item.body);
}

/** 将 Markdown 转为 HTML（同步、无扩展），用于实时预览 */
function updatePreview(markdown: string) {
	editPreview = marked.parse(markdown) as string;
}

/** 持久化到 localStorage（草稿） */
function saveDraft() {
	drafts.saveToDrafts();
	showToast("草稿已保存", "success");
}

/**
 * 提交到 GitHub：
 *  - 二次确认；
 *  - 调用 drafts.submitDrafts() 走 PUT/POST 流程；
 *  - 成功后 1.5s 刷新页面以让新数据通过 /api/dynamic.json 重新拉取。
 */
async function submitChanges() {
	if (!confirm("确定要提交更改到 GitHub 吗？")) return;
	try {
		saving = true;
		const ok = await drafts.submitDrafts();
		if (ok) {
			showToast("提交成功！页面稍后将刷新", "success");
			originalDynamics = deepClone(dynamics.filter((d) => !d._deleted));
			dynamics = deepClone(originalDynamics);
			editingIndex = -1;
			setTimeout(() => window.location.reload(), 1500);
		} else {
			showToast("提交失败", "error");
		}
	} catch (e: any) {
		showToast(e?.message || "提交失败", "error");
	} finally {
		saving = false;
	}
}

/** 局部更新某条目：触发重排序（置顶/时间变化时） */
function updateItem(index: number, updates: Partial<DynamicItem>) {
	const updated = [...dynamics];
	updated[index] = { ...updated[index], ...updates };
	dynamics = sortDynamics(updated);
}

/** 处理 Markdown 正文变更：实时刷新预览 */
function handleBodyChange(index: number, e: Event) {
	const value = (e.target as HTMLTextAreaElement).value;
	updateItem(index, { body: value });
	if (editingIndex === index) {
		updatePreview(value);
	}
}

/** 处理标签输入：逗号分隔，转为数组存储 */
function handleTagsChange(index: number, e: Event) {
	const value = (e.target as HTMLInputElement).value;
	tagsInput = value;
	const tags = value
		.split(",")
		.map((t) => t.trim())
		.filter((t) => t.length > 0);
	updateItem(index, { tags });
}

/** 切换置顶状态 */
function togglePin(index: number) {
	updateItem(index, { pinned: !dynamics[index].pinned });
}

/**
 * 删除条目（软删除）：
 *  - 二次确认；
 *  - _draft=true 的条目直接从列表中移除；
 *  - 已有条目标记 _deleted=true，submit 阶段过滤。
 */
function removeItem(index: number) {
	if (!confirm("确定要删除这条动态吗？")) return;
	const updated = [...dynamics];
	if (updated[index]._draft) {
		updated.splice(index, 1);
	} else {
		updated[index] = { ...updated[index], _deleted: true };
	}
	dynamics = updated;
	if (editingIndex === index) {
		editingIndex = -1;
	}
}

/** 本地化时间显示（与 DynamicFeed 风格保持一致） */
function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleString("zh-CN", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}
</script>

<!--
  编辑器容器：editMode=false 时为空（不显示）。
  侧边栏会通过修改 editMode 来控制可见性。
-->
<div class="dynamic-editor">
	{#if editMode}
		<div class="dynamic-edit-list">
			<!--
			  列表：使用 (item.id) 作为 keyed 标识，确保新增/删除时
			  Svelte 能正确复用 DOM。已删除项通过 {#if !item._deleted} 过滤。
			-->
			{#each dynamics as item, index (item.id)}
				{#if !item._deleted}
					<div class="dynamic-edit-item" class:dynamic-edit-item--expanded={editingIndex === index}>
						<!-- 标题行：点击切换展开/折叠 -->
						<div class="dynamic-edit-item-header" onclick={() => startEdit(index)}>
							<div class="dynamic-edit-item-title">
								{#if item.pinned}
									<span class="dynamic-edit-pin">置顶</span>
								{/if}
								<span class="dynamic-edit-date">{formatDate(item.published)}</span>
								{#if item.tags.length > 0}
									<span class="dynamic-edit-tags-preview">
										{item.tags.map((t) => `#${t}`).join(' ')}
									</span>
								{/if}
							</div>
							<div class="dynamic-edit-item-actions">
								<!-- 置顶/取消置顶：阻止冒泡避免触发展开 -->
								<button class="dynamic-edit-action" onclick={(e) => { e.stopPropagation(); togglePin(index); }} title={item.pinned ? '取消置顶' : '置顶'}>
									<iconify-icon icon="material-symbols:push-pin"></iconify-icon>
								</button>
								<!-- 删除：阻止冒泡 -->
								<button class="dynamic-edit-action dynamic-edit-action--delete" onclick={(e) => { e.stopPropagation(); removeItem(index); }} title="删除">
									<iconify-icon icon="material-symbols:delete-outline"></iconify-icon>
								</button>
							</div>
						</div>

						<!-- 展开后的编辑表单 -->
						{#if editingIndex === index}
							<div class="dynamic-edit-form">
								<!-- 发布时间（datetime-local 格式：YYYY-MM-DDTHH:mm） -->
								<div class="dynamic-edit-row">
									<label class="dynamic-edit-label">发布时间</label>
									<input
										type="datetime-local"
										value={item.published.slice(0, 16)}
										onchange={(e) => updateItem(index, { published: new Date((e.target as HTMLInputElement).value).toISOString() })}
										class="dynamic-edit-input"
									/>
								</div>
								<!-- 标签：逗号分隔输入 -->
								<div class="dynamic-edit-row">
									<label class="dynamic-edit-label">标签（逗号分隔）</label>
									<input
										type="text"
										value={tagsInput}
										oninput={(e) => handleTagsChange(index, e)}
										placeholder="标签1, 标签2"
										class="dynamic-edit-input"
									/>
								</div>
								<div class="dynamic-edit-row">
									<label class="dynamic-edit-label">地点</label>
									<input
										type="text"
										value={item.location}
										oninput={(e) => updateItem(index, { location: (e.target as HTMLInputElement).value })}
										placeholder="杭州"
										class="dynamic-edit-input"
									/>
								</div>
								<div class="dynamic-edit-row">
									<label class="dynamic-edit-label">设备</label>
									<input
										type="text"
										value={item.device}
										oninput={(e) => updateItem(index, { device: (e.target as HTMLInputElement).value })}
										placeholder="iPhone 15"
										class="dynamic-edit-input"
									/>
								</div>
								<!-- 高级选项：作者/头像，默认折叠 -->
								<div class="dynamic-edit-row">
									<label class="dynamic-edit-label">
										作者
										<button class="dynamic-edit-toggle" onclick={() => showAuthorInput = !showAuthorInput} type="button">
											{showAuthorInput ? '收起' : '展开'}
										</button>
									</label>
									{#if showAuthorInput}
										<div class="dynamic-edit-inputs-row">
											<input
												type="text"
												value={item.author}
												oninput={(e) => updateItem(index, { author: (e.target as HTMLInputElement).value })}
												placeholder="作者名称"
												class="dynamic-edit-input"
											/>
											<input
												type="text"
												value={item.avatar}
												oninput={(e) => updateItem(index, { avatar: (e.target as HTMLInputElement).value })}
												placeholder="头像 URL"
												class="dynamic-edit-input"
											/>
										</div>
									{/if}
								</div>
								<!-- Markdown 正文（占满整行） -->
								<div class="dynamic-edit-row dynamic-edit-row--full">
									<label class="dynamic-edit-label">内容（Markdown）</label>
									<div class="dynamic-edit-editor-wrap">
										<textarea
											value={item.body}
											oninput={(e) => handleBodyChange(index, e)}
											placeholder="在这里输入动态内容，支持 Markdown..."
											class="dynamic-edit-textarea"
											rows={8}
										></textarea>
									</div>
								</div>
								<!-- 实时预览：使用 marked 渲染 -->
								<div class="dynamic-edit-row dynamic-edit-row--full">
									<label class="dynamic-edit-label">预览</label>
									<div class="dynamic-edit-preview moment-text">{@html editPreview}</div>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style>
	/* 编辑器样式与 moments 卡片风格保持一致：
	   - 背景/边框/圆角使用 --moments-* 设计 token；
	   - 标签/操作按钮采用相同的圆角和悬停态；
	   - 暗色模式由全局主题变量自动适配。 */
	.dynamic-editor {
		margin-bottom: 1rem;
	}
	.dynamic-edit-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.dynamic-edit-item {
		background: var(--moments-surface);
		border: 1px solid var(--moments-border);
		border-radius: 12px;
		overflow: hidden;
	}
	.dynamic-edit-item-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 10px 12px;
		cursor: pointer;
		transition: background 0.2s;
	}
	.dynamic-edit-item-header:hover {
		background: var(--moments-soft);
	}
	.dynamic-edit-item-title {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.dynamic-edit-pin {
		display: inline-flex;
		align-items: center;
		padding: 2px 8px;
		background: var(--moments-soft);
		color: var(--content-meta);
		border: 1px solid var(--moments-border);
		border-radius: 9999px;
		font-size: 11px;
		font-weight: 600;
	}
	.dynamic-edit-date {
		font-size: 13px;
		color: var(--deep-text);
		font-weight: 500;
	}
	.dynamic-edit-tags-preview {
		font-size: 12px;
		color: var(--content-meta);
	}
	.dynamic-edit-item-actions {
		display: flex;
		gap: 2px;
		flex-shrink: 0;
	}
	.dynamic-edit-action {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border-radius: 6px;
		border: none;
		background: transparent;
		color: var(--content-meta);
		cursor: pointer;
		transition: all 0.15s;
	}
	.dynamic-edit-action:hover {
		background: var(--moments-soft);
		color: var(--deep-text);
	}
	.dynamic-edit-action--delete:hover {
		background: rgba(239, 68, 68, 0.1);
		color: #dc2626;
	}

	.dynamic-edit-form {
		padding: 16px;
		border-top: 1px solid var(--moments-border);
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}
	.dynamic-edit-row {
		flex: 1 1 calc(50% - 6px);
		min-width: 200px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.dynamic-edit-row--full {
		flex: 1 1 100%;
	}
	.dynamic-edit-label {
		font-size: 12px;
		font-weight: 600;
		color: var(--content-meta);
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.dynamic-edit-toggle {
		font-size: 11px;
		padding: 2px 6px;
		border-radius: 4px;
		border: 1px solid var(--moments-border);
		background: var(--moments-soft);
		color: var(--content-meta);
		cursor: pointer;
	}
	.dynamic-edit-input {
		padding: 8px 12px;
		border: 1px solid var(--moments-border);
		border-radius: 8px;
		background: var(--page-bg);
		color: var(--deep-text);
		font-size: 13px;
		outline: none;
		transition: border-color 0.2s;
	}
	.dynamic-edit-input:focus {
		border-color: hsl(var(--theme-hue, 165), 70%, 50%);
	}
	.dynamic-edit-inputs-row {
		display: flex;
		gap: 8px;
	}
	.dynamic-edit-inputs-row .dynamic-edit-input {
		flex: 1;
	}
	.dynamic-edit-textarea {
		width: 100%;
		padding: 12px;
		border: 1px solid var(--moments-border);
		border-radius: 8px;
		background: var(--page-bg);
		color: var(--deep-text);
		font-size: 13px;
		line-height: 1.6;
		resize: vertical;
		outline: none;
		transition: border-color 0.2s;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		box-sizing: border-box;
	}
	.dynamic-edit-textarea:focus {
		border-color: hsl(var(--theme-hue, 165), 70%, 50%);
	}
	.dynamic-edit-preview {
		padding: 12px;
		border: 1px solid var(--moments-border);
		border-radius: 8px;
		background: var(--moments-soft);
		min-height: 80px;
	}
</style>
