import sitemap from "@astrojs/sitemap";
import { oddmisc } from "oddmisc/astro";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import swup from "@swup/astro";
import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import expressiveCode from "astro-expressive-code";
import icon from "astro-icon";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeComponents from "rehype-components"; /* Render the custom directive content */
import rehypeKatex from "rehype-katex";
import katex from "katex";
import "katex/dist/contrib/mhchem.mjs"; // 加载 mhchem 扩展
import rehypeSlug from "rehype-slug";
import remarkDirective from "remark-directive"; /* Handle directives */
import remarkMath from "remark-math";
import rehypeCallouts from "rehype-callouts";
import remarkSectionize from "remark-sectionize";
import { expressiveCodeConfig, siteConfig } from "./src/config";
import { i18n } from "./src/i18n/translation";
import I18nKey from "./src/i18n/i18nKey";
import { pluginLanguageBadge } from "expressive-code-language-badge"; /* Language Badge */
import { pluginCollapsible } from "expressive-code-collapsible"; /* Collapsible */
import { GithubCardComponent } from "./src/plugins/rehype-component-github-card.mjs";
import { rehypeMermaid } from "./src/plugins/rehype-mermaid.mjs";
import { parseDirectiveNode } from "./src/plugins/remark-directive-rehype.js";
import { remarkExcerpt } from "./src/plugins/remark-excerpt.js";
import { remarkMermaid } from "./src/plugins/remark-mermaid.js";
import { remarkReadingTime } from "./src/plugins/remark-reading-time.mjs";
import mdx from "@astrojs/mdx";
import rehypeEmailProtection from "./src/plugins/rehype-email-protection.mjs";
import rehypeExternalLinks from "./src/plugins/rehype-external-links.mjs";
import rehypeFigure from "./src/plugins/rehype-figure.mjs";
import { remarkWikiLink } from "./src/plugins/remark-wiki-link.js";

// https://astro.build/config

/**
 * dev 下接管 /api/github 的 Vite 中间件。
 *
 * 为什么需要：静态输出模式下 src/pages/api/github.ts 默认按预渲染路由处理，
 * astro dev 的静态路由中间件会丢弃 POST body 和 Content-Type，导致在线编辑
 * 代理全部报 "Invalid JSON body"。构建不受影响（apply: "serve" 仅 dev 生效），
 * 线上由 Cloudflare Worker 的 run_worker_first 接管该路径。
 */
function githubProxyDevPlugin() {
	return {
		name: "github-proxy-dev",
		apply: "serve",
		configureServer(server) {
			server.middlewares.use("/api/github", async (req, res, next) => {
				try {
					const chunks = [];
					for await (const chunk of req) chunks.push(chunk);
					const rawBody = Buffer.concat(chunks).toString("utf-8");
					const hasBody = !["GET", "HEAD", "OPTIONS"].includes(req.method);
					const request = new Request(new URL(req.url, "http://localhost"), {
						method: req.method,
						headers: req.headers,
						body: hasBody && rawBody ? rawBody : undefined,
					});
					const mod = await server.ssrLoadModule("/src/pages/api/github.ts");
					const handler = mod[req.method] || mod.GET;
					if (!handler) {
						next();
						return;
					}
					const response = await handler({ request });
					res.statusCode = response.status;
					response.headers.forEach((value, key) => res.setHeader(key, value));
					res.end(Buffer.from(await response.arrayBuffer()));
				} catch (err) {
					next(err);
				}
			});
		},
	};
}

/**
 * dev 下接管 /api/ai-chat 的 Vite 中间件。
 *
 * 为什么不复用 githubProxyDevPlugin：那个插件用
 * res.end(await response.arrayBuffer()) 把整个响应一次性缓冲后再吐出，
 * 对 SSE 来说等于把流式变成了「等全部生成完再一次性显示」。这里必须
 * 逐块 res.write()，才能让 AI 回答逐字出现。
 */
