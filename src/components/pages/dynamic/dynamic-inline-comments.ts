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
			imageUploadURL?: string;
			imageUploadToken?: string;
		};
	}
}

/** Waline init 函数类型 */
type WalineInit = (
	options: Record<string, unknown>,
) => { destroy: () => void } | null;

let walineModule: Promise<{ init: WalineInit }> | null = null;

/** 懒加载 Waline ESM 模块（仅首次调用时加载） */
function loadWaline(): Promise<{ init: WalineInit }> {
	if (!walineModule) {
		const cdnUrl = "https://unpkg.com/@waline/client@v3/dist/waline.js";
		walineModule = import(/* @vite-ignore */ cdnUrl) as Promise<{
			init: WalineInit;
		}>;
	}
	return walineModule;
}

/**
 * 根据当前页面 URL 路径自动生成图床上传文件夹
 * 规则：
 *   - 前缀统一为 fqzlrcom/
 *   - 取路径前 2 段作为子文件夹（最多 3 级：fqzlrcom + 2 段）
 *   - 超出部分截断，不再往下新建子目录
 *   - 根路径 / 或无法解析时，回退到 fqzlrcom/comments
 * 示例：
 *   /dynamic/                → fqzlrcom/dynamic
 *   /posts/blog/check-flink/ → fqzlrcom/posts/blog（截断第 3 段）
 *   /                        → fqzlrcom/comments（回退默认）
 */
function getUploadFolder(): string {
	const segments = window.location.pathname
		.split("/")
		.filter((s) => s.length > 0);
	if (segments.length === 0) return "fqzlrcom/comments";
	// 最多取前 2 段，超出截断
	return `fqzlrcom/${segments.slice(0, 2).join("/")}`;
}

/**
 * 构造图床 imageUploader（cfbed 规范）
 * POST {imageUploadURL}?uploadFolder=xxx，FormData { file }，Bearer Token 认证
 * 未配置时返回 undefined（Waline 回退为 base64 内嵌，128KB 限制）
 */
function buildImageUploader(
	uploadURL: string,
	token: string,
): ((file: File) => Promise<string>) | undefined {
	if (!uploadURL || !token) return undefined;
	return (file: File): Promise<string> => {
		const folder = getUploadFolder();
		const url = `${uploadURL}?uploadFolder=${encodeURIComponent(folder)}`;
		const formData = new FormData();
		formData.append("file", file);
		return fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/json",
			},
			body: formData,
		})
			.then((resp) => {
				if (!resp.ok) throw new Error(`图片上传失败: ${resp.status}`);
				return resp.json();
			})
			.then((data: unknown) => {
				// cfbed 响应格式: [{ src, publicUrl }] 或 { data: { links: { url } } }
				let url = "";
				if (Array.isArray(data) && data[0]) {
					url = data[0].publicUrl || data[0].src || "";
				} else {
					const record = data as Record<string, unknown>;
					const inner = record?.data as Record<string, unknown> | undefined;
					const links = inner?.links as Record<string, unknown> | undefined;
					if (typeof links?.url === "string") url = links.url;
					else if (typeof record?.src === "string") url = record.src;
				}
				if (!url) throw new Error("图床响应格式异常");
				// publicUrl 未配置时 src 是相对路径（如 /file/xxx.jpg），需拼接图床域名
				if (url.startsWith("/")) {
					url = new URL(uploadURL).origin + url;
				}
				return url;
			});
	};
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
				// 图床上传：配置后解除 Waline 默认 128KB base64 限制
				const imageUploader = buildImageUploader(
					config.imageUploadURL || "",
					config.imageUploadToken || "",
				);
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
					...(imageUploader ? { imageUploader } : {}),
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
