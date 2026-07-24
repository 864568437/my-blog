<script lang="ts">
/**
 * DynamicFeed.svelte —— 动态列表核心渲染器
 * --------------------------------------------------------------
 * 迁移自 Firefly 主题的 src/components/pages/dynamic/DynamicFeed.svelte，
 * 是 /dynamic/ 页面的核心客户端组件。负责：
 *   1) 拉取 /api/dynamic.json（或第三方/Memos 数据源）数据；
 *   2) 提供客户端搜索（标题/正文/标签）、年份筛选、分页能力；
 *   3) 通过克隆 <template data-dynamic-item-template> 节点批量生成
 *      动态卡片，规避 Svelte each 块在大列表下的重渲染开销；
 *   4) 维护 URL ?page= 参数，支持刷新/直链访问保持状态；
 *   5) 注册图廊处理（参见 dynamic-gallery.ts）将 .dynamic-content img
 *      包裹为 <figure>，方便后续接入 lightbox。
 *
 * Props（由 index.astro 传入）：
 *   - source         数据源 URL（默认 /api/dynamic.json）
 *   - itemsPerPage   每页条数（默认 10）
 *   - showComments   是否注入 dynamic-inline-comments 节点
 *   - emptyText      无数据时的空态文案
 *   - noResultsText  搜索无结果时的提示文案
 *   - loadingText    加载中提示
 *   - allYearsText   年份下拉第一项文案
 *   - memos          可选 Memos 配置（保留扩展位，参考 Firefly）
 *
 * 与 DOM 的关键约定（依赖 index.astro 提供的节点）：
 *   - [data-dynamic-search]    搜索输入框（位于筛选栏）
 *   - [data-year-select]       年份下拉
 *   - [data-dynamic-page-count] 顶部动态总数徽标
 *   - [data-dynamic-item-template] 单条动态 DOM 模板
 *   - .dynamic-feed            列表挂载点（见本组件 <div bind:this={list}>）
 */
import { onMount, tick } from "svelte";
import { registerDynamicGallery } from "./dynamic-gallery";

/** 单张图数据（来自 markdown `![alt](src "title")` 解析结果） */
type DynamicImage = {
	alt: string;
	src: string;
	title?: string;
};

/** 单条动态数据类型，对应 /api/dynamic.json 的元素结构 */
type DynamicData = {
	id: string;
	published: number; // 时间戳（ms）
	html: string; // 渲染后的 HTML
	images: DynamicImage[];
	searchText: string; // 预计算的小写纯文本，用于过滤
	pinned?: boolean;
	tags: string[];
	location: string;
	device: string;
	author: string;
	avatar: string;
};

/** Memos 适配器配置（保留扩展，目前未启用） */
interface MemosConfig {
	enable: boolean;
	apiUrl: string;
	parent?: string;
}

/** 组件 Props（使用 Svelte 5 的 $props()） */
interface Props {
	source: string;
	itemsPerPage: number;
	showComments: boolean;
	emptyText: string;
	noResultsText: string;
	loadingText: string;
	allYearsText: string;
	timezone?: string;
	memos?: MemosConfig;
}

const {
	source,
	itemsPerPage,
	showComments,
	emptyText,
	noResultsText,
	loadingText,
	allYearsText,
	timezone = "UTC",
	memos,
}: Props = $props();

// ====== 状态 ======
/** 全部从 API 拉取到的动态条目 */
let entries = $state<DynamicData[]>([]);
/** 经搜索/筛选后的动态条目（驱动分页与渲染） */
let filtered = $state<DynamicData[]>([]);
/** 当前页码（1-based） */
let currentPage = $state(1);
/** 加载状态：用于显示 loading 占位 */
let loading = $state(true);
/** 加载失败标记：true 时显示 emptyText */
let failed = $state(false);
/** 模板节点是否就绪（onMount 中判断） */
let templateReady = $state(false);

/** 列表挂载点 DOM 引用 */
let list: HTMLElement;
/** 单条动态模板节点引用（取自 index.astro 的 <DynamicItemTemplate />） */
let template: HTMLTemplateElement | null = null;
/** 搜索输入框引用（取自 [data-dynamic-search]） */
let searchInput: HTMLInputElement | null = null;
/** 年份下拉引用（取自 [data-year-select]） */
let yearSelect: HTMLSelectElement | null = null;
/**
 * 加载完成后是否需要将滚动条定位到 URL hash 锚点。
 * 场景：直接访问 /dynamic/?page=2#dynamic-xxx 时，应在首屏渲染后跳转。
 */