function aiProxyDevPlugin() {
	return {
		name: "ai-proxy-dev",
		apply: "serve",
		configureServer(server) {
			server.middlewares.use("/api/ai-chat", async (req, res, next) => {
				try {
					const chunks = [];
					for await (const chunk of req) chunks.push(chunk);
					const rawBody = Buffer.concat(chunks).toString("utf-8");
					const hasBody = !["GET", "HEAD", "OPTIONS"].includes(req.method);
					// 必须带上真实 host（含端口）：ai-proxy 的同源校验要比对
					// Origin 与请求 URL 的 host，写死 http://localhost 会丢端口而误判 403
					const origin = `http://${req.headers.host || "localhost"}`;
					const request = new Request(new URL(req.url, origin), {
						method: req.method,
						headers: req.headers,
						body: hasBody && rawBody ? rawBody : undefined,
					});
					const mod = await server.ssrLoadModule("/src/pages/api/ai-chat.ts");
					const handler = mod[req.method] || mod.GET;
					if (!handler) {
						next();
						return;
					}
					const response = await handler({ request });
					res.statusCode = response.status;
					response.headers.forEach((value, key) => res.setHeader(key, value));
					if (!response.body) {
						res.end();
						return;
					}
					// 逐块转发，保持流式（不能用 arrayBuffer 缓冲）
					const reader = response.body.getReader();
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						res.write(Buffer.from(value));
					}
					res.end();
				} catch (err) {
					next(err);
				}
			});
		},
	};
}

