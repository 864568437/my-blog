<script lang="ts">
import { onMount } from "svelte";
import { setupKvDrafts } from "@/utils/draftHelpers";
import {
	deepClone,
	ensureIconify,
	genId,
	showToast,
} from "@/utils/editMode";
import { fetchKvData } from "@/utils/kvData";

interface NotebookFolder {
	slug: string;
	name: string;
	cover: string;
	summary: string;
	tags: string[];
	enabled?: boolean;
	_draft?: boolean;
	_deleted?: boolean;
}

interface NotebookNote {
	id: string;
	folder: string;
	title: string;
	date: string;
	content: string;
	tags: string[];
	images: string[];
	enabled?: boolean;
	_draft?: boolean;
	_deleted?: boolean;
}

let editMode = $state(false);
let saving = $state(false);
let folders = $state<NotebookFolder[]>([]);
let notes = $state<NotebookNote[]>([]);
let originalFolders = $state<NotebookFolder[]>([]);
let originalNotes = $state<NotebookNote[]>([]);
let editingFolderIndex = $state(-1);
let editingNoteIndex = $state(-1);
let modalFolderItem = $state<NotebookFolder | null>(null);
let modalNoteItem = $state<NotebookNote | null>(null);
let modalMode = $state<"add" | "edit">("add");
let modalType = $state<"folder" | "note">("folder");
let tagsInput = $state("");
let imagesInput = $state("");
let currentFolderSlug = $state("");
let notePreview = $state("");
let repoLoaded = $state(false);

const pageKey = "notebooks";
const pageName = "笔记本";

// KV 实时数据：提交直接写 Cloudflare KV（/api/data/notebooks），秒级生效。
// folders + notes 合并一个 KV key 提交（原子更新，getFolderStats 联算需要）
const drafts = setupKvDrafts({
	pageKey,
	pageName,
	type: "notebooks",
	getContent: () => ({
		folders: folders.filter((f) => !f._deleted),
		notes: notes.filter((n) => !n._deleted),
	}),
	setContent: (d) => {
		if (Array.isArray(d.folders)) folders = d.folders as NotebookFolder[];
		if (Array.isArray(d.notes)) notes = d.notes as NotebookNote[];
	},
	getOriginalContent: () => ({
		folders: originalFolders,
		notes: originalNotes,
	}),
	setOriginalContent: (d) => {
		if (Array.isArray(d.folders))
			originalFolders = d.folders as NotebookFolder[];
		if (Array.isArray(d.notes)) originalNotes = d.notes as NotebookNote[];
	},
});

let hasChanges = $derived(drafts.hasLocalChanges());

$effect(() => {
	window.dispatchEvent(
		new CustomEvent("edit:hasChanges", {
			detail: { pageKey, hasChanges },
		}),
	);
});

