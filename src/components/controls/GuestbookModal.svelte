<script lang="ts">
import { onMount, tick } from "svelte";
import Icon from "@/components/common/Icon.svelte";
import GuestbookChat, {
	type GuestbookSyncSnapshot,
} from "@/components/features/GuestbookChat.svelte";

// 同步状态快照（来自 GuestbookChat），用于合并到顶部标题栏
let syncSnapshot = $state<GuestbookSyncSnapshot>({
	totalCount: 0,
	initialLoading: true,
	lastSyncedAt: null,
	isOffline: false,
	syncing: false,
	syncError: "",
});

let isOpen = $state(false);
let chatMounted = $state(false);

/**
 * 格式化顶部标题栏中的同步时间。
 * 与原 GuestbookChat 内部标题栏保持一致。
 */
function formatSyncedAt(value: number | null): string {
	if (!value) return "等待同步";
	const date = new Date(value);
	const pad = (n: number) => n.toString().padStart(2, "0");
	return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatSyncStatus(snapshot: GuestbookSyncSnapshot): string {
	if (snapshot.isOffline) return "离线";
	if (snapshot.syncing) return "同步中";
	if (snapshot.syncError) return "同步失败";
	return "同步";
}

// 同步状态文案（在线：同步于/同步中/同步失败/等待同步；离线：离线）
const syncStatusText = $derived(formatSyncStatus(syncSnapshot));
const syncedAtText = $derived(formatSyncedAt(syncSnapshot.lastSyncedAt));
const messageCountText = $derived(
	syncSnapshot.initialLoading ? "--" : syncSnapshot.totalCount,
);

export function toggle() {
	isOpen = !isOpen;
	(window as any).__guestbookModalOpen = isOpen;
	if (isOpen) {
		tick().then(() => {
			chatMounted = true;
		});
	}
}

function close() {
	isOpen = false;
	(window as any).__guestbookModalOpen = false;
}

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "Escape" && isOpen) {
		close();
	}
}

// GuestbookChat 同步状态变更回调
function handleSyncChange(snapshot: GuestbookSyncSnapshot) {
	syncSnapshot = snapshot;
}

onMount(() => {
	const toggleHandler = () => toggle();
	window.addEventListener("toggle-guestbook", toggleHandler);
	window.addEventListener("keydown", handleKeydown);
	return () => {
		window.removeEventListener("toggle-guestbook", toggleHandler);
		window.removeEventListener("keydown", handleKeydown);
	};
});
</script>

