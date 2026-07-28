/**
 * 默认头像生成工具（纯函数，可在 SSR / 客户端脚本中复用）
 *
 * 三级容错链：
 *   1) userAvatar：博主自己提供的 imgurl（最高优先）
 *   2) dicebearUrl(seed)：DiceBear SVG 头像（按 name 生成，免费 + 跨域友好）
 *   3) inlineSvgAvatar(name)：内联 SVG 字母头像（data URI，永远不失败，零网络）
 *   4) Google favicon（最后兜底，需 onerror 链上使用）
 */

const DICEBEAR_BASE = "https://api.dicebear.com/7.x/notionists/svg";

/** DiceBear 头像 URL（按站点名/姓名生成） */
export function dicebearUrl(seed: string | undefined | null): string {
	const s = (seed || "guest").trim().toLowerCase();
	return `${DICEBEAR_BASE}?seed=${encodeURIComponent(s)}`;
}

/** 内联 SVG 字母头像（data URI，永远不失败） */
export function inlineSvgAvatar(name: string | undefined | null, size = 80): string {
	const text = (name || "?").trim().slice(0, 1).toUpperCase() || "?";
	// 用稳定哈希生成背景色（避免每次刷新颜色变）
	const hash = Array.from(text).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 0);
	const hue = hash % 360;
	const bg = `hsl(${hue}, 55%, 55%)`;
	const fg = "#fff";
	const fontSize = Math.round(size * 0.5);
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">` +
		`<rect width="${size}" height="${size}" fill="${bg}"/>` +
		`<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" ` +
		`font-family="-apple-system,Segoe UI,Roboto,sans-serif" font-weight="700" ` +
		`font-size="${fontSize}" fill="${fg}">${text}</text>` +
		`</svg>`;
	return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

/** Google favicon（按 host 拉取，最后兜底） */
export function googleFaviconUrl(host: string | undefined | null, size = 64): string {
	const h = (host || "").replace(/^www\./, "");
	if (!h) return inlineSvgAvatar("?");
	return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(h)}&sz=${size}`;
}

/**
 * 三级容错链：在 SSR 阶段选最稳的"主头像"
 *   userAvatar（博主提供）→ 加载失败才用 dicebear → 再失败才用内联 SVG
 *   用于：img 的 src 初始值（用 userAvatar），然后通过 onerror 链切换
 */
export function fallbackAvatar(name: string | undefined | null, userAvatar?: string): string {
	if (userAvatar && userAvatar.trim()) return userAvatar.trim();
	return dicebearUrl(name);
}

/** onerror 链第一跳（主头像失败时用） */
export function onErrorFirstJump(name: string | undefined | null): string {
	return dicebearUrl(name);
}

/** onerror 链第二跳（dicebear 失败时用，永远成功） */
export function onErrorSecondJump(name: string | undefined | null): string {
	return inlineSvgAvatar(name);
}