onMount(() => {
	ensureIconify();
	collectFromDOM();
	loadKvData();

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
	if (detail?.pageKey !== pageKey) return;
	if (detail.editing) {
		editMode = true;
		hideSSRContent();
	} else {
		editMode = false;
		showSSRContent();
	}
}

function handleSidebarSaveDraft(e: Event) {
	const detail = (e as CustomEvent).detail;
	if (detail?.pageKey !== pageKey) return;
	handleSaveDraft();
}

function handleSidebarSubmit(e: Event) {
	const detail = (e as CustomEvent).detail;
	if (detail?.pageKey !== pageKey) return;
	handleSubmit();
}

function handleSidebarCancel(e: Event) {
	const detail = (e as CustomEvent).detail;
	if (detail?.pageKey !== pageKey) return;
	handleCancel();
}

function handleSidebarAdd(e: Event) {
	const detail = (e as CustomEvent).detail;
	if (detail?.pageKey !== pageKey) return;
	openAddFolderModal();
}

function collectFromDOM() {
	const grid = document.querySelector(".diary-grid, [data-notebooks-grid]");
	if (!grid) return;

	const result: NotebookFolder[] = [];
	const cards = grid.querySelectorAll(".diary-notebook, [data-notebook-item]");

	cards.forEach((el) => {
		const name =
			el
				.querySelector(".diary-cover-name, h3, .notebook-name")
				?.textContent?.trim() || "未命名";
		const summary =
			el
				.querySelector(".diary-cover-desc, .notebook-summary")
				?.textContent?.trim() || "";
		const img = el.querySelector(
			".diary-cover-img, img",
		) as HTMLImageElement | null;
		const cover = img?.src || "";
		const link = el.querySelector("a")?.getAttribute("href") || "";
		const folderMatch = link.match(/\/life\/notebooks\/([^/]+)\//);
		const slug = folderMatch
			? folderMatch[1]
			: name.toLowerCase().replace(/\s+/g, "-");
		const entriesText =
			el
				.querySelector(".diary-cover-meta, .entries-count")
				?.textContent?.trim() || "";
		const entriesMatch = entriesText.match(/(\d+)/);
		const entries = entriesMatch ? Number.parseInt(entriesMatch[1]) : 0;
		const dateText =
			el
				.querySelector(".diary-notebook-footer span, .updated-at")
				?.textContent?.trim() || "";

		result.push({
			slug: slug || genId("nb"),
			name,
			cover,
			summary,
			tags: [],
			enabled: true,
		});
	});

	if (result.length > 0) {
		folders = result;
		originalFolders = deepClone(result);
	}
}

/** 从 KV 拉取最新笔记本数据；失败回落 collectFromDOM() 的 SSR 收集结果 */
async function loadKvData() {
	const data = await fetchKvData<{
		folders: NotebookFolder[];
		notes: NotebookNote[];
	}>("notebooks");
	if (data && Array.isArray(data.folders) && data.folders.length > 0) {
		folders = data.folders;
		notes = Array.isArray(data.notes) ? data.notes : [];
		originalFolders = deepClone(folders);
		originalNotes = deepClone(notes);
	}
	repoLoaded = true;
	drafts.restoreFromDrafts();
}

function hideSSRContent() {
	const selectors = [".diary-grid", ".diary-empty", "[data-notebooks-grid]"];
	selectors.forEach((sel) => {
		document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
			el.style.display = "none";
		});
	});
}

function showSSRContent() {
	const selectors = [".diary-grid", ".diary-empty", "[data-notebooks-grid]"];
	selectors.forEach((sel) => {
		document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
			el.style.display = "";
		});
	});
}

function handleCancel() {
	editMode = false;
	folders = deepClone(originalFolders);
	notes = deepClone(originalNotes);
	editingFolderIndex = -1;
	editingNoteIndex = -1;
	drafts.clearDrafts();
	showSSRContent();
}

function slugify(text: string): string {
	return (
		text
			.toLowerCase()
			.trim()
			.replace(/[\s]+/g, "-")
			.replace(/[^\w\u4e00-\u9fa5-]/g, "")
			.replace(/-+/g, "-")
			.replace(/^-|-$/g, "") || "notebook"
	);
}

function openAddFolderModal() {
	modalFolderItem = {
		slug: "",
		name: "",
		cover: "",
		summary: "",
		tags: [],
		enabled: true,
		_draft: true,
	};
	tagsInput = "";
	modalMode = "add";
	modalType = "folder";
}

function openEditFolderModal(index: number) {
	const item = folders.filter((f) => !f._deleted)[index];
	if (!item) return;
	const realIndex = folders.findIndex((f) => f.slug === item.slug);
	if (realIndex < 0) return;

	editingFolderIndex = realIndex;
	modalFolderItem = deepClone(folders[realIndex]);
	tagsInput = folders[realIndex].tags.join(", ");
	modalMode = "edit";
	modalType = "folder";
}

function openAddNoteModal(folderSlug: string) {
	currentFolderSlug = folderSlug;
	const today = new Date().toISOString().slice(0, 10);
	modalNoteItem = {
		id: genId("note"),
		folder: folderSlug,
		title: "",
		date: today,
		content: "",
		tags: [],
		images: [],
		enabled: true,
		_draft: true,
	};
	tagsInput = "";
	imagesInput = "";
	notePreview = "";
	modalMode = "add";
	modalType = "note";
}

