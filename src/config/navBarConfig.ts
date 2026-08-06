import {
	LinkPreset,
	type NavBarConfig,
	type NavBarLink,
	type NavBarSearchConfig,
	NavBarSearchMethod,
} from "../types/config";
import { siteConfig } from "./siteConfig";

// 根据页面开关动态生成导航栏配置
const getDynamicNavBarConfig = (): NavBarConfig => {
	// 基础导航栏链接
	const links: (NavBarLink | LinkPreset)[] = [
		// 主页
		LinkPreset.Home,

		// 文章（带下拉子菜单）
		{
			name: "文章",
			url: "/posts/",
			icon: "material-symbols:article",
			children: [
				// 文章列表
				LinkPreset.Posts,

				// 文章分类
				{
					name: "分类",
					url: "/categories/",
					icon: "material-symbols:folder-open",
				},

				// 归档
				LinkPreset.Archive,

				// 写文章
				{
					name: "写文章",
					url: "/write/",
					icon: "material-symbols:edit-note",
				},
			],
		},

		// 网站
		{
			name: "网站",
			url: "/projects/",
			icon: "material-symbols:public",
			children: [
				{
					name: "我的主页",
					url: "https://home.fqzlr.com/",
					icon: "material-symbols:home",
					external: true,
				},
				{
					name: "我的笔记",
					url: "https://bj.fqzlr.com/",
					icon: "material-symbols:menu-book",
					external: true,
				},
				{
					name: "友链检测",
					url: "https://check.fqzlr.com/",
					icon: "material-symbols:link",
					external: true,
				},
				{
					name: "网站统计",
					url: "https://umami.fqzlr.com/share/kHCJG2ZUL1r6q5Js",
					icon: "material-symbols:monitoring",
					external: true,
				},
				// 网站导航
				{
					name: "网站导航",
					url: "/projects/",
					icon: "material-symbols:public",
				},
			],
		},
	];

	// 动态（带下拉子菜单）
	// 说明：/moments/ 已被迁移至 /dynamic/，因此「说说」入口已从子菜单中
	// 移除。/moments/pinned/ 仍保留（供历史书签直接访问）。
	links.push({
		name: "动态",
		url: "/dynamic/",
		icon: "material-symbols:local-cafe",
		children: [
			{
				name: "动态",
				url: "/dynamic/",
				icon: "material-symbols:dynamic-feed-rounded",
			},
			...(siteConfig.pages.gallery
				? [
						{
							name: "相册",
							url: "/gallery/",
							icon: "material-symbols:photo-library",
						},
					]
				: []),
			{
				name: "留言板",
				url: "/guestbook/",
				icon: "material-symbols:edit-outline",
			},
			{
				name: "笔记本",
				url: "/life/notebooks/",
				icon: "material-symbols:menu-book-outline",
			},
			{
				name: "朋友的动态",
				url: "/pengyou/",
				icon: "material-symbols:group",
			},
		],
	});

	// 记录入口 - 音乐、追番、番组、规划、足迹
	const recordChildren: (NavBarLink | LinkPreset)[] = [];
	if (siteConfig.pages.musicPage) {
		recordChildren.push(LinkPreset.MusicPage);
	}
	if (siteConfig.pages.anime) {
		recordChildren.push({
			name: "追番",
			url: "/anime/",
			icon: "material-symbols:live-tv",
		});
	}
	if (siteConfig.pages.bangumi) {
		recordChildren.push({
			name: "番组",
			url: "/bangumi/",
			icon: "material-symbols:movie",
		});
	}
	if (siteConfig.pages.changelog) {
		recordChildren.push(LinkPreset.Changelog);
	}
	if (siteConfig.pages.calendar) {
		recordChildren.push(LinkPreset.Calendar);
	}
	// 规划 & 足迹
	recordChildren.push({
		name: "规划",
		url: "/life/routines/",
		icon: "material-symbols:list-alt",
	});
	recordChildren.push({
		name: "足迹",
		url: "/life/places/",
		icon: "material-symbols:location-on",
	});

	if (recordChildren.length > 0) {
		const defaultUrl = siteConfig.pages.musicPage
			? "/music/"
			: siteConfig.pages.anime
				? "/anime/"
				: "/bangumi/";

		links.push({
			name: "记录",
			url: defaultUrl,
			icon: "material-symbols:camera-outdoor",
			children: recordChildren,
		});
	}

	// 关于及其子菜单
	links.push({
		name: "关于",
		url: "/about/",
		icon: "material-symbols:info",
		children: [
			// // 外部链接
			// LinkPreset.Fhome,
			// LinkPreset.Fnote,

			// 关于页面
			LinkPreset.About,

			// 友链
			LinkPreset.Friends,

			// 赞助
			...(siteConfig.pages.sponsor ? [LinkPreset.Sponsor] : []),
		],
	});

	// 仅返回链接，其它导航搜索相关配置在模块顶层常量中独立导出
	return { links } as NavBarConfig;
};

// 导航搜索配置
export const navBarSearchConfig: NavBarSearchConfig = {
	method: NavBarSearchMethod.PageFind,
};

export const navBarConfig: NavBarConfig = getDynamicNavBarConfig();
