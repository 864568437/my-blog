<script lang="ts">
import { onMount } from "svelte";
import { setupKvDrafts } from "@/utils/draftHelpers";
import { deepClone, ensureIconify, genId, showToast } from "@/utils/editMode";
import { fetchKvData } from "@/utils/kvData";

interface FriendItem {
	id?: string;
	title: string;
	imgurl: string;
	desc: string;
	siteurl: string;
	tags?: string[];
	weight?: number;
	enabled?: boolean;
	_draft?: boolean;
}

let editMode = $state(false);
let saving = $state(false);
let friends = $state<FriendItem[]>([]);
let originalFriends = $state<FriendItem[]>([]);
let editingIndex = $state(-1);
let repoLoaded = $state(false);
// 批量删除：勾选中的条目 id 集合（id 缺失时回落 siteurl）
let selectedIds = $state<Set<string>>(new Set());

const typeColors: Record<string, { bg: string; text: string }> = {
	Blog: { bg: "#3b82f6", text: "#ffffff" },
	Docs: { bg: "#f59e0b", text: "#ffffff" },
};

// KV 实时数据：提交直接写 Cloudflare KV（/api/data/friends），秒级生效
const drafts = setupKvDrafts({
	pageKey: "friends",
	pageName: "友链",
	type: "friends",
	getContent: () => ({ items: friends }),
	setContent: (d) => {
		if (Array.isArray(d.items)) friends = d.items as FriendItem[];
	},
	getOriginalContent: () => ({ items: originalFriends }),
	setOriginalContent: (d) => {
		if (Array.isArray(d.items)) originalFriends = d.items as FriendItem[];
	},
});

let hasChanges = $derived(drafts.hasLocalChanges());

$effect(() => {
	window.dispatchEvent(
		new CustomEvent("edit:hasChanges", {
			detail: { pageKey: "friends", hasChanges },
		}),
	);
});