{#if isOpen}
	<div class="ai-overlay guestbook-modal-overlay" onclick={close}>
		<div class="ai-panel guestbook-modal-panel" onclick={(e) => e.stopPropagation()}>
			<!-- 标题栏（已合并：原顶部标题 + 留言数量/同步信息） -->
			<div class="ai-header">
				<div class="ai-header__left">
					<span class="guestbook-header-icon">
						<Icon icon="material-symbols:edit-note" />
					</span>
					<span class="ai-header__name">留言板</span>
					<span class="ai-header__model">有什么想说的，留个言吧~</span>
					<span class="ai-header__divider" aria-hidden="true">|</span>
					<span
						class="ai-header__meta"
						class:is-offline={syncSnapshot.isOffline}
						class:is-failed={Boolean(syncSnapshot.syncError) && !syncSnapshot.isOffline}
					>
						· {messageCountText} 条留言 · {syncStatusText}
						{#if !syncSnapshot.isOffline && !syncSnapshot.syncError}
							{syncedAtText}
						{:else if !syncSnapshot.isOffline}
							· {syncedAtText}
						{/if}
						· 30 s
					</span>
				</div>
				<div class="ai-header__actions">
					<a href="/guestbook/" class="ai-icon-btn" title="打开完整页面">
						<Icon icon="material-symbols:open-in-new" />
					</a>
					<button class="ai-icon-btn" onclick={close} title="关闭">
						<Icon icon="material-symbols:close" />
					</button>
				</div>
			</div>

			<!-- 聊天室内容（内部标题栏已隐藏，留言数量/同步信息统一在此头部显示） -->
			<div class="guestbook-modal-content">
				{#if chatMounted}
					<GuestbookChat onSyncChange={handleSyncChange} />
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.guestbook-modal-overlay {
		backdrop-filter: blur(8px) !important;
		-webkit-backdrop-filter: blur(8px) !important;
		/* 强制 GPU 合成层，修复 Vercel 生产环境 backdrop-filter 失效问题 */
		transform: translateZ(0);
	}

	.guestbook-header-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		color: var(--primary);
	}

	/* 顶部标题栏中的信息模块：原下方标题栏"留言数 + 同步时间"合并到此 */
	.ai-header__divider {
		display: inline-block;
		margin: 0 0.25rem;
		color: var(--line-divider);
		opacity: 0.7;
	}

	.ai-header__meta {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.78rem;
		color: var(--text-muted, var(--secondary));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.ai-header__meta.is-offline {
		color: var(--danger, #ef4444);
	}

	.ai-header__meta.is-failed {
		color: var(--danger, #ef4444);
	}

	@media (max-width: 640px) {
		.ai-header__divider,
		.ai-header__meta {
			display: none;
		}
	}

	.guestbook-modal-content {
		flex: 1;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.guestbook-modal-content :global(.guestbook-chat) {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
		border: none;
		border-radius: 0;
		background: transparent;
	}

	/* 隐藏 GuestbookChat 内部标题栏，避免与弹窗顶部标题栏重复显示 */
	.guestbook-modal-content :global(.guestbook-chat__header) {
		display: none !important;
	}

	.guestbook-modal-content {
		--guestbook-sidebar-width: 14rem;
	}

	.guestbook-modal-content :global(.guestbook-chat__workspace) {
		flex: 1;
		min-height: 0;
		display: grid;
		grid-template-columns: minmax(0, 1fr) var(--guestbook-sidebar-width);
		/* 两行布局：第 1 行放公告栏（自动高度），第 2 行放聊天列 */
		grid-template-rows: auto minmax(0, 1fr);
	}

	/* 在弹窗中：公告栏占据第 1 行，作为正常文档流元素，不再覆盖在消息上方 */
	.guestbook-modal-content :global(.guestbook-chat__announcement-bar) {
		grid-column: 1;
		grid-row: 1;
		position: relative;
		top: auto;
		left: auto;
		right: auto;
		margin: var(--space-2) var(--space-2) 0;
		z-index: 1;
	}

	.guestbook-modal-content :global(.guestbook-chat__conversation) {
		grid-column: 1;
		grid-row: 2;
		min-height: 0;
		height: 100%;
	}

	/* 侧边栏横跨两行，保持完整高度 */
	.guestbook-modal-content :global(.guestbook-chat__sidebar) {
		grid-column: 2;
		grid-row: 1 / span 2;
	}

	.guestbook-modal-content :global(.guestbook-chat__messages) {
		padding: 0.75rem 1rem;
	}

	.guestbook-modal-content :global(.guestbook-chat__composer-area) {
		padding: 0.5rem 1rem 0.75rem;
	}

	.guestbook-modal-content :global(.guestbook-composer__editor) {
		border-radius: var(--radius-default);
	}

	.guestbook-modal-content :global(.guestbook-composer__footer) {
		padding: 0.35rem 0.6rem;
	}

	.guestbook-modal-content :global(.guestbook-message__bubble) {
		max-width: 88%;
	}

	.guestbook-modal-content :global(.guestbook-chat__sidebar) {
		position: relative;
		top: auto;
		right: auto;
		bottom: auto;
		transform: none;
		pointer-events: auto;
		border-left: 1px solid var(--line-divider);
		background: var(--float-panel);
	}

	.guestbook-modal-content :global(.guestbook-chat__sidebar-toggle),
	.guestbook-modal-content :global(.guestbook-chat__sidebar-overlay) {
		display: none !important;
	}

	.guestbook-modal-content :global(.guestbook-chat__sidebar-heading) {
		display: flex;
		min-height: 2.5rem;
		padding: 0 0.75rem;
	}

	.guestbook-modal-content :global(.guestbook-chat__sidebar-heading strong) {
		font-size: 0.85rem;
	}

	.guestbook-modal-content :global(.guestbook-chat__panel-title) {
		padding: 0.5rem 0.75rem 0.25rem;
		font-size: 0.75rem;
	}

	.guestbook-modal-content :global(.guestbook-chat__announcement) {
		padding: 0.4rem 0.75rem;
	}

	.guestbook-modal-content :global(.guestbook-chat__announcement strong) {
		font-size: 0.8rem;
	}

	.guestbook-modal-content :global(.guestbook-chat__announcement p) {
		font-size: 0.7rem;
	}

	.guestbook-modal-content :global(.guestbook-chat__member) {
		padding: 0.3rem 0.75rem;
		font-size: 0.75rem;
	}

	@media (max-width: 640px) {
		.guestbook-modal-content {
			--guestbook-sidebar-width: 12rem;
		}

		.guestbook-modal-content :global(.guestbook-chat__messages) {
			padding: 0.5rem 0.75rem;
		}

		.guestbook-modal-content :global(.guestbook-chat__composer-area) {
			padding: 0.4rem 0.75rem 0.6rem;
		}

		.guestbook-modal-content :global(.guestbook-message__bubble) {
			max-width: 92%;
		}
	}
</style>
