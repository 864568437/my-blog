/**
 * remark-wiki-link — Obsidian 风格 Wiki Link 插件
 * 移植自 Firefly 主题（https://github.com/CuteLeaf/Firefly）
 *
 * - `[[slug]]` 单独成段 → 文章链接卡片（标题/描述/日期/分类/标签/封面）
 * - 行内 `[[slug]]` → 普通链接，文字为目标文章标题
 * - `[[slug|alias]]` / `[[slug#heading]]` → 始终渲染为普通链接
 */

import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { slug } from "github-slugger";
import matter from "gray-matter";
import { coverImageConfig } from "../config/coverImageConfig";

// ─── 封面图工具（内联自 image-utils，避免 @/ 别名在插件上下文无法解析） ───
const { randomCoverImage } = coverImageConfig;

function getSeedHash(seed) {
	return seed
		? Math.abs(
				seed.split("").reduce((acc, char) => {
					return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
				}, 0),
			)
		: 0;
}

function appendSeedParam(apiUrl, hash) {
	if (hash === 0) return apiUrl;
	const separator = apiUrl.includes("?") ? "&" : "?";
	return `${apiUrl}${separator}v=${hash}`;
}

function processCoverImageSync(image, seed) {
	if (!image || image !== "api") return image || "";
	if (!randomCoverImage.enable || !randomCoverImage.apis?.length) return "";
	const hash = getSeedHash(seed);
	const apiIndex = hash % randomCoverImage.apis.length;
	return appendSeedParam(randomCoverImage.apis[apiIndex], hash);
}

function getApiUrlList(image, seed) {
	if (image !== "api" || !randomCoverImage.enable || !randomCoverImage.apis) {
		return [];
	}
	const hash = getSeedHash(seed);
	return randomCoverImage.apis.map((api) => appendSeedParam(api, hash));
}

const POSTS_DIR = fileURLToPath(new URL("../content/posts/", import.meta.url));
const MARKDOWN_EXTENSION = /\.(?:md|mdx|markdown)$/i;
const WIKI_LINK = /!?\[\[([^[\]\n]+)\]\]/g;
const STANDALONE_WIKI_LINK = /^\[\[([^[\]\n]+)\]\]$/;
const SKIPPED_NODE_TYPES = new Set([
	"link",
	"linkReference",
	"mdxJsxFlowElement",
	"mdxJsxTextElement",
]);

const frontmatterCache = new Map();

function normalizeContentPath(value) {
	const contentPath = value
		.trim()
		.replaceAll("\\", "/")
		.replace(/^\.?\//, "")
		.replace(/\/+$/, "")
		.replace(MARKDOWN_EXTENSION, "");
	const segments = contentPath.split("/").filter(Boolean);

	if (
		segments.length === 0 ||
		segments.some((segment) => segment === "." || segment === "..")
	) {
		return "";
	}

	const withoutPrefix = segments[0] === "posts" ? segments.slice(1) : segments;

	return withoutPrefix.length > 0 ? withoutPrefix.join("/") : "";
}

function createPostUrl(contentPath, meta) {
	// 若 frontmatter 设置了自定义 slug，文章的实际访问路由以 slug 为准
	// （见 pages/posts/[...slug].astro，文件路径路由此时不会生成），
	// 因此必须用 slug 构造 URL，否则链接会 404。
	const customSlug =
		typeof meta?.data.slug === "string" ? meta.data.slug.trim() : "";

	let segments;
	if (customSlug) {
		segments = customSlug.replace(/^\/+|\/+$/g, "").split("/");
	} else {
		segments = contentPath.split("/");
		if (segments.at(-1)?.toLowerCase() === "index") {
			segments.pop();
		}
	}

	const encodedPath = segments
		.filter(Boolean)
		.map((segment) => encodeURIComponent(segment))
		.join("/");

	return `/posts/${encodedPath ? `${encodedPath}/` : ""}`;
}

function readPostMeta(contentPath) {
	const candidates = [
		`${contentPath}.md`,
		`${contentPath}.mdx`,
		`${contentPath}.markdown`,
		`${contentPath}/index.md`,
		`${contentPath}/index.mdx`,
	];

	for (const candidate of candidates) {
		const filePath = path.join(POSTS_DIR, candidate);
		let stats;
		try {
			stats = statSync(filePath);
		} catch {
			continue;
		}
		if (!stats.isFile()) {
			continue;
		}

		const cached = frontmatterCache.get(filePath);
		if (cached && cached.mtimeMs === stats.mtimeMs) {
			return cached.meta;
		}

		let data;
		try {
			data = matter(readFileSync(filePath, "utf8")).data ?? {};
		} catch {
			return null;
		}

		const meta = { filePath, data };
		frontmatterCache.set(filePath, { mtimeMs: stats.mtimeMs, meta });
		return meta;
	}

	return null;
}

function formatPublishedDate(value) {
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return value.toISOString().slice(0, 10);
	}
	if (typeof value === "string") {
		const match = value.match(/^\d{4}-\d{2}-\d{2}/);
		if (match) {
			return match[0];
		}
	}
	return "";
}