onMount(() => {
	ensureIconify();
	collectFromDOM();
	loadKvData();

	// 监听侧边栏编辑按钮事件
	window.addEventListener("edit:sidebarModeChange", handleSidebarModeChange);
	window.addEventListener("edit:sidebarSaveDraft", handleSidebarSaveDraft);
	window.addEventListener("edit:sidebarSubmit", handleSidebarSubmit);
	window.addEventListener("edit:sidebarCancel", handleSidebarCancel);
	window.addEventListener("edit:sidebarAdd", handleSidebarAdd);

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

function handleSidebarModeChange(e: Event) {
	const detail = (e as CustomEvent).detail;
	if (detail?.pageKey !== "friends") return;
	if (detail.editing) {
		editMode = true;
		hideSSRGrid();
		editingIndex = -1;
	} else {
		editMode = false;
		showSSRGrid();
	}
}

function handleSidebarSaveDraft(e: Event) {
	const detail = (e as CustomEvent).detail;
	if (detail?.pageKey !== "friends") return;
	handleSaveDraft();
}

function handleSidebarSubmit(e: Event) {
	const detail = (e as CustomEvent).detail;
	if (detail?.pageKey !== "friends") return;
	handleSubmit();
}

function handleSidebarCancel(e: Event) {
	const detail = (e as CustomEvent).detail;
	if (detail?.pageKey !== "friends") return;
	handleCancel();
}

function handleSidebarAdd(e: Event) {
	const detail = (e as CustomEvent).detail;
	if (detail?.pageKey !== "friends") return;
	handleAdd();
}

/** 从 KV 拉取最新友链数据；失败回落 collectFromDOM() 的 SSR 收集结果 */
async function loadKvData() {
	const data = await fetchKvData<{ items: FriendItem[] }>("friends");
	if (data && Array.isArray(data.items) && data.items.length > 0) {
		friends = data.items.map((f) => ({ ...f, id: f.id || genId("fr") }));
		originalFriends = deepClone(friends);
	}
	// collectFromDOM 已经填好 friends/originalFriends，这里仅在 KV 可用时覆盖
	repoLoaded = true;
	drafts.restoreFromDrafts();
}

// 适配当前项目的友链 DOM 结构
function collectFromDOM() {
	const grid = document.getElementById("friends-grid");
	if (!grid) return;
	const items: FriendItem[] = [];
	grid.querySelectorAll(".friend-card").forEach((el) => {
		const card = el as HTMLElement;
		// 当前项目的友链卡片是直接 <a> 标签
		const link =
			card.tagName === "A"
				? (card as HTMLAnchorElement)
				: (card.querySelector("a") as HTMLAnchorElement | null);
		if (!link) return;
		// 获取标题 - 在 .font-bold 或 .friend-card-title 中
		const title =
			card.querySelector(".font-bold")?.textContent?.trim() ||
			card.querySelector(".friend-card-title")?.textContent?.trim() ||
			"";
		// 获取描述 - 在 .text-sm 或 .friend-card-desc 中
		const desc =
			card.querySelector(".text-sm.text-neutral-500")?.textContent?.trim() ||
			card.querySelector(".line-clamp-1")?.textContent?.trim() ||
			card.querySelector(".friend-card-desc")?.textContent?.trim() ||
			"";
		// 获取头像
		const img = card.querySelector("img") as HTMLImageElement | null;
		// 获取标签
		const tagEls = card.querySelectorAll(".text-\\[0\\.65rem\\]");
		const tags = Array.from(tagEls)
			.map((t) => t.textContent?.trim() || "")
			.filter(Boolean);
		items.push({
			id: card.dataset.friendId || link.href,
			title,
			imgurl: img?.src || "",
			desc,
			siteurl: link.href,
			tags: tags.length > 0 ? tags : ["Blog"],
			weight: 10,
			enabled: true,
		});
	});
	friends = items;
	originalFriends = deepClone(items);
}

function handleModeChange(e: CustomEvent) {
	editMode = e.detail.editing;
	if (editMode) {
		hideSSRGrid();
		editingIndex = -1;
	} else {
		showSSRGrid();
	}
}

function hideSSRGrid() {
	const grid = document.getElementById("friends-grid");
	if (grid) grid.style.display = "none";
}

function showSSRGrid() {
	const grid = document.getElementById("friends-grid");
	if (grid) grid.style.display = "";
}

function handleCancel() {
	editMode = false;
	friends = deepClone(originalFriends);
	drafts.clearDrafts();
	editingIndex = -1;
	selectedIds = new Set();
	showSSRGrid();
	notifyModeChange();
}

/** 通知侧边栏按钮（EditPostButton 监听 edit:modeChange 同步编辑态 UI） */
function notifyModeChange() {
	window.dispatchEvent(
		new CustomEvent("edit:modeChange", {
			detail: { editing: editMode, pageKey: "friends" },
		}),
	);
}

/** 提交成功后退出编辑模式：恢复 SSR 显示 + 同步侧边栏按钮状态 */
function exitEditModeAfterSubmit() {
	editMode = false;
	editingIndex = -1;
	selectedIds = new Set();
	showSSRGrid();
	notifyModeChange();
}

function moveUp(index: number) {
	if (index <= 0) return;
	const arr = [...friends];
	[arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
	friends = arr;
	if (editingIndex === index) editingIndex = index - 1;
	else if (editingIndex === index - 1) editingIndex = index;
}

function moveDown(index: number) {
	if (index >= friends.length - 1) return;
	const arr = [...friends];
	[arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
	friends = arr;
	if (editingIndex === index) editingIndex = index + 1;
	else if (editingIndex === index + 1) editingIndex = index;
}

function startEdit(index: number) {
	editingIndex = index;
}

function finishEdit(index: number) {
	const f = friends[index];
	if (!f.title.trim()) {
		showToast("名称不能为空", "warning");
		return;
	}
	if (!f.siteurl.trim()) {
		showToast("链接不能为空", "warning");
		return;
	}
	editingIndex = -1;
	showToast("已修改，记得点击保存", "info");
}

function cancelItemEdit(index: number) {
	const f = friends[index];
	if (f._draft && !f.title.trim()) {
		friends = friends.filter((_, i) => i !== index);
	} else {
		const orig = originalFriends.find(
			(o) => (o.id || o.siteurl) === (f.id || f.siteurl) && !f._draft,
		);
		if (orig) {
			friends[index] = deepClone(orig);
			friends = [...friends];
		}
	}
	editingIndex = -1;
}

function deleteItem(index: number) {
	const f = friends[index];
	if (!confirm(`确定要删除「${f.title || "该条目"}」吗？`)) return;
	friends = friends.filter((_, i) => i !== index);
	syncSelectionAfterListChange();
	if (editingIndex === index) editingIndex = -1;
	else if (editingIndex > index) editingIndex--;
	showToast("已删除，记得点击保存", "info");
}

/* ========== 批量删除 ========== */

function itemId(f: FriendItem): string {
	return f.id || f.siteurl;
}

function toggleSelect(index: number) {
	const id = itemId(friends[index]);
	const next = new Set(selectedIds);
	if (next.has(id)) next.delete(id);
	else next.add(id);
	selectedIds = next;
}

function toggleSelectAll() {
	if (selectedIds.size === friends.length) selectedIds = new Set();
	else selectedIds = new Set(friends.map(itemId));
}

/** 列表变动（单项删除/提交恢复）后清掉指向已不存在条目的勾选 */
function syncSelectionAfterListChange() {
	const live = new Set(friends.map(itemId));
	selectedIds = new Set([...selectedIds].filter((id) => live.has(id)));
}

function deleteSelected() {
	if (selectedIds.size === 0) {
		showToast("请先勾选要删除的条目", "info");
		return;
	}
	if (!confirm(`确定要删除选中的 ${selectedIds.size} 个条目吗？`)) return;
	friends = friends.filter((f) => !selectedIds.has(itemId(f)));
	selectedIds = new Set();
	editingIndex = -1;
	showToast("已删除，记得点击保存", "info");
}

function handleAdd() {
	const newFriend: FriendItem = {
		id: genId("fr"),
		title: "",
		imgurl: "",
		desc: "",
		siteurl: "",
		tags: ["Blog"],
		weight: 10,
		enabled: true,
		_draft: true,
	};
	friends = [...friends, newFriend];
	editingIndex = friends.length - 1;
}

function handleSaveDraft() {
	const cleanData = friends.map(({ _draft, ...rest }) => ({
		...rest,
		id: rest.id || genId("fr"),
		weight: rest.weight ?? 10,
		enabled: rest.enabled !== false,
	}));
	friends = cleanData;
	drafts.saveToDrafts();
}

async function handleSubmit() {
	if (editingIndex >= 0) {
		finishEdit(editingIndex);
		if (editingIndex >= 0) return;
	}
	saving = true;
	try {
		const cleanData = friends.map(({ _draft, ...rest }) => ({
			...rest,
			id: rest.id || genId("fr"),
			weight: rest.weight ?? 10,
			enabled: rest.enabled !== false,
		}));
		// 防误删保护：把列表清空提交会让 KV 变成空列表，
		// 页面 doRefresh() 会因 items 为空而回落 SSR 静态数据，
		// 造成"提交了但不生效"的错觉（KV 里其实是全空）。提交前要求确认。
		if (cleanData.length === 0 && originalFriends.length > 0) {
			if (
				!confirm(
					"当前列表为空！提交后将删除全部友链（KV 会被清空），确定继续吗？",
				)
			) {
				return;
			}
		}
		friends = cleanData;
		drafts.saveToDrafts();
		const ok = await drafts.submitDrafts();
		if (ok) exitEditModeAfterSubmit();
	} finally {
		saving = false;
	}
}

function updateField(index: number, field: keyof FriendItem, value: string) {
	friends[index] = { ...friends[index], [field]: value };
	friends = [...friends];
}

function getTagColor(tag: string) {
	return typeColors[tag] || typeColors.Blog;
}
</script>


<!-- 编辑模式：可编辑网格 -->
{#if editMode}
	{#if friends.length > 0}
		<div class="bulk-delete-bar">
			<label class="bulk-select-all">
				<input
					type="checkbox"
					checked={selectedIds.size === friends.length && friends.length > 0}
					onchange={toggleSelectAll}
				/>
				<span>全选（已选 {selectedIds.size}/{friends.length}）</span>
			</label>
			<button
				class="bulk-delete-btn"
				disabled={selectedIds.size === 0}
				onclick={deleteSelected}
				title="删除所有勾选的友链"
			>
				<iconify-icon icon="material-symbols:delete-outline-rounded"></iconify-icon>
				批量删除{selectedIds.size > 0 ? `（${selectedIds.size}）` : ""}
			</button>
		</div>
	{/if}
	<div class="edit-friends-grid" id="edit-friends-grid">
		{#each friends as friend, i (i + "-" + (friend.id || friend.siteurl))}
			<div
				class="edit-friend-card"
				class:edit-friend-card-selected={selectedIds.has(itemId(friend))}
				class:edit-friend-card-draft={friend._draft}
				class:edit-friend-card-editing={editingIndex === i}
			>
				{#if editingIndex !== i}
					<!-- 批量删除勾选框（左上角） -->
					<label class="card-select" title="勾选后可批量删除">
						<input
							type="checkbox"
							checked={selectedIds.has(itemId(friend))}
							onchange={() => toggleSelect(i)}
						/>
					</label>
					<div class="card-action-row">
						{#if i > 0}
							<button class="action-btn action-move" onclick={() => moveUp(i)} title="上移">
								<iconify-icon icon="material-symbols:keyboard-arrow-up-rounded"></iconify-icon>
							</button>
						{/if}
						{#if i < friends.length - 1}
							<button class="action-btn action-move" onclick={() => moveDown(i)} title="下移">
								<iconify-icon icon="material-symbols:keyboard-arrow-down-rounded"></iconify-icon>
							</button>
						{/if}
						<button class="action-btn action-edit" onclick={() => startEdit(i)} title="编辑">
							<iconify-icon icon="material-symbols:edit-outline-rounded"></iconify-icon>
						</button>
						<button class="action-btn action-delete" onclick={() => deleteItem(i)} title="删除">
							<iconify-icon icon="material-symbols:delete-outline-rounded"></iconify-icon>
						</button>
					</div>

					<div class="card-display">
						<span
							class="card-type-badge"
							style={`background-color:${getTagColor(friend.tags?.[0] || "Blog").bg};color:${getTagColor(friend.tags?.[0] || "Blog").text}`}
						>
							{friend.tags?.[0] || "Blog"}
						</span>
						<div class="card-avatar-wrap">
							{#if friend.imgurl}
								<img src={friend.imgurl} alt={friend.title} class="card-avatar" loading="lazy" onerror={(e) => ((e.target as HTMLImageElement).style.opacity = '0')} />
							{:else}
								<div class="card-avatar-placeholder">
									<iconify-icon icon="material-symbols:person-outline"></iconify-icon>
								</div>
							{/if}
						</div>
						<div class="card-info">
							<h3 class="card-title">{friend.title || "（未命名）"}</h3>
							<p class="card-desc">{friend.desc || "暂无描述"}</p>
							<p class="card-url">{friend.siteurl}</p>
						</div>
					</div>
				{:else}
					<div class="card-edit-form">
						<div class="edit-form-header">
							<iconify-icon icon="material-symbols:edit-document-outline-rounded" class="text-lg"></iconify-icon>
							<span>编辑友链</span>
							{#if friend._draft}
								<span class="draft-badge">新增</span>
							{/if}
						</div>
						<div class="form-group">
							<label>名称</label>
							<input
								type="text"
								value={friend.title}
								oninput={(e) => updateField(i, "title", (e.target as HTMLInputElement).value)}
								placeholder="站点名称"
								class="form-input"
							/>
						</div>
						<div class="form-group">
							<label>头像URL</label>
							<input
								type="text"
								value={friend.imgurl}
								oninput={(e) => updateField(i, "imgurl", (e.target as HTMLInputElement).value)}
								placeholder="https://example.com/avatar.png"
								class="form-input"
							/>
						</div>
						<div class="form-group">
							<label>链接</label>
							<input
								type="text"
								value={friend.siteurl}
								oninput={(e) => updateField(i, "siteurl", (e.target as HTMLInputElement).value)}
								placeholder="https://example.com"
								class="form-input"
							/>
						</div>
						<div class="form-group">
							<label>描述</label>
							<textarea
								value={friend.desc}
								oninput={(e) => updateField(i, "desc", (e.target as HTMLTextAreaElement).value)}
								placeholder="站点描述"
								class="form-textarea"
								rows={2}
							></textarea>
						</div>
						<div class="form-group">
							<label>类型</label>
							<select
								value={friend.tags?.[0] || "Blog"}
								onchange={(e) => {
									friends[i] = { ...friends[i], tags: [(e.target as HTMLSelectElement).value] };
									friends = [...friends];
								}}
								class="form-select"
							>
								<option value="Blog">Blog</option>
								<option value="Docs">Docs</option>
							</select>
						</div>
						<div class="form-actions">
							<button class="form-btn form-btn-cancel" onclick={() => cancelItemEdit(i)}>取消</button>
							<button class="form-btn form-btn-save" onclick={() => finishEdit(i)}>完成</button>
						</div>
					</div>
				{/if}
			</div>
		{/each}

		{#if friends.length === 0}
			<div class="empty-state">
				<iconify-icon icon="material-symbols:link-off-rounded" class="text-4xl mb-2 opacity-40"></iconify-icon>
				<p>暂无友链，点击"添加"开始添加</p>
			</div>
		{/if}
	</div>
{/if}

<style>
	/* ========== 批量删除工具栏 ========== */
	.bulk-delete-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 12px;
		padding: 10px 14px;
		border-radius: 12px;
		background: var(--btn-regular-bg, #f3f4f6);
		border: 1px solid var(--border, rgba(0, 0, 0, 0.08));
	}
	:global(.dark) .bulk-delete-bar {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.08);
	}
	.bulk-select-all {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		font-weight: 600;
		color: var(--text-color, #374151);
		cursor: pointer;
		user-select: none;
	}
	:global(.dark) .bulk-select-all { color: #d1d5db; }
	.bulk-delete-bar input[type="checkbox"],
	.card-select input[type="checkbox"] {
		width: 16px;
		height: 16px;
		accent-color: rgba(239, 68, 68, 1);
		cursor: pointer;
	}
	.bulk-delete-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 7px 14px;
		border-radius: 8px;
		border: none;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		color: white;
		background: rgba(239, 68, 68, 1);
		transition: all 0.15s;
	}
	.bulk-delete-btn:hover:not(:disabled) { background: rgba(220, 38, 38, 1); }
	.bulk-delete-btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	/* 卡片左上角勾选框 */
	.card-select {
		position: absolute;
		top: 8px;
		left: 8px;
		z-index: 10;
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(8px);
		cursor: pointer;
	}
	:global(.dark) .card-select { background: rgba(23, 23, 23, 0.75); }
	.edit-friend-card-selected {
		border-color: rgba(239, 68, 68, 0.6) !important;
		box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.15);
	}

	.edit-friends-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 16px;
	}

	.edit-friend-card {
		position: relative;
		border-radius: 16px;
		background: var(--card-bg, white);
		border: 1px solid var(--border, rgba(0,0,0,0.08));
		overflow: hidden;
		transition: all 0.2s;
	}
	:global(.dark) .edit-friend-card {
		background: rgba(23, 23, 23, 0.8);
		border-color: rgba(255,255,255,0.08);
	}
	.edit-friend-card:hover {
		border-color: hsla(var(--theme-hue, 165), 70%, 50%, 0.3);
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(0,0,0,0.08);
	}
	.edit-friend-card-draft {
		border-style: dashed;
		border-color: hsla(var(--theme-hue, 165), 70%, 50%, 0.5);
	}
	.edit-friend-card-editing {
		border-color: hsla(var(--theme-hue, 165), 70%, 50%, 0.6);
		box-shadow: 0 0 0 3px hsla(var(--theme-hue, 165), 70%, 50%, 0.1);
	}

	.card-action-row {
		position: absolute;
		top: 8px;
		right: 8px;
		display: flex;
		gap: 4px;
		z-index: 10;
		opacity: 1;
		transition: opacity 0.2s;
	}
	.edit-friend-card:hover .card-action-row {
		opacity: 1;
	}
	.action-btn {
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		border: none;
		cursor: pointer;
		font-size: 16px;
		backdrop-filter: blur(8px);
		transition: all 0.15s;
		color: white;
	}
	.action-btn iconify-icon { display: flex; }
	.action-move { background: rgba(100, 116, 139, 1); }
	.action-move:hover { background: rgba(71, 85, 105, 1); transform: scale(1.1); }
	.action-edit { background: rgba(59, 130, 246, 1); }
	.action-edit:hover { background: rgba(37, 99, 235, 1); transform: scale(1.1); }
	.action-delete { background: rgba(239, 68, 68, 1); }
	.action-delete:hover { background: rgba(220, 38, 38, 1); transform: scale(1.1); }

	.card-display { padding: 20px; cursor: default; }
	.card-type-badge {
		display: inline-block; padding: 2px 10px; border-radius: 999px;
		font-size: 11px; font-weight: 600; margin-bottom: 12px;
	}
	.card-avatar-wrap {
		width: 48px; height: 48px; border-radius: 12px; overflow: hidden;
		margin-bottom: 12px; background: var(--btn-regular-bg, #f3f4f6);
		display: flex; align-items: center; justify-content: center;
	}
	:global(.dark) .card-avatar-wrap { background: rgba(255,255,255,0.05); }
	.card-avatar { width: 100%; height: 100%; object-fit: cover; }
	.card-avatar-placeholder {
		width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
		color: var(--content-meta, #9ca3af); font-size: 24px;
	}
	.card-title {
		margin: 0 0 4px; font-size: 15px; font-weight: 700;
		color: var(--text-color, #1f2937); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
	}
	:global(.dark) .card-title { color: #f0f0f0; }
	.card-desc {
		margin: 0 0 6px; font-size: 13px; color: var(--text-secondary, #6b7280);
		line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
	}
	:global(.dark) .card-desc { color: #9ca3af; }
	.card-url {
		margin: 0; font-size: 11px; color: var(--content-meta, #9ca3af);
		overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
	}

	.card-edit-form { padding: 20px; }
	.edit-form-header {
		display: flex; align-items: center; gap: 8px; margin-bottom: 16px;
		font-size: 14px; font-weight: 600; color: hsl(var(--theme-hue, 165), 70%, 45%);
	}
	.draft-badge {
		padding: 1px 8px; border-radius: 999px;
		background: hsl(var(--theme-hue, 165), 70%, 50%); color: white;
		font-size: 11px; font-weight: 600;
	}
	.form-group { margin-bottom: 12px; }
	.form-group label {
		display: block; font-size: 12px; font-weight: 600;
		color: var(--text-secondary, #4b5563); margin-bottom: 4px;
	}
	:global(.dark) .form-group label { color: #d1d5db; }
	.form-input, .form-textarea, .form-select {
		width: 100%; padding: 8px 12px;
		border: 1.5px solid var(--border, #d1d5db); border-radius: 8px;
		font-size: 13px; background: var(--bg-color, white);
		color: var(--text-color, #1f2937); outline: none;
		transition: border-color 0.2s; box-sizing: border-box; font-family: inherit;
	}
	:global(.dark) .form-input, :global(.dark) .form-textarea, :global(.dark) .form-select {
		background: #0f0f1a; border-color: #374151; color: #e5e7eb;
	}
	.form-input:focus, .form-textarea:focus, .form-select:focus {
		border-color: hsl(var(--theme-hue, 165), 70%, 50%);
		box-shadow: 0 0 0 2px hsla(var(--theme-hue, 165), 70%, 50%, 0.1);
	}
	.form-textarea { resize: vertical; min-height: 50px; }
	.form-actions { display: flex; gap: 8px; margin-top: 16px; }
	.form-btn {
		flex: 1; padding: 8px; border-radius: 8px; font-size: 13px;
		font-weight: 600; cursor: pointer; transition: all 0.15s;
		border: none; display: flex; align-items: center; justify-content: center;
	}
	.form-btn-cancel { background: var(--bg-secondary, #f3f4f6); color: var(--text-color, #374151); }
	.form-btn-cancel:hover { background: var(--border, #e5e7eb); }
	:global(.dark) .form-btn-cancel { background: #2d2d44; color: #d1d5db; }
	.form-btn-save { background: hsl(var(--theme-hue, 165), 70%, 50%); color: white; }
	.form-btn-save:hover { background: hsl(var(--theme-hue, 165), 75%, 45%); }

	.empty-state {
		grid-column: 1 / -1; text-align: center; padding: 48px 20px;
		color: var(--content-meta, #9ca3af); font-size: 14px;
	}
</style>