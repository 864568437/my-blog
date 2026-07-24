/**
 * dynamic-gallery.ts —— 动态卡片内联图片归一化
 * --------------------------------------------------------------
 * DynamicFeed.svelte 每次 renderItems() 结束后都会调用本函数。
 *
 * 设计动机：
 *   动态正文（entry.html）由 Markdown 渲染而来，单张图片会被包裹在 <p>
 *   标签内（marked 默认行为）。在「朋友圈」风格布局下，单独一张图片
 *   应当撑满卡片宽度并支持 lightbox，而不是与段落文本混排。
 *
 * 实现要点：
 *   1) 仅处理正文（.dynamic-content / .moment-text）内的图片；
 *   2) 仅当 <img> 的直接父元素是 <p> 时才执行包裹（避免误伤多次重写）；
 *   3) 用 <figure class="dynamic-image-figure"> 替换原 <p>，保留图片 src/alt；
 *   4) 添加 loading="lazy" 进一步推迟非视口图片加载。
 *
 * 该函数是幂等的：第一次调用后再调用时，由于 <p> 已被替换，img 的
 * 父元素不再是 <p>，循环不会重复执行。
 *
 * 扩展建议：
 *   - 若要接入 PhotoSwipe / Fancybox 等 lightbox 库，可在本函数末尾
 *     通过 [data-source-id] 属性（由 DynamicFeed 写入）查询图廊节点
 *     并初始化交互。
 *   - 若需要支持多图网格，Firefly 原版实现了 grid-1/2/3 样式类，可
 *     参照 src/styles/dynamic.css 中 .moment-images.grid-* 选择器扩展。
 */
export function registerDynamicGallery() {
	// 仅选取正文区域内的图片，避免误处理头像/封面等其他图片
	const images = document.querySelectorAll<HTMLImageElement>(
		".dynamic-content img, .moment-text img",
	);
	images.forEach((img) => {
		// 已处理过的 <p> 不会再被命中（被替换为 <figure>），保证幂等
		if (img.parentElement?.tagName === "P") {
			const p = img.parentElement;
			const src = img.src;
			const alt = img.alt;
			const figure = document.createElement("figure");
			figure.className = "dynamic-image-figure";
			figure.innerHTML = `<img src="${src}" alt="${alt}" class="dynamic-image" loading="lazy" />`;
			// 整段替换 <p>，保留内部 <img> 的内容
			p.replaceWith(figure);
		}
	});
}
