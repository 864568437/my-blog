// 相册元信息（用户在配置文件中填写）
export type GalleryAlbum = {
	id: string; // URL slug + 目录名，如 "ai-2026"
	name: string; // 相册名称
	description?: string; // 相册描述
	date?: string; // 日期
	location?: string; // 拍摄地点
	tags?: string[]; // 标签（用于首页筛选）
	cover?: string; // 手动指定封面（可选，省略则自动取 cover.* 或第一张）
	password?: string; // 加密密码（非空时启用加密）
	passwordHint?: string; // 密码提示
};

// 相册配置
export type GalleryConfig = {
	albums: GalleryAlbum[];
	columnWidth?: number; // 瀑布流最小列宽(px)，默认 240
};

// 相册配置
export const galleryConfig: GalleryConfig = {
	// 相册列表
	albums: [
		// 支持jpg/png/webp/avif/gif格式
		// id: 相册唯一标识符（用于目录命名和URL路径），对应 public/gallery/{id}/ 目录
		// cover: 手动指定封面图（可选，不填会把cover.*文件作为封面图，如果没有cover.*文件，则使用第一张图片作为封面图）
		// name: 相册名称
		// description: 相册描述
		// location: 相册拍摄地点
		// date: 相册日期，格式为 YYYY-MM-DD，用于排序和显示
		// tags: 相册标签，用于分类和过滤
		// password: 访问密码，设置后需要输入密码才能查看相册内容（可选）
		// passwordHint: 密码提示（可选，需配合password使用）
		{
			id: "ai-2026",
			name: "AI 绘图",
			description: "AI 生成的精美插画作品集",
			location: "AI",
			date: "2026-01-01",
			tags: ["AI", "插画"],
		},
		{
			id: "bl-ll-2026",
			name: "碧蓝档案",
			description: "碧蓝档案角色美图收集",
			location: "碧蓝档案",
			date: "2026-01-15",
			tags: ["碧蓝档案", "游戏"],
		},
		{
			id: "gpt-img2-2026",
			name: "GPT 图像",
			description: "GPT Image 生成的创意图片",
			location: "AI",
			date: "2026-02-01",
			tags: ["AI", "GPT"],
		},
		{
			id: "mc-2026",
			name: "Minecraft",
			description: "Minecraft 游戏截图与建筑作品",
			location: "Minecraft",
			date: "2026-02-15",
			tags: ["Minecraft", "游戏"],
		},
	],

	// 瀑布流最小列宽(px)，浏览器根据容器宽度自动计算列数，默认 240
	columnWidth: 240,
};