function openEditNoteModal(index: number, folderSlug: string) {
	const folderNotes = notes.filter(
		(n) => !n._deleted && n.folder === folderSlug,
	);
	const item = folderNotes[index];
	if (!item) return;
	const realIndex = notes.findIndex((n) => n.id === item.id);
	if (realIndex < 0) return;

	currentFolderSlug = folderSlug;
	editingNoteIndex = realIndex;
	modalNoteItem = deepClone(notes[realIndex]);
	tagsInput = notes[realIndex].tags.join(", ");
	imagesInput = notes[realIndex].images.join("\n");
	updateNotePreview(notes[realIndex].content);
	modalMode = "edit";
	modalType = "note";
}

function closeModal() {
	modalFolderItem = null;
	modalNoteItem = null;
	editingFolderIndex = -1;
	editingNoteIndex = -1;
}

function saveFolderModal() {
	if (!modalFolderItem) return;
	if (!modalFolderItem.name.trim()) {
		showToast("笔记本名称不能为空", "warning");
		return;
	}

	modalFolderItem.tags = tagsInput
		.split(/[,，、\s]+/)
		.map((s) => s.trim())
		.filter((s) => s);

	if (!modalFolderItem.slug) {
		modalFolderItem.slug = slugify(modalFolderItem.name);
	}

	if (modalMode === "add") {
		folders = [modalFolderItem, ...folders];
		showToast("已添加笔记本，记得点击保存", "info");
	} else {
		if (editingFolderIndex >= 0) {
			folders[editingFolderIndex] = { ...modalFolderItem };
			folders = [...folders];
			showToast("已修改笔记本，记得点击保存", "info");
		}
	}

	closeModal();
}

function saveNoteModal() {
	if (!modalNoteItem) return;
	if (!modalNoteItem.title.trim()) {
		showToast("笔记标题不能为空", "warning");
		return;
	}

	modalNoteItem.tags = tagsInput
		.split(/[,，、\s]+/)
		.map((s) => s.trim())
		.filter((s) => s);

	modalNoteItem.images = imagesInput
		.split(/[\n,;，；]/)
		.map((s) => s.trim())
		.filter((s) => s);

	if (modalMode === "add") {
		notes = [modalNoteItem, ...notes];
		showToast("已添加笔记，记得点击保存", "info");
	} else {
		if (editingNoteIndex >= 0) {
			notes[editingNoteIndex] = { ...modalNoteItem };
			notes = [...notes];
			showToast("已修改笔记，记得点击保存", "info");
		}
	}

	closeModal();
}

function deleteFolder(index: number) {
	const item = folders.filter((f) => !f._deleted)[index];
	if (!item) return;
	const realIndex = folders.findIndex((f) => f.slug === item.slug);
	if (realIndex < 0) return;

	if (!confirm(`确定要删除「${item.name}」吗？该分类下的所有笔记也将被删除。`))
		return;

	if (item._draft) {
		folders = folders.filter((_, i) => i !== realIndex);
	} else {
		folders[realIndex] = { ...folders[realIndex], _deleted: true };
		folders = [...folders];
	}

	notes = notes.map((n) =>
		n.folder === item.slug ? { ...n, _deleted: true } : n,
	);
	notes = [...notes];

	showToast("已标记删除，记得点击保存", "info");
}

function restoreFolder(index: number) {
	const realIndex = folders.findIndex(
		(f) => f.slug === folders.filter((x) => !x._deleted)[index]?.slug,
	);
	if (realIndex < 0) return;
	folders[realIndex] = { ...folders[realIndex], _deleted: false };
	folders = [...folders];
}

function deleteNote(index: number, folderSlug: string) {
	const folderNotes = notes.filter(
		(n) => !n._deleted && n.folder === folderSlug,
	);
	const item = folderNotes[index];
	if (!item) return;
	const realIndex = notes.findIndex((n) => n.id === item.id);
	if (realIndex < 0) return;

	if (!confirm(`确定要删除「${item.title}」吗？`)) return;

	if (item._draft) {
		notes = notes.filter((_, i) => i !== realIndex);
	} else {
		notes[realIndex] = { ...notes[realIndex], _deleted: true };
		notes = [...notes];
	}

	showToast("已标记删除，记得点击保存", "info");
}

