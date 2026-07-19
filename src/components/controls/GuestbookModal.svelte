<script lang="ts">
	import { onMount, tick } from "svelte";
	import Icon from "@/components/common/Icon.svelte";
	import GuestbookChat from "@/components/features/GuestbookChat.svelte";

	let isOpen = $state(false);
	let chatMounted = $state(false);

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
			<!-- 标题栏 -->
			<div class="ai-header">
				<div class="ai-header__left">
					<span class="guestbook-header-icon">
						<Icon icon="material-symbols:edit-note" />
					</span>
					<span class="ai-header__name">留言板</span>
					<span class="ai-header__model">有什么想说的，留个言吧~</span>
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

			<!-- 聊天室内容 -->
			<div class="guestbook-modal-content">
				{#if chatMounted}
					<GuestbookChat />
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.guestbook-modal-overlay {
		backdrop-filter: blur(8px) !important;
		-webkit-backdrop-filter: blur(8px) !important;
	}

	.guestbook-header-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		color: var(--primary);
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

	.guestbook-modal-content :global(.guestbook-chat__header) {
		padding: 0.5rem 1rem;
		border-bottom: 1px solid var(--line-divider);
		flex-shrink: 0;
	}

	.guestbook-modal-content :global(.guestbook-chat__title-row h2) {
		font-size: 1rem;
	}

	.guestbook-modal-content {
		--guestbook-sidebar-width: 14rem;
	}

	.guestbook-modal-content :global(.guestbook-chat__workspace) {
		flex: 1;
		min-height: 0;
		display: grid;
		grid-template-columns: minmax(0, 1fr) var(--guestbook-sidebar-width);
	}

	.guestbook-modal-content :global(.guestbook-chat__conversation) {
		min-height: 0;
		height: auto;
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

		.guestbook-modal-content :global(.guestbook-chat__header) {
			padding: 0.4rem 0.75rem;
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