function createRemoteCoverImg(src, extraProperties) {
	return createElement(
		"img",
		{
			src,
			alt: "",
			loading: "lazy",
			decoding: "async",
			...extraProperties,
		},
		[],
	);
}

function createCoverNode(meta, parsed, context) {
	const image =
		typeof meta.data.image === "string" ? meta.data.image.trim() : "";

	if (!image) {
		return null;
	}

	// 随机封面图 API：复用 CoverImage 的 data-api-urls 客户端重试机制
	if (image === "api") {
		const seed = parsed.contentPath.replace(/\/index$/i, "");
		const firstUrl = processCoverImageSync(image, seed);
		if (!firstUrl) {
			return null;
		}
		const apiUrls = getApiUrlList(image, seed);
		return createElement(
			"div",
			{
				class: "cover-image-container",
				dataApiUrls: apiUrls.length > 0 ? JSON.stringify(apiUrls) : undefined,
			},
			[
				createRemoteCoverImg(firstUrl, {
					dataCoverImg: "true",
					dataRemote: "true",
				}),
			],
		);
	}

	// 外链或 public 目录下的封面：直接输出 img，不经过构建期图片管线
	if (/^(?:https?:)?\/\//i.test(image) || image.startsWith("/")) {
		return createRemoteCoverImg(image);
	}

	if (!context.currentDir) {
		return null;
	}

	const absolutePath = path.resolve(path.dirname(meta.filePath), image);
	try {
		if (!statSync(absolutePath).isFile()) {
			return null;
		}
	} catch {
		return null;
	}

	const relativePath = path
		.relative(context.currentDir, absolutePath)
		.replaceAll("\\", "/");
	const coverUrl = relativePath.startsWith(".")
		? relativePath
		: `./${relativePath}`;

	// 走 Astro 图片管线，width:480 生成小尺寸缩略图
	return {
		type: "image",
		url: coverUrl,
		alt: "",
		data: { hProperties: { width: 480 } },
	};
}

function parseWikiLinkValue(value) {
	const aliasSeparator = value.indexOf("|");
	const destination = (
		aliasSeparator === -1 ? value : value.slice(0, aliasSeparator)
	).trim();
	const alias =
		aliasSeparator === -1 ? "" : value.slice(aliasSeparator + 1).trim();

	if (!destination) {
		return null;
	}

	const headingSeparator = destination.indexOf("#");
	const pageName =
		headingSeparator === -1
			? destination
			: destination.slice(0, headingSeparator).trim();
	const heading =
		headingSeparator === -1
			? ""
			: destination.slice(headingSeparator + 1).trim();
	const contentPath = pageName ? normalizeContentPath(pageName) : "";

	if ((pageName && !contentPath) || (!contentPath && !heading)) {
		return null;
	}

	return { destination, alias, contentPath, heading };
}

function createElement(tagName, properties, children) {
	return {
		type: "paragraph",
		data: { hName: tagName, hProperties: properties },
		children,
	};
}

function createText(value) {
	return { type: "text", value };
}