let restoreAnchorAfterRender = false;

/**
 * 当前页应展示的条目（由 filtered + currentPage + itemsPerPage 派生）
 * 使用 Svelte 5 $derived：当任一依赖变化时自动重算并触发 $effect 重渲染。
 */
const pageEntries = $derived(
	filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
);

/** 总页数（最少 1，用于分页按钮边界判断） */
const totalPages = $derived(Math.max(1, Math.ceil(filtered.length / itemsPerPage)));

/**
 * 从 URL ?page= 读取当前页码，至少为 1。
 * 用于直接访问 /dynamic/?page=2 时保持页码状态。
 */
function pageFromUrl() {
	return Math.max(
		1,
		Number(new URL(window.location.href).searchParams.get("page")) || 1,
	);
}

/**
 * 将当前页码写回 URL（不产生历史记录）。
 * @param clearHash 是否清空 hash（分页时清空，避免锚点干扰）
 */
function updateUrl(clearHash = false) {
	const current = new URL(window.location.href);
	if (currentPage > 1) current.searchParams.set("page", String(currentPage));
	else current.searchParams.delete("page");
	if (clearHash) current.hash = "";
	history.replaceState(history.state, "", current);
}

/**
 * 应用搜索/年份筛选并刷新 filtered。
 * @param resetPage 是否将 currentPage 重置为 1（用户主动筛选时应为 true）
 */
function applyFilters(resetPage = true) {
	const query = searchInput?.value.toLocaleLowerCase().trim() || "";
	const year = yearSelect?.value || "all";
	filtered = entries.filter(
		(entry) =>
			(year === "all" ||
				String(new Date(entry.published).getFullYear()) === year) &&
			(!query || entry.searchText.includes(query)),
	);
	if (resetPage) currentPage = 1;
	const total = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
	// 防止 currentPage 越界（例如清空搜索结果后）
	currentPage = Math.min(currentPage, total);
	updateUrl(resetPage);
}

/**
 * 动态填充年份下拉：
 *  1) 清空已有 options；
 *  2) 添加「全部年份」选项；
 *  3) 收集 entries 中所有年份并去重倒序。
 */
function populateYears() {
	if (!yearSelect) return;
	yearSelect.replaceChildren();
	const all = document.createElement("option");
	all.value = "all";
	all.textContent = allYearsText;
	yearSelect.append(all);
	const years = [
		...new Set(
			entries.map((entry) => new Date(entry.published).getFullYear()),
		),
	].sort((a, b) => b - a);
	for (const year of years) {
		const option = document.createElement("option");
		option.value = String(year);
		option.textContent = String(year);
		yearSelect.append(option);
	}
}

/**
 * 将时间格式化为「YYYY/MM/DD HH:mm」格式。
 * 这里固定使用 zh-CN 区域，与原版 Firefly 行为一致。
 */
