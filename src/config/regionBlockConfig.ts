// 区域屏蔽设置：选择哪些页面对中国大陆访问者屏蔽
// ─────────────────────────────────────────────────────────────
// ★ 在下面 REGION_BLOCK_ROUTES 里把对应页面路由设为 true（屏蔽）或
//   false（不屏蔽）即可，其余不用管：
//   · 构建时自动生成/更新 functions/ 下的 EdgeOne 边缘函数（大陆访问
//     返回 404，真正拦截层）
//   · 前端自动隐藏全站指向这些页面的链接（导航/快捷坞/页脚，按浏览器
//     时区识别大陆访问者）
// 路径写页面路由（带首尾斜杠），子页面单独列，例如 "/life/guestbook/"

export const REGION_BLOCK_ROUTES: Record<string, boolean> = {
	// 留言板
	"/guestbook/": true,
	// 生活的留言板
	"/life/guestbook/": true,
	// 赞助
	"/sponsor/": true,
	// 关于
	"/about/": false,
	// 动态
	"/dynamic/": true,
	// 相册
	"/gallery/": false,
	// 音乐
	"/music/": false,
	// 更新日志
	"/timeline/": true,
};

// 边缘函数拦截的客户端国家/地区码（ISO 3166-1 alpha-2）
export const REGION_BLOCKED_COUNTRY_CODES = ["CN"];

// ─────────────────────────────────────────────────────────────
// 以下为派生值，一般不需要改动

// 站内链接隐藏片段（"/guestbook/" → "guestbook"，供 CSS 选择器拼接 href*="/guestbook"）
export const REGION_BLOCKED_PAGES = Object.keys(REGION_BLOCK_ROUTES)
	.filter((route) => REGION_BLOCK_ROUTES[route])
	.map((route) => route.replace(/^\/|\/$/g, ""));
