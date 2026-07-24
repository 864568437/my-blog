import type { DynamicConfig } from "@/types/dynamicConfig";
import { momentsCover, momentsPageConfig } from "./momentsConfig";

// 兼容说明：复用 momentsCover / momentsPageConfig 作为默认值，
// 修改 moments 封面时 /dynamic/ 也会同步更新；/moments/ 下线后可改为独立静态值。
export const dynamicConfig: DynamicConfig = {
	// 页面标题：影响面包屑、<h1>、<title>
	title: momentsPageConfig.title || "动态",
	// 页面描述：用于 <meta name="description">
	description: momentsPageConfig.description || "记录生活中的点点滴滴",
	// 是否为每条动态启用评论，需要先在 commentConfig.ts 启用评论系统
	showComment: true,
	// 每页条数：至少 1，传 0 会被钳制
	itemsPerPage: 10,
	// 数据源 URL：站内相对路径或以 http 开头的绝对 URL（外部 Memos 等）
	apiUrl: "/api/dynamic.json",

	// 顶部封面区域：复用 moments 配置保证视觉一致
	coverImage: momentsCover.cover_image, // 封面背景图 URL
	coverAvatar: momentsCover.cover_avatar, // 封面头像 URL
	coverName: momentsCover.cover_name, // 封面用户名
	coverBio: momentsCover.cover_bio, // 封面简介
	// 是否显示封面区域：默认 true
	showCover: true,

	// Memos 适配配置（保留扩展位，默认关闭；启用时需同步 DynamicFeed.svelte 中的 memos 加载分支）
	memos: {
		enable: false, // 是否启用 Memos 数据源
		apiUrl: "", // Memos 服务地址（需支持 CORS）
		parent: "", // 父级 ID（用于筛选特定范围的 memo）
	},
};