function formatDate(date: Date): string {
	return date.toLocaleDateString("zh-CN", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/**
 * 创建单条动态的 DOM 片段：
 *  1) 克隆 template 节点；
 *  2) 通过 [data-dynamic-*] 选择器填充字段；
 *  3) 注入锚点 ID（dynamic-<id>）以便 URL hash 定位；
 *  4) 处理可选字段（tags/location/device/pinned）的显隐；
 *  5) 注入评论组件 dataset（若 showComments 启用）。
 */
function createItem(entry: DynamicData) {
	if (!template) return null;
	const fragment = template.content.cloneNode(true) as DocumentFragment;
	const root = fragment.querySelector<HTMLElement>("[data-dynamic-entry]");
	if (!root) return null;
	// 生成 URL hash 友好的锚点 ID（替换非法字符为 -）
	const anchorId = `dynamic-${entry.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
	const permalinkUrl = new URL(window.location.href);
	permalinkUrl.hash = anchorId;
	const permalink = `${permalinkUrl.pathname}${permalinkUrl.search}${permalinkUrl.hash}`;
	root.id = anchorId;
	root.dataset.year = String(new Date(entry.published).getFullYear());

	// 填充作者名（同时设置 article 的 aria-labelledby）
	const author = root.querySelector<HTMLElement>("[data-dynamic-author]");
	if (author) {
		author.id = `${anchorId}-author`;
		root.querySelector("article")?.setAttribute("aria-labelledby", author.id);
		author.textContent = entry.author || "匿名";
	}

	// 填充头像
	const avatar = root.querySelector<HTMLImageElement>("[data-dynamic-avatar]");
	if (avatar && entry.avatar) {
		avatar.src = entry.avatar;
		avatar.alt = entry.author || "头像";
	}

	// 绑定永久链接点击：阻止默认行为，仅更新 hash（避免整页跳转）
	root
		.querySelectorAll<HTMLAnchorElement>("[data-dynamic-permalink]")
		.forEach((link) => {
			link.href = permalink;
			link.addEventListener("click", (event) => {
				// 修饰键或非左键点击时保持默认行为（新窗口/新标签）
				if (
					event.button !== 0 ||
					event.metaKey ||
					event.ctrlKey ||
					event.shiftKey ||
					event.altKey
				)
					return;
				event.preventDefault();
				event.stopPropagation();
				history.replaceState(history.state, "", permalink);
			});
		});

	// 填充发布时间
	const time = root.querySelector<HTMLTimeElement>("[data-dynamic-time]");
	if (time) {
		const date = new Date(entry.published);
		time.dateTime = date.toISOString();
		time.textContent = formatDate(date);
	}

	// 注入已渲染的 HTML 内容（来自 markdown 渲染）
	const content = root.querySelector<HTMLElement>("[data-dynamic-content]");
	if (content) {
		content.id = `${anchorId}-content`;
		content.innerHTML = entry.html;
	}

	// 渲染标签：无标签时整段隐藏
	const tagsContainer = root.querySelector<HTMLElement>("[data-dynamic-tags]");
	if (tagsContainer && entry.tags && entry.tags.length > 0) {
		tagsContainer.innerHTML = entry.tags
			.map((tag) => `<span class="moment-tag">#${tag}</span>`)
			.join("");
	} else if (tagsContainer) {
		tagsContainer.style.display = "none";
	}

	// 地点字段：无内容时隐藏
	const locationEl = root.querySelector<HTMLElement>("[data-dynamic-location]");
	if (locationEl) {
		if (entry.location) {
			const span = locationEl.querySelector("span");
			if (span) span.textContent = entry.location;
			locationEl.style.display = "";
		} else {
			locationEl.style.display = "none";
		}
	}

	// 设备字段：无内容时隐藏
	const deviceEl = root.querySelector<HTMLElement>("[data-dynamic-device]");
	if (deviceEl) {
		if (entry.device) {
			const span = deviceEl.querySelector("span");
			if (span) span.textContent = entry.device;
			deviceEl.style.display = "";
		} else {
			deviceEl.style.display = "none";
		}
	}

	// 图廊容器：无图片时隐藏，并记录 data-source-id 供后续 lightbox 绑定
	const gallery = root.querySelector<HTMLElement>("[data-dynamic-gallery]");
	if (gallery) {
		gallery.dataset.sourceId = `${anchorId}-content`;
		if (entry.images.length === 0) {
			gallery.style.display = "none";
		}
	}

	// 置顶标识：通过 hidden 属性控制可见性（避免频繁操作 style）
	const pinned = root.querySelector<HTMLElement>("[data-dynamic-pinned]");
	if (pinned) {
		if (entry.pinned) {
			pinned.removeAttribute("hidden");
		} else {
			pinned.setAttribute("hidden", "");
		}
	}

	// 评论组件：showComments=true 时挂载 dataset.src（指向评论页），否则移除节点
	const comments = root.querySelector<HTMLElement>("dynamic-inline-comments");
	if (comments) {
		if (showComments) {
			comments.dataset.src = `/dynamic/comments/?path=${encodeURIComponent(
				`/dynamic/${entry.id}/`,
			)}`;
		} else {
			comments.remove();
		}
	}

	return fragment;
}

/**
 * 渲染指定条目到列表容器：
 *  1) await tick() 等待 Svelte 完成挂载后再操作 DOM；
 *  2) 清空容器并逐条 append；
 *  3) 若需要在渲染后跳转锚点（首屏直链场景），执行 scrollIntoView；
 *  4) 调用 registerDynamicGallery() 重写 .dynamic-content img 为 figure 结构。
 */
async function renderItems(items: DynamicData[]) {
	await tick();
	if (!list || !template) return;
	list.replaceChildren();
	for (const entry of items) {
		const item = createItem(entry);
		if (item) list.append(item);
	}
	if (restoreAnchorAfterRender) {
		restoreAnchorAfterRender = false;
		const target = document.getElementById(
			decodeURIComponent(window.location.hash.slice(1)),
		);
		target?.scrollIntoView({ behavior: "auto", block: "start" });
	}
	registerDynamicGallery();
}

/**
 * 切换到指定页码：
 *  1) 更新 currentPage；
 *  2) 写回 URL（清空 hash）；
 *  3) 平滑滚动到页面顶部，提供分页视觉反馈。
 */
function goToPage(page: number) {
	currentPage = page;
	updateUrl(true);
	document
		.querySelector(".dynamic-page")
		?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * 响应式渲染：
 *  1) templateReady=false 时跳过（防止 onMount 之前执行）；
 *  2) pageEntries 是 $derived 派生值，其变化会触发本 effect 重渲染列表。
 */
