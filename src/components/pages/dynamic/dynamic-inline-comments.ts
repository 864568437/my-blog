/**
 * dynamic-inline-comments.ts
 * --------------------------------------------------------------
 * 动态页内联评论：点击「评论」按钮后直接在面板中初始化 Waline 评论组件，
 * 无需 iframe，评论区融入动态卡片 DOM，视觉风格与动态页统一。
 *
 * 依赖：
 *   - Waline CDN（@waline/client@v3）
 *   - 页面需通过 window.__WALINE_CONFIG__ 注入 serverURL 等配置
 *   - 面板节点 [data-comment-panel] 作为 .moment-footer-row 的兄弟
 */

declare global {
	interface Window {
		__WALINE_CONFIG__?: {
			serverURL: string;
			lang?: string;
			emoji?: string[];
			login?: string;
			dark?: string;
			wordLimit?: [string, string] | number[];
			pageview?: boolean;
		};
	}
}

/** Waline init 函数类型 */
type WalineInit = (options: Record<string, unknown>) => { destroy: () => void } | null;

let walineModule: Promise<{ init: WalineInit }> | null = null;

/** 懒加载 Waline ESM 模块（仅首次调用时加载） */
function loadWaline(): Promise<{ init: WalineInit }> {
	if (!walineModule) {
		const cdnUrl = "https://unpkg.com/@waline/client@v3/dist/waline.js";
		walineModule = import(/* @vite-ignore */ cdnUrl) as Promise<{ init: WalineInit }>;
	}
	return walineModule;
}

export function registerDynamicInlineComments(): void {
	if (customElements.get("dynamic-inline-comments")) return;

	class DynamicInlineComments extends HTMLElement {
		private walineInstance: { destroy: () => void } | null = null;
		private loaded = false;

		connectedCallback() {
			if (this.dataset.ready) return;
			this.querySelector("[data-comment-toggle]")?.addEventListener(
				"click",
				() => this.toggle(),
			);
			this.dataset.ready = "true";
		}

		disconnectedCallback() {
			this.walineInstance?.destroy();
			this.walineInstance = null;
		}

		/** 获取关联的评论面板（向外查找兄弟节点） */
		private getPanel(): HTMLElement | null {
			const footerRow = this.closest(".moment-footer-row");
			if (footerRow) {
				return (
					footerRow.parentElement?.querySelector<HTMLElement>(
						"[data-comment-panel]",
					) || null
				);
			}
			return this.querySelector<HTMLElement>("[data-comment-panel]");
		}

		private toggle() {
			const panel = this.getPanel();
			if (!panel) return;
			const willOpen = panel.hidden;
			panel.hidden = !willOpen;
			this.dataset.expanded = String(willOpen);
			if (willOpen && !this.loaded) this.initWaline(panel);
		}

		private async initWaline(panel: HTMLElement) {
			this.loaded = true;
			const config = window.__WALINE_CONFIG__;
			if (!config?.serverURL) {
				panel.innerHTML =
					'<p style="color:var(--text-secondary);font-size:0.85rem;padding:0.5rem 0;">评论系统未配置</p>';
				return;
			}

			// 创建 Waline 挂载容器
			const el = document.createElement("div");
			el.className = "dynamic-waline";
			panel.append(el);

			try {
				const { init } = await loadWaline();
				this.walineInstance = init({
					el,
					serverURL: config.serverURL,
					path: this.dataset.path || window.location.pathname,
					lang: config.lang || "zh-CN",
					emoji: config.emoji || [
						"https://unpkg.com/@waline/emojis@1.4.0/weibo",
					],
					login: config.login || "enable",
					dark: config.dark || "html.dark",
					wordLimit: config.wordLimit || ["2", "300"],
					...(config.pageview ? { pageview: true } : {}),
				});
			} catch (error) {
				console.error("[DynamicComments] Waline init failed:", error);
				el.innerHTML =
					'<p style="color:var(--text-secondary);font-size:0.85rem;padding:0.5rem 0;">评论加载失败</p>';
			}
		}
	}

	customElements.define("dynamic-inline-comments", DynamicInlineComments);
}