function restoreNote(index: number, folderSlug: string) {
	const folderNotes = notes.filter((n) => n.folder === folderSlug);
	const item = folderNotes[index];
	if (!item) return;
	const realIndex = notes.findIndex((n) => n.id === item.id);
	if (realIndex < 0) return;
	notes[realIndex] = { ...notes[realIndex], _deleted: false };
	notes = [...notes];
}

function updateNotePreview(content: string) {
	if (!content) {
		notePreview = "";
		return;
	}
	try {
		notePreview = (window as any).marked
			? (window as any).marked.parse(content || "", { gfm: true, breaks: true })
			: content;
	} catch {
		notePreview = content || "";
	}
}

function getNotesForFolder(folderSlug: string): NotebookNote[] {
	return notes
		.filter((n) => !n._deleted && n.folder === folderSlug)
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function handleSaveDraft() {
	const cleanFolders = folders.map(({ _draft, _deleted, ...rest }) => ({
		...rest,
		slug: rest.slug || genId("nb"),
		enabled: rest.enabled !== false,
	}));
	const cleanNotes = notes.map(({ _draft, _deleted, ...rest }) => ({
		...rest,
		id: rest.id || genId("note"),
		enabled: rest.enabled !== false,
	}));
	folders = cleanFolders;
	notes = cleanNotes;
	drafts.saveToDrafts();
}

async function handleSubmit() {
	if (modalFolderItem || modalNoteItem) {
		closeModal();
	}
	saving = true;
	try {
		const cleanFolders = folders.map(({ _draft, _deleted, ...rest }) => ({
			...rest,
			slug: rest.slug || genId("nb"),
			enabled: rest.enabled !== false,
		}));
		const cleanNotes = notes.map(({ _draft, _deleted, ...rest }) => ({
			...rest,
			id: rest.id || genId("note"),
			enabled: rest.enabled !== false,
		}));
		folders = cleanFolders;
		notes = cleanNotes;
		drafts.saveToDrafts();
		await drafts.submitDrafts();
	} catch (err) {
		showToast("保存出错：" + (err as Error).message, "error");
		console.error(err);
	} finally {
		saving = false;
	}
}

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "Escape") {
		closeModal();
	}
}

function getGridCols(count: number) {
	if (count <= 1) return 1;
	if (count === 2) return 2;
	return 3;
}
</script>