function createWikiLinkCard(parsed, context) {
	const meta = readPostMeta(parsed.contentPath);
	if (!meta) {
		return null;
	}

	const title =
		typeof meta.data.title === "string" && meta.data.title
			? meta.data.title
			: parsed.contentPath;
	const encrypted =
		typeof meta.data.password === "string" && meta.data.password.length > 0;
	const description =
		!encrypted && typeof meta.data.description === "string"
			? meta.data.description.trim()
			: "";
	const published = formatPublishedDate(meta.data.published);
	const category =
		typeof meta.data.category === "string" ? meta.data.category.trim() : "";
	const tags = Array.isArray(meta.data.tags)
		? meta.data.tags.filter((tag) => typeof tag === "string" && tag)
		: [];

	// 元信息行（分类 + 日期），顺序与列表页卡片的 layer-2 保持一致
	const metaItems = [];
	if (category) {
		metaItems.push(
			createElement("span", { class: "wlc-category" }, [createText(category)]),
		);
	}
	if (published) {
		metaItems.push(
			createElement("span", { class: "wlc-date" }, [createText(published)]),
		);
	}

	// 信息区顺序对齐列表页单列卡片：标题 → 分类/日期 → 描述 → 标签（独立成行）
	const info = [
		createElement("div", { class: "wlc-title" }, [createText(title)]),
	];
	if (metaItems.length > 0) {
		info.push(createElement("div", { class: "wlc-meta" }, metaItems));
	}
	if (description) {
		info.push(
			createElement("div", { class: "wlc-description" }, [
				createText(description),
			]),
		);
	}
	if (tags.length > 0) {
		// 标签独立成行（胶囊样式），宽度不够时整组换行
		info.push(
			createElement(
				"div",
				{ class: "wlc-tags" },
				tags.map((tag) =>
					createElement("span", { class: "wlc-tag" }, [createText(`#${tag}`)]),
				),
			),
		);
	}

	const children = [createElement("div", { class: "wlc-info" }, info)];

	const cover = createCoverNode(meta, parsed, context);
	if (cover) {
		children.push(createElement("div", { class: "wlc-cover" }, [cover]));
	}

	return createElement(
		"a",
		{
			class: cover
				? "card-wiki-link no-styling"
				: "card-wiki-link no-styling no-cover",
			href: createPostUrl(parsed.contentPath, meta),
		},
		children,
	);
}

function createWikiLink(value) {
	const parsed = parseWikiLinkValue(value);
	if (!parsed) {
		return null;
	}

	const meta = parsed.contentPath ? readPostMeta(parsed.contentPath) : null;
	const title =
		typeof meta?.data.title === "string" && meta.data.title
			? meta.data.title
			: "";

	let text = parsed.alias;
	if (!text) {
		if (parsed.contentPath) {
			const pageText =
				title || parsed.destination.replace(MARKDOWN_EXTENSION, "");
			text = parsed.heading ? `${pageText}#${parsed.heading}` : pageText;
		} else {
			text = parsed.heading;
		}
	}

	const pageUrl = parsed.contentPath
		? createPostUrl(parsed.contentPath, meta)
		: "";
	const url = `${pageUrl}${parsed.heading ? `#${slug(parsed.heading)}` : ""}`;

	return {
		type: "link",
		url,
		children: [createText(text)],
	};
}

function replaceWikiLinks(value) {
	const children = [];
	let cursor = 0;
	let changed = false;

	for (const match of value.matchAll(WIKI_LINK)) {
		if (match[0].startsWith("!")) {
			continue;
		}

		const link = createWikiLink(match[1]);
		if (!link) {
			continue;
		}

		const index = match.index;
		if (index > cursor) {
			children.push({ type: "text", value: value.slice(cursor, index) });
		}
		children.push(link);
		cursor = index + match[0].length;
		changed = true;
	}

	if (!changed) {
		return null;
	}

	if (cursor < value.length) {
		children.push({ type: "text", value: value.slice(cursor) });
	}

	return children;
}

function tryCreateCardFromParagraph(node, context) {
	if (node.type !== "paragraph" || node.children?.length !== 1) {
		return null;
	}

	const child = node.children[0];
	if (child.type !== "text") {
		return null;
	}

	const match = child.value.trim().match(STANDALONE_WIKI_LINK);
	if (!match) {
		return null;
	}

	const parsed = parseWikiLinkValue(match[1]);
	if (!parsed || parsed.alias || parsed.heading || !parsed.contentPath) {
		return null;
	}

	return createWikiLinkCard(parsed, context);
}

function transformNode(node, context) {
	if (SKIPPED_NODE_TYPES.has(node.type) || !Array.isArray(node.children)) {
		return;
	}

	for (let index = 0; index < node.children.length; index++) {
		const child = node.children[index];

		const card = tryCreateCardFromParagraph(child, context);
		if (card) {
			node.children[index] = card;
			continue;
		}

		if (child.type === "text") {
			const replacement = replaceWikiLinks(child.value);
			if (replacement) {
				node.children.splice(index, 1, ...replacement);
				index += replacement.length - 1;
			}
			continue;
		}

		transformNode(child, context);
	}
}

/**
 * Convert Obsidian-style Wiki Links into Markdown links and post link cards.
 *
 * - `[[slug]]` alone in a paragraph becomes a link card with the post's
 *   title, description, published date, category, tags and cover image.
 * - Inline `[[slug]]` becomes a normal link whose text is the post title.
 * - `[[slug|alias]]` and `[[slug#heading]]` always render as normal links.
 */
export function remarkWikiLink() {
	return (tree, file) => {
		const context = {
			currentDir: file?.path ? path.dirname(file.path) : null,
		};
		transformNode(tree, context);
	};
}
