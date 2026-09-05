// 区域屏蔽设置：路由开关已上移到 src/config/siteConfig.ts 顶部的 regionBlockRoutes
// ─────────────────────────────────────────────────────────────
// ★ 想调整大陆能否访问留言板等页面，请编辑 siteConfig.ts 里的 regionBlockRoutes：
//   · 构建时自动生成/更新 functions/ 下的 EdgeOne 边缘函数（被屏蔽地区访问
//     会被静默 302 回首页，真正拦截层）
//   · 前端自动隐藏全站指向这些页面的链接（导航栏/快速前往/快捷坞/页脚，按
//     边缘探测接口返回的真实国家码识别）
import { siteConfig } from "./siteConfig";

export const REGION_BLOCK_ROUTES: Record<string, boolean> =
	siteConfig.regionBlock.routes;

// 边缘函数拦截的客户端国家/地区码（ISO 3166-1 alpha-2）
export const REGION_BLOCKED_COUNTRY_CODES: string[] =
	siteConfig.regionBlock.countryCodes;

// ─────────────────────────────────────────────────────────────
// 以下为派生值，一般不需要改动

// 站内链接隐藏片段（"/guestbook/" → "guestbook"，供 CSS 选择器拼接 href*="/guestbook"）
export const REGION_BLOCKED_PAGES = Object.keys(REGION_BLOCK_ROUTES)
	.filter((route) => REGION_BLOCK_ROUTES[route])
	.map((route) => route.replace(/^\/|\/$/g, ""));