{#if editMode}
  <div class="nb-editor">
    <div class="nb-grid">
      {#each folders.filter(f => !f._deleted) as item, i (i + "-" + item.slug)}
        <div
          class="nb-card"
          class:nb-card-draft={item._draft}
          class:nb-card-deleted={item._deleted}
        >
          <div class="nb-card-actions">
            <button class="nb-action-btn nb-action-edit" onclick={() => openEditFolderModal(i)} title="编辑笔记本">
              <iconify-icon icon="material-symbols:edit-outline-rounded"></iconify-icon>
            </button>
            <button class="nb-action-btn nb-action-add" onclick={() => openAddNoteModal(item.slug)} title="添加笔记">
              <iconify-icon icon="material-symbols:add-rounded"></iconify-icon>
            </button>
            <button class="nb-action-btn nb-action-delete" onclick={() => deleteFolder(i)} title="删除笔记本">
              <iconify-icon icon="material-symbols:delete-outline-rounded"></iconify-icon>
            </button>
          </div>

          <div class="nb-card-cover">
            {#if item.cover}
              <img src={item.cover} alt={item.name} loading="lazy" />
            {:else}
              <div class="nb-card-cover-placeholder">
                <span class="nb-cover-emoji">📔</span>
              </div>
            {/if}
          </div>

          <div class="nb-card-body">
            <div class="nb-card-tags">
              <span class="nb-tag">笔记</span>
              <span class="nb-meta">{getNotesForFolder(item.slug).length} 篇</span>
            </div>
            <h3 class="nb-card-name">{item.name || "未命名笔记本"}</h3>
            <p class="nb-card-summary">{item.summary || "暂无描述"}</p>
          </div>

          <div class="nb-card-footer">
            <span class="nb-date">
              {getNotesForFolder(item.slug).length > 0
                ? getNotesForFolder(item.slug)[0].date
                : "未更新"}
            </span>
            <iconify-icon icon="material-symbols:chevron-right-rounded"></iconify-icon>
          </div>

          {#if item._draft}
            <span class="nb-draft-badge">新增</span>
          {/if}
        </div>
      {/each}
    </div>

    {#if folders.filter(f => !f._deleted).length === 0}
      <div class="nb-empty">
        <iconify-icon icon="material-symbols:menu-book-outline" style="font-size:48px;opacity:0.3;"></iconify-icon>
        <p>暂无笔记本，点击"添加"创建第一个</p>
      </div>
    {/if}

    <!-- 笔记列表 -->
    {#each folders.filter(f => !f._deleted) as folder (folder.slug)}
      <div class="nb-notes-section">
        <div class="nb-notes-header">
          <h3 class="nb-notes-title">📒 {folder.name}</h3>
          <button class="nb-add-note-btn" onclick={() => openAddNoteModal(folder.slug)}>
            <iconify-icon icon="material-symbols:add-rounded"></iconify-icon>
            <span>添加笔记</span>
          </button>
        </div>
        <div class="nb-notes-list">
          {#each getNotesForFolder(folder.slug) as note, ni (note.id)}
            <div class="nb-note-card" class:nb-note-draft={note._draft}>
              <div class="nb-note-actions">
                <button class="nb-action-btn nb-action-edit" onclick={() => openEditNoteModal(ni, folder.slug)} title="编辑">
                  <iconify-icon icon="material-symbols:edit-outline-rounded"></iconify-icon>
                </button>
                <button class="nb-action-btn nb-action-delete" onclick={() => deleteNote(ni, folder.slug)} title="删除">
                  <iconify-icon icon="material-symbols:delete-outline-rounded"></iconify-icon>
                </button>
              </div>
              <div class="nb-note-date">{note.date}</div>
              <div class="nb-note-title">{note.title || "无标题"}</div>
              <div class="nb-note-preview">
                {note.content.slice(0, 100)}{note.content.length > 100 ? "..." : ""}
              </div>
              {#if note._draft}
                <span class="nb-draft-badge nb-note-draft-badge">新增</span>
              {/if}
            </div>
          {/each}
          {#if getNotesForFolder(folder.slug).length === 0}
            <div class="nb-notes-empty">暂无笔记</div>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <!-- Folder Modal -->
  {#if modalFolderItem && modalType === "folder"}
    <div class="nb-modal-overlay" onclick={closeModal} onkeydown={handleKeydown} tabindex="0">
      <div class="nb-modal" onclick={(e) => e.stopPropagation()}>
        <div class="nb-modal-header">
          <iconify-icon icon="material-symbols:edit-document-outline-rounded"></iconify-icon>
          <span>{modalMode === "add" ? "添加笔记本" : "编辑笔记本"}</span>
          <button class="nb-modal-close" onclick={closeModal}>
            <iconify-icon icon="material-symbols:close-rounded"></iconify-icon>
          </button>
        </div>

        <div class="nb-modal-body">
          <div class="nb-form-group">
            <label>名称 *</label>
            <input
              type="text"
              class="nb-input"
              bind:value={modalFolderItem.name}
              placeholder="笔记本名称"
            />
          </div>

          <div class="nb-form-group">
            <label>别名 (URL slug)</label>
            <input
              type="text"
              class="nb-input"
              bind:value={modalFolderItem.slug}
              placeholder="自动生成，可自定义"
            />
          </div>

          <div class="nb-form-group">
            <label>封面图 URL</label>
            <input
              type="text"
              class="nb-input"
              bind:value={modalFolderItem.cover}
              placeholder="https://example.com/cover.jpg"
            />
          </div>

          <div class="nb-form-group">
            <label>描述</label>
            <textarea
              class="nb-textarea"
              bind:value={modalFolderItem.summary}
              rows={3}
              placeholder="简单描述一下这个笔记本..."
              spellcheck="false"
            ></textarea>
          </div>

          <div class="nb-form-group">
            <label>标签（逗号分隔）</label>
            <input
              type="text"
              class="nb-input"
              bind:value={tagsInput}
              placeholder="生活, 学习, 工作"
            />
          </div>
        </div>

        <div class="nb-modal-footer">
          <button class="nb-btn nb-btn-cancel" onclick={closeModal}>取消</button>
          <button class="nb-btn nb-btn-save" onclick={saveFolderModal}>保存</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Note Modal -->
  {#if modalNoteItem && modalType === "note"}
    <div class="nb-modal-overlay nb-modal-large" onclick={closeModal} onkeydown={handleKeydown} tabindex="0">
      <div class="nb-modal" onclick={(e) => e.stopPropagation()}>
        <div class="nb-modal-header">
          <iconify-icon icon="material-symbols:note-alt-rounded"></iconify-icon>
          <span>{modalMode === "add" ? "添加笔记" : "编辑笔记"}</span>
          <button class="nb-modal-close" onclick={closeModal}>
            <iconify-icon icon="material-symbols:close-rounded"></iconify-icon>
          </button>
        </div>

        <div class="nb-modal-body">
          <div class="nb-form-grid">
            <div class="nb-form-group">
              <label>标题 *</label>
              <input
                type="text"
                class="nb-input"
                bind:value={modalNoteItem.title}
                placeholder="笔记标题"
              />
            </div>
            <div class="nb-form-group">
              <label>日期</label>
              <input
                type="date"
                class="nb-input"
                bind:value={modalNoteItem.date}
              />
            </div>
          </div>

          <div class="nb-form-group">
            <label>分类</label>
            <select
              class="nb-select"
              bind:value={modalNoteItem.folder}
            >
              {#each folders.filter(f => !f._deleted) as f (f.slug)}
                <option value={f.slug}>{f.name}</option>
              {/each}
            </select>
          </div>

          <div class="nb-form-group">
            <label>内容 (Markdown)</label>
            <textarea
              class="nb-textarea"
              bind:value={modalNoteItem.content}
              rows={10}
              placeholder="记录你的想法..."
              spellcheck="false"
              oninput={(e) => updateNotePreview((e.target as HTMLTextAreaElement).value)}
            ></textarea>
          </div>

          <div class="nb-form-group">
            <label>预览</label>
            <div class="nb-preview-box">{@html notePreview}</div>
          </div>

          <div class="nb-form-group">
            <label>图片链接（每行一个）</label>
            <textarea
              class="nb-textarea"
              bind:value={imagesInput}
              rows={3}
              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
              spellcheck="false"
            ></textarea>
          </div>

          <div class="nb-form-group">
            <label>标签（逗号分隔）</label>
            <input
              type="text"
              class="nb-input"
              bind:value={tagsInput}
              placeholder="生活, 学习, 工作"
            />
          </div>
        </div>

        <div class="nb-modal-footer">
          <button class="nb-btn nb-btn-cancel" onclick={closeModal}>取消</button>
          <button class="nb-btn nb-btn-save" onclick={saveNoteModal}>保存</button>
        </div>
      </div>
    </div>
  {/if}
{/if}

<style>
  .nb-editor {
    padding: 1rem 0;
  }

  .nb-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .nb-card {
    position: relative;
    display: flex;
    flex-direction: column;
    border-radius: var(--radius-xl, 16px);
    overflow: hidden;
    background: var(--card-bg, white);
    border: 1px solid var(--line-divider, rgba(0,0,0,0.08));
    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.2s;
  }
  :global(.dark) .nb-card {
    background: rgba(23, 23, 23, 0.8);
    border-color: rgba(255,255,255,0.08);
  }
  .nb-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
    border-color: hsla(var(--theme-hue, 165), 70%, 50%, 0.3);
  }
  .nb-card-draft {
    border-style: dashed;
    border-color: hsla(var(--theme-hue, 165), 70%, 50%, 0.5);
  }
  .nb-card-deleted {
    opacity: 0.5;
  }

  .nb-card-actions {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 4px;
    z-index: 10;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .nb-card:hover .nb-card-actions {
    opacity: 1;
  }
  .nb-action-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-size: 14px;
    backdrop-filter: blur(8px);
    transition: all 0.15s;
    color: white;
  }
  .nb-action-btn iconify-icon {
    display: flex;
  }
  .nb-action-edit { background: rgba(59, 130, 246, 0.9); }
  .nb-action-edit:hover { background: rgba(37, 99, 235, 1); }
  .nb-action-add { background: rgba(34, 197, 94, 0.9); }
  .nb-action-add:hover { background: rgba(22, 163, 74, 1); }
  .nb-action-delete { background: rgba(239, 68, 68, 0.9); }
  .nb-action-delete:hover { background: rgba(220, 38, 38, 1); }

  .nb-card-cover {
    position: relative;
    aspect-ratio: 2 / 1;
    overflow: hidden;
    background: linear-gradient(135deg, var(--card-bg) 0%, color-mix(in srgb, var(--primary) 8%, var(--card-bg)) 100%);
  }
  .nb-card-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }
  .nb-card:hover .nb-card-cover img {
    transform: scale(1.06);
  }
  .nb-card-cover-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, var(--card-bg) 0%, color-mix(in srgb, var(--primary) 12%, var(--card-bg)) 100%);
  }
  .nb-cover-emoji {
    font-size: 3.5rem;
    opacity: 0.35;
    transition: all 0.3s ease;
  }
  .nb-card:hover .nb-cover-emoji {
    opacity: 0.55;
    transform: scale(1.1);
  }

  .nb-card-body {
    padding: 1.25rem 1.25rem 0.75rem;
    flex: 1;
  }
  .nb-card-tags {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  .nb-tag {
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 500;
    background: color-mix(in srgb, var(--primary) 20%, transparent);
    color: var(--primary);
  }
  .nb-meta {
    font-size: 12px;
    color: var(--content-meta, #9ca3af);
  }
  .nb-card-name {
    margin: 0 0 6px;
    font-size: 18px;
    font-weight: 700;
    color: var(--text-color, #1f2937);
    line-height: 1.3;
  }
  :global(.dark) .nb-card-name {
    color: #e5e7eb;
  }
  .nb-card:hover .nb-card-name {
    color: var(--primary);
  }
  .nb-card-summary {
    margin: 0;
    font-size: 14px;
    color: var(--content-meta, #6b7280);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  :global(.dark) .nb-card-summary {
    color: #9ca3af;
  }

  .nb-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.25rem;
    border-top: 1px solid var(--line-divider, rgba(0,0,0,0.08));
    color: var(--content-meta, #9ca3af);
    font-size: 12px;
  }

  .nb-draft-badge {
    position: absolute;
    top: 8px;
    left: 8px;
    padding: 2px 8px;
    border-radius: 999px;
    background: hsl(var(--theme-hue, 165), 70%, 50%);
    color: white;
    font-size: 11px;
    font-weight: 600;
    z-index: 10;
  }

  .nb-empty {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--content-meta, #9ca3af);
    font-size: 0.875rem;
  }

  /* 笔记列表 */
  .nb-notes-section {
    margin-top: 2rem;
    padding: 1.25rem;
    background: var(--card-bg);
    border-radius: var(--radius-xl);
    border: 1px solid var(--line-divider);
  }
  :global(.dark) .nb-notes-section {
    background: rgba(23, 23, 23, 0.6);
  }

  .nb-notes-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .nb-notes-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-color);
  }

  .nb-add-note-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border-radius: 8px;
    border: none;
    background: hsl(var(--theme-hue, 165), 70%, 50%);
    color: white;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  .nb-add-note-btn:hover {
    background: hsl(var(--theme-hue, 165), 75%, 45%);
  }

  .nb-notes-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 0.75rem;
  }

  .nb-note-card {
    position: relative;
    padding: 0.875rem;
    background: var(--bg-secondary, #f3f4f6);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
  }
  :global(.dark) .nb-note-card {
    background: rgba(255, 255, 255, 0.03);
  }
  .nb-note-card:hover {
    border-color: hsla(var(--theme-hue, 165), 70%, 50%, 0.4);
    background: color-mix(in srgb, var(--primary) 5%, var(--card-bg));
  }
  .nb-note-draft {
    border-style: dashed;
    border-color: hsla(var(--theme-hue, 165), 70%, 50%, 0.5);
  }

  .nb-note-actions {
    position: absolute;
    top: 6px;
    right: 6px;
    display: flex;
    gap: 2px;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .nb-note-card:hover .nb-note-actions {
    opacity: 1;
  }

  .nb-note-date {
    font-size: 11px;
    color: var(--content-meta);
    margin-bottom: 4px;
  }

  .nb-note-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .nb-note-preview {
    font-size: 12px;
    color: var(--content-meta);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .nb-note-draft-badge {
    top: auto;
    bottom: 6px;
    right: 6px;
    left: auto;
    padding: 1px 6px;
    font-size: 10px;
  }

  .nb-notes-empty {
    grid-column: 1 / -1;
    text-align: center;
    padding: 1.5rem;
    color: var(--content-meta);
    font-size: 0.875rem;
  }

  /* Modal */
  .nb-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }
  .nb-modal {
    width: 100%;
    max-width: 520px;
    max-height: 90vh;
    background: var(--card-bg, white);
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.3s ease;
  }
  .nb-modal-large .nb-modal {
    max-width: 720px;
  }
  :global(.dark) .nb-modal {
    background: #1a1a2e;
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .nb-modal-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px 20px;
    font-size: 15px;
    font-weight: 600;
    color: hsl(var(--theme-hue, 165), 70%, 45%);
    border-bottom: 1px solid var(--border, rgba(0,0,0,0.08));
  }
  .nb-modal-close {
    margin-left: auto;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--content-meta, #6b7280);
    font-size: 18px;
  }
  .nb-modal-close:hover {
    background: var(--bg-secondary, #f3f4f6);
  }

  .nb-modal-body {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
  }

  .nb-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .nb-form-group {
    margin-bottom: 12px;
  }
  .nb-form-group label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary, #4b5563);
    margin-bottom: 4px;
  }
  :global(.dark) .nb-form-group label {
    color: #d1d5db;
  }
  .nb-input,
  .nb-textarea,
  .nb-select {
    width: 100%;
    padding: 8px 12px;
    border: 1.5px solid var(--border, #d1d5db);
    border-radius: 8px;
    font-size: 13px;
    background: var(--bg-color, white);
    color: var(--text-color, #1f2937);
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
    font-family: inherit;
  }
  :global(.dark) .nb-input,
  :global(.dark) .nb-textarea,
  :global(.dark) .nb-select {
    background: #0f0f1a;
    border-color: #374151;
    color: #e5e7eb;
  }
  .nb-input:focus,
  .nb-textarea:focus,
  .nb-select:focus {
    border-color: hsl(var(--theme-hue, 165), 70%, 50%);
    box-shadow: 0 0 0 2px hsla(var(--theme-hue, 165), 70%, 50%, 0.1);
  }
  .nb-textarea {
    resize: vertical;
    min-height: 60px;
  }

  .nb-preview-box {
    padding: 12px;
    border: 1.5px solid var(--border, #d1d5db);
    border-radius: 8px;
    min-height: 80px;
    max-height: 200px;
    overflow-y: auto;
    font-size: 13px;
    line-height: 1.6;
    background: var(--card-bg);
  }
  :global(.dark) .nb-preview-box {
    border-color: #374151;
  }
  .nb-preview-box :global(p) {
    margin: 0.25rem 0;
  }

  .nb-modal-footer {
    display: flex;
    gap: 8px;
    padding: 16px 20px;
    border-top: 1px solid var(--border, rgba(0,0,0,0.08));
  }
  .nb-btn {
    flex: 1;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: inherit;
  }
  .nb-btn-cancel {
    background: var(--bg-secondary, #f3f4f6);
    color: var(--text-color, #374151);
  }
  .nb-btn-cancel:hover {
    background: var(--border, #e5e7eb);
  }
  :global(.dark) .nb-btn-cancel {
    background: #2d2d44;
    color: #d1d5db;
  }
  :global(.dark) .nb-btn-cancel:hover {
    background: #3d3d55;
  }
  .nb-btn-save {
    background: hsl(var(--theme-hue, 165), 70%, 50%);
    color: white;
  }
  .nb-btn-save:hover {
    background: hsl(var(--theme-hue, 165), 75%, 45%);
  }

  @media (max-width: 640px) {
    .nb-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    .nb-form-grid {
      grid-template-columns: 1fr;
    }
    .nb-notes-list {
      grid-template-columns: 1fr;
    }
  }
</style>
