<script lang="ts">
/**
 * 普通的列表/网格布局切换按钮
 * - 同步 localStorage "postListLayout"
 * - 派发 "layoutChange" 自定义事件，文章列表组件会监听
 * - Swup 兼容：通过 astro:page-load 事件重新读取 storage
 */
interface Props {
	activeLayout?: "list" | "grid";
	class?: string;
}

let { activeLayout = "list", class: className = "" }: Props = $props();

let mounted = $state(false);
let current = $state<"list" | "grid">(activeLayout);
let isSwitching = $state(false);
let isSmallScreen = $state(false);

function applyLayout(next: "list" | "grid") {
	if (current === next) return;
	current = next;
	try {
		localStorage.setItem("postListLayout", next);
	} catch {}
	window.dispatchEvent(
		new CustomEvent("layoutChange", { detail: { layout: next } }),
	);
}

function toggle() {
	if (isSwitching) return;
	isSwitching = true;
	const next = current === "list" ? "grid" : "list";
	applyLayout(next);
	setTimeout(() => {
		isSwitching = false;
	}, 320);
}

function checkScreenSize() {
	if (typeof window === "undefined") return;
	isSmallScreen = window.innerWidth < 1200;
	if (isSmallScreen) {
		applyLayout("list");
	}
}

function initFromStorage() {
	if (typeof localStorage === "undefined") return;
	const saved = localStorage.getItem("postListLayout");
	if (saved === "list" || saved === "grid") {
		current = saved;
	}
}

$effect(() => {
	if (typeof window === "undefined") return;
	mounted = true;
	checkScreenSize();
	initFromStorage();
	window.addEventListener("resize", checkScreenSize);
	document.addEventListener("astro:page-load", initFromStorage);
	return () => {
		window.removeEventListener("resize", checkScreenSize);
		document.removeEventListener("astro:page-load", initFromStorage);
	};
});
</script>

{#if mounted && !isSmallScreen}
	<button
		type="button"
		aria-label="切换文章列表布局"
		title={current === "list" ? "切换到网格视图" : "切换到列表视图"}
		class={["layout-switch", { "is-switching": isSwitching }, className]}
		onclick={toggle}
		disabled={isSwitching}
	>
		{#if current === "list"}
			<!-- 列表态：展示网格图标（点击可切换到网格） -->
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
				stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<rect x="3" y="3" width="7" height="7" rx="1.2" />
				<rect x="14" y="3" width="7" height="7" rx="1.2" />
				<rect x="3" y="14" width="7" height="7" rx="1.2" />
				<rect x="14" y="14" width="7" height="7" rx="1.2" />
			</svg>
		{:else}
			<!-- 网格态：展示列表图标（点击可切换到列表） -->
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
				stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<line x1="4" y1="6" x2="20" y2="6" />
				<line x1="4" y1="12" x2="20" y2="12" />
				<line x1="4" y1="18" x2="20" y2="18" />
			</svg>
		{/if}
	</button>
{/if}

<style>
	.layout-switch {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		padding: 0;
		border: 1px solid var(--sidebar-card-border, var(--line-divider));
		border-radius: 0.625rem;
		background: var(--card-mix-overlay, transparent);
		color: var(--content-meta);
		cursor: pointer;
		transition:
			color 0.2s ease,
			border-color 0.2s ease,
			background-color 0.2s ease,
			transform 0.2s ease;
	}

	.layout-switch:hover:not(:disabled) {
		color: var(--primary);
		border-color: var(--primary);
		transform: translateY(-1px);
	}

	.layout-switch:active:not(:disabled) {
		transform: translateY(0) scale(0.96);
	}

	.layout-switch:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.layout-switch svg {
		width: 1.15rem;
		height: 1.15rem;
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.layout-switch.is-switching svg {
		animation: layout-switch-spin 0.32s ease;
	}

	@keyframes layout-switch-spin {
		0% { transform: rotate(0deg) scale(1); }
		50% { transform: rotate(90deg) scale(0.85); }
		100% { transform: rotate(180deg) scale(1); }
	}

	@media (prefers-reduced-motion: reduce) {
		.layout-switch.is-switching svg {
			animation: none;
		}
	}
</style>
