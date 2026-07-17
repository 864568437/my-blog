<script lang="ts">
	import { onMount, tick } from "svelte";
	import Icon from "@/components/common/Icon.svelte";
	import { commentConfig } from "@/config";

	let isOpen = $state(false);
	let walineEl: HTMLDivElement;
	let initialized = $state(false);

	export function toggle() {
		isOpen = !isOpen;
		(window as any).__guestbookModalOpen = isOpen;
		if (isOpen) {
			tick().then(() => {
				initWaline();
			});
		}
	}

	function close() {
		isOpen = false;
		(window as any).__guestbookModalOpen = false;
	}

	async function initWaline() {
		if (initialized || !walineEl) return;

		const config = {
			...commentConfig.waline,
			el: walineEl,
			path: "/guestbook/",
			dark: "html.dark",
			wordLimit: ["2", "300"],
			...(commentConfig.waline?.visitorCount ? { pageview: true } : {}),
		};

		try {
			const mod = await import(/* @vite-ignore */ "https://unpkg.com/@waline/client@v3/dist/waline.js");
			mod.init(config);
			initialized = true;
		} catch (err) {
			console.error("Waline init failed:", err);
		}
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
	<link rel="stylesheet" href="https://unpkg.com/@waline/client@v3/dist/waline.css" />
	<div class="ai-overlay guestbook-modal-overlay" onclick={close}>
		<div
			class="ai-panel guestbook-modal-panel"
			onclick={(e) => e.stopPropagation()}
		>
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
					<a href="/life/guestbook/" class="ai-icon-btn" title="打开完整页面">
						<Icon icon="material-symbols:open-in-new" />
					</a>
					<button class="ai-icon-btn" onclick={close} title="关闭">
						<Icon icon="material-symbols:close" />
					</button>
				</div>
			</div>

			<!-- Waline 评论区 -->
			<div class="guestbook-modal-content">
				<div bind:this={walineEl} class="guestbook-modal-waline"></div>
			</div>
		</div>
	</div>
{/if}

<style>
	.guestbook-header-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		color: var(--primary);
	}

	.guestbook-modal-panel {
		padding: 0;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.guestbook-modal-content {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		scrollbar-gutter: stable;
	}

	.guestbook-modal-waline {
		width: 100%;
		min-height: 100%;
	}

	.guestbook-modal-waline :global(.wl-empty) {
		min-height: 0;
		padding: 2rem 0;
	}

	.guestbook-modal-waline :global(.wl-comment-actions) {
		display: none;
	}

	.guestbook-modal-waline :global(.wl-editor) {
		min-height: 80px;
	}

	.guestbook-modal-waline :global(.wl-card .wl-main) {
		padding: 0.5rem 0.75rem;
	}

	@media (max-width: 640px) {
		.guestbook-modal-content {
			padding: 0.75rem;
		}
	}
</style>