$effect(() => {
	if (!templateReady) return;
	renderItems(pageEntries);
});

/**
 * 组件挂载阶段：
 *  1) 查找模板/筛选节点并缓存引用；
 *  2) 绑定 input/change 事件触发 applyFilters；
 *  3) 异步拉取数据并初始化页码/筛选状态；
 *  4) 若 URL 含 hash，自动跳转到对应锚点所在页码；
 *  5) onDestroy 清理事件监听。
 */
onMount(() => {
	// 缓存关键 DOM 引用（向上查找 .dynamic-page 容器以避免选择器污染）
	const page = list.closest(".dynamic-page");
	template =
		page?.querySelector<HTMLTemplateElement>("[data-dynamic-item-template]") ??
		null;
	templateReady = template !== null;
	searchInput =
		page?.querySelector<HTMLInputElement>("[data-dynamic-search]") ?? null;
	yearSelect =
		page?.querySelector<HTMLSelectElement>("[data-year-select]") ?? null;
	const filter = () => applyFilters();
	searchInput?.addEventListener("input", filter);
	yearSelect?.addEventListener("change", filter);

	// 异步加载数据
	const load = async () => {
		try {
			const response = await fetch(source);
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			entries = (await response.json()) as DynamicData[];
			// 同步更新顶部徽标
			const countEl = document.querySelector("[data-dynamic-page-count]");
			if (countEl) countEl.textContent = String(entries.length);
			populateYears();
			currentPage = pageFromUrl();
			// 应用筛选时保留 URL 中的页码（resetPage=false）
			applyFilters(false);
			// 直链锚点定位：若 URL 含 hash，则切到锚点所在页
			const anchorId = decodeURIComponent(window.location.hash.slice(1));
			if (anchorId) {
				const anchorIndex = filtered.findIndex(
					(entry) =>
						`dynamic-${entry.id.replace(/[^a-zA-Z0-9_-]/g, "-")}` === anchorId,
				);
				if (anchorIndex >= 0) {
					currentPage = Math.floor(anchorIndex / itemsPerPage) + 1;
					updateUrl();
					restoreAnchorAfterRender = true;
				}
			}
		} catch (error) {
			console.error("Failed to load dynamics", error);
			failed = true;
		} finally {
			loading = false;
		}
	};
	void load();

	// 组件卸载时清理事件监听
	return () => {
		searchInput?.removeEventListener("input", filter);
		yearSelect?.removeEventListener("change", filter);
	};
});
</script>

<!-- 状态视图：按优先级展示 loading / empty / no-results -->
{#if loading}
	<div class="dynamic-loading card-base" role="status">
		<span class="dynamic-loading-spinner" aria-hidden="true"></span>
		<p>{loadingText}</p>
	</div>
{:else if failed || entries.length === 0}
	<div class="dynamic-empty card-base">
		<p>{emptyText}</p>
	</div>
{:else if filtered.length === 0}
	<div class="dynamic-no-results card-base">
		<p>{noResultsText}</p>
	</div>
{/if}

<!-- 列表挂载点：renderItems() 会直接操作其子节点 -->
<div class="dynamic-feed" bind:this={list}></div>

<!-- 分页器：仅在多页时显示 -->
{#if !loading && !failed && totalPages > 1}
	<div class="dynamic-pagination">
		<button
			class="dynamic-page-btn"
			disabled={currentPage <= 1}
			onclick={() => goToPage(currentPage - 1)}
		>
			上一页
		</button>
		<span class="dynamic-page-info">
			{currentPage} / {totalPages}
		</span>
		<button
			class="dynamic-page-btn"
			disabled={currentPage >= totalPages}
			onclick={() => goToPage(currentPage + 1)}
		>
			下一页
		</button>
	</div>
{/if}