export default defineConfig({
	site: siteConfig.site_url,

	base: "/",
	trailingSlash: "always",

	// 图像优化配置
	image: {
		// 全局响应式布局
		experimentalLayout: "constrained",
	},

	integrations: [
		oddmisc({
			umami: {
				shareUrl: "https://umami.fqzlr.com/share/kHCJG2ZUL1r6q5Js",
			},
		}),
		swup({
			theme: false,
			animationClass: "transition-swup-", // see https://swup.js.org/options/#animationselector
			// the default value `transition-` cause transition delay
			// when the Tailwind class `transition-all` is used
			containers: [
				"#banner-overlay-container",
				"#banner-dim-container",
				"#swup-container",
				"#left-sidebar-dynamic",
				"#right-sidebar-dynamic",
			],
			smoothScrolling: false,
			cache: true,
			preload: true,
			accessibility: true,
			updateHead: true,
			updateBodyClass: false,
			globalInstance: true,
			// 滚动相关配置优化
			resolveUrl: (url) => url,
			animateHistoryBrowsing: false,
			skipPopStateHandling: (event) => {
				// 跳过锚点链接的处理，让浏览器原生处理
				return event.state && event.state.url && event.state.url.includes("#");
			},
		}),
		icon({
			include: {
				"material-symbols": ["*"],
				"fa7-brands": ["*"],
				"fa7-regular": ["*"],
				"fa7-solid": ["*"],
				"simple-icons": ["*"], 
				mdi: ["*"],
			},
		}),
		expressiveCode({
			themes: [expressiveCodeConfig.darkTheme, expressiveCodeConfig.lightTheme],
			useDarkModeMediaQuery: false,
			themeCssSelector: (theme) => `[data-theme='${theme.name}']`,
			plugins: [
				pluginLanguageBadge(),
				pluginCollapsibleSections(),
				pluginLineNumbers(),
				// pluginCollapsible 配置 - 从expressiveCodeConfig读取设置，使用i18n文本
				...(expressiveCodeConfig.pluginCollapsible?.enable === true
					? [
							pluginCollapsible({
								lineThreshold: expressiveCodeConfig.pluginCollapsible.lineThreshold || 15,
								previewLines: expressiveCodeConfig.pluginCollapsible.previewLines || 8,
								defaultCollapsed: expressiveCodeConfig.pluginCollapsible.defaultCollapsed ?? true,
								expandButtonText: i18n(I18nKey.codeCollapsibleShowMore),
								collapseButtonText: i18n(I18nKey.codeCollapsibleShowLess),
								expandedAnnouncement: i18n(I18nKey.codeCollapsibleExpanded),
								collapsedAnnouncement: i18n(I18nKey.codeCollapsibleCollapsed),
							}),
						]
					: []),
			],
			defaultProps: {
				wrap: false,
				overridesByLang: {
					shellsession: {
						showLineNumbers: false,
					},
				},
			},
			styleOverrides: {
				borderRadius: "0.75rem",
				codeFontSize: "0.875rem",
				codeFontFamily:
					"'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
				codeLineHeight: "1.5rem",
				frames: {},
				textMarkers: {
					delHue: 0,
					insHue: 180,
					markHue: 250,
				},
				languageBadge: {
					fontSize: "0.75rem",
					fontWeight: "bold",
					borderRadius: "0.25rem",
					opacity: "1",
					borderWidth: "0px",
					borderColor: "transparent",
				},
			},
			frames: {
				showCopyToClipboardButton: true,
			},
		}),
		svelte(),
		sitemap({
			filter: (page) => {
				// 根据页面开关配置过滤sitemap
				const url = new URL(page);
				const pathname = url.pathname;

				if (pathname === "/sponsor/" && !siteConfig.pages.sponsor) {
					return false;
				}
				if (pathname === "/guestbook/" && !siteConfig.pages.guestbook) {
					return false;
				}
				if (pathname === "/bangumi/" && !siteConfig.pages.bangumi) {
					return false;
				}

				return true;
			},
		}),
		mdx({
			processor: unified({
				gfm: true,
				smartypants: true,
				remarkPlugins: [
					remarkMath,
					remarkReadingTime,
					remarkWikiLink,
					remarkExcerpt,
					remarkDirective,
					remarkSectionize,
					parseDirectiveNode,
					remarkMermaid,
				],
				rehypePlugins: [
					[rehypeKatex, { katex }],
					[rehypeCallouts, { theme: siteConfig.rehypeCallouts.theme }],
					rehypeSlug,
					rehypeMermaid,
					rehypeFigure,
					[rehypeExternalLinks, { siteUrl: siteConfig.site_url }],
					[rehypeEmailProtection, { method: "base64" }],
					[
						rehypeComponents,
						{
							components: {
								github: GithubCardComponent,
							},
						},
					],
					[
						rehypeAutolinkHeadings,
						{
							behavior: "append",
							properties: {
								className: ["anchor"],
							},
							content: {
								type: "element",
								tagName: "span",
								properties: {
									className: ["anchor-icon"],
									"data-pagefind-ignore": true,
								},
								children: [
									{
										type: "text",
										value: "#",
									},
								],
							},
						},
					],
				],
			}),
		}),
	],
	markdown: {
		processor: unified({
			gfm: true,
			smartypants: true,
			remarkPlugins: [
				remarkMath,
				remarkReadingTime,
				remarkWikiLink,
				remarkExcerpt,
				remarkDirective,
				remarkSectionize,
				parseDirectiveNode,
				remarkMermaid,
			],
			rehypePlugins: [
				[rehypeKatex, { katex }],
				[rehypeCallouts, { theme: siteConfig.rehypeCallouts.theme }],
				rehypeSlug,
				rehypeMermaid,
				rehypeFigure,
				[rehypeExternalLinks, { siteUrl: siteConfig.site_url }],
				[rehypeEmailProtection, { method: "base64" }], // 邮箱保护插件，支持 'base64' 或 'rot13'
				[
					rehypeComponents,
					{
						components: {
							github: GithubCardComponent,
						},
					},
				],
				[
					rehypeAutolinkHeadings,
					{
						behavior: "append",
						properties: {
							className: ["anchor"],
						},
						content: {
							type: "element",
							tagName: "span",
							properties: {
								className: ["anchor-icon"],
								"data-pagefind-ignore": true,
							},
							children: [
								{
									type: "text",
									value: "#",
								},
							],
						},
					},
				],
			],
		}),
	},
	vite: {
		plugins: [
			tailwindcss(),
			githubProxyDevPlugin(),
			aiProxyDevPlugin(),
		],
		optimizeDeps: {
			include: [
				"three",
				"three/examples/jsm/controls/OrbitControls.js",
			],
		},
		define: {
			__VUE_OPTIONS_API__: true,
			__VUE_PROD_DEVTOOLS__: false,
			__VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
		},
		resolve: {
			alias: {
				"@rehype-callouts-theme": `rehype-callouts/theme/${siteConfig.rehypeCallouts.theme}`,
			},
		},
		build: {
			// 启用资源压缩和优化
			minify: "terser",
			terserOptions: {
				compress: {
					drop_console: false, // 生产环境可改为true移除console
					drop_debugger: true,
				},
				mangle: true,
				format: {
					comments: false,
				},
			},
			rollupOptions: {
				onwarn(warning, warn) {
					// temporarily suppress this warning
					if (
						warning.message.includes("is dynamically imported by") &&
						warning.message.includes("but also statically imported by")
					) {
						return;
					}
					warn(warning);
				},
			},
			// CSS 优化
			cssCodeSplit: true,
			cssMinify: true,
			// 资源大小限制 - 减少内联资源
			assetsInlineLimit: 4096,
			// 减少源映射大小（可选，生产环境改为false）
			sourcemap: false,
			// 并行处理构建
			workers: 4,
		},
	},
});
