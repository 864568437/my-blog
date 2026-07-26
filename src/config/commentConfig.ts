import type { CommentConfig } from "../types/config";

export const commentConfig: CommentConfig = {
	// 评论系统类型: none, twikoo, waline, giscus, disqus, artalk，默认为none，即不启用评论系统
	type: "waline",

	//twikoo评论系统配置
	twikoo: {
		envId: "https://pl.fqzlr.com",
		// 设置 Twikoo 评论系统语言
		lang: "zh-CN",
		// 是否启用文章访问量统计功能
		visitorCount: true,
	},

	//waline评论系统配置
	waline: {
		// waline 后端服务地址
		serverURL: "https://waline.fqzlr.com",
		// 设置 Waline 评论系统语言
		lang: "zh-CN",
		// 设置 Waline 评论系统表情地址
		emoji: [
			"https://unpkg.com/@waline/emojis@1.4.0/weibo",
			"https://unpkg.com/@waline/emojis@1.4.0/bilibili",
			"https://unpkg.com/@waline/emojis@1.4.0/bmoji",
			"https://gcore.jsdelivr.net/gh/fqzlr/emojis@v1.0.0/tx3-emoji/",
		],
		// 评论登录模式。可选值如下：
		//   'enable'   —— 默认，允许访客匿名评论和用第三方 OAuth 登录评论，兼容性最佳。
		//   'force'    —— 强制必须登录后才能评论，适合严格社区，关闭匿名评论。
		//   'disable'  —— 禁止所有登录和 OAuth，仅允许匿名评论（填写昵称/邮箱），适用于极简留言。
		login: "enable",
		// 是否启用文章访问量统计功能
		visitorCount: true,

		// ===== 评论图片上传（图床接入） =====
		// 教程参考：
		//   Waline 官方：https://waline.js.org/cookbook/customize/upload-image.html
		//   图床上传 API：https://cfbed.sanyue.de/api/upload.html
		//   Token 管理：https://cfbed.sanyue.de/api/token.html
		//
		// 原理：Waline 的 imageUploader 选项接收一个函数，将用户粘贴/选择的图片
		//       上传到图床，返回图片 URL 后自动插入评论正文。
		//
		// 使用方法：
		//   1. 在图床管理面板创建 API Token（权限勾选 upload）
		//   2. 将图床上传地址填入 imageUploadURL（如 https://tu.fqzlr.com/upload）
		//   3. 将 Token 填入 imageUploadToken（如 imgbed_xxxxx）
		//   4. 两项都填写后，评论区自动启用图片上传；任一留空则禁用
		//
		// 图床上传 API 格式（CloudFlare ImgBed / cfbed 规范）：
		//   POST {imageUploadURL}
		//   Headers: Authorization: Bearer {imageUploadToken}, Accept: application/json
		//   Body: FormData { file: <图片文件> }
		//   响应: [{ "src": "/file/xxx.png", "publicUrl": "https://tu.fqzlr.com/file/xxx.png" }]
		//
		// 图床上传地址（/upload 端点，支持 authCode 或 Bearer Token 认证）
		imageUploadURL: "https://tu.fqzlr.com/upload",
		// 图床 API Token（在图床管理面板 → Token 管理 中创建，权限需包含 upload）
		// ❗ 不要在此填写 Token！请通过环境变量注入：
		//   Vercel：Settings → Environment Variables → 添加 PUBLIC_IMG_UPLOAD_TOKEN
		//   本地开发：在项目根目录 .env 文件中添加 PUBLIC_IMG_UPLOAD_TOKEN=imgbed_xxxxx
		imageUploadToken: import.meta.env?.PUBLIC_IMG_UPLOAD_TOKEN || "",
	},

	// artalk评论系统配置
	artalk: {
		// artalk后端程序 API 地址
		server: "https://artalk.example.com/",
		// 设置 Artalk 语言
		locale: "zh-CN",
		// 是否启用文章访问量统计功能
		visitorCount: true,
	},

	//giscus评论系统配置
	giscus: {
		// 设置 Giscus 评论系统仓库
		repo: "CuteLeaf/Firefly",
		// 设置 Giscus 评论系统仓库ID
		repoId: "R_kgD2gfdFGd",
		// 设置 Giscus 评论系统分类
		category: "General",
		// 获取 Giscus 评论系统分类ID
		categoryId: "DIC_kwDOKy9HOc4CegmW",
		// 获取 Giscus 评论系统映射方式
		mapping: "title",
		// 获取 Giscus 评论系统严格模式
		strict: "0",
		// 获取 Giscus 评论系统反应功能
		reactionsEnabled: "1",
		// 获取 Giscus 评论系统元数据功能
		emitMetadata: "1",
		// 获取 Giscus 评论系统输入位置
		inputPosition: "top",
		// 获取 Giscus 评论系统语言
		lang: "zh-CN",
		// 获取 Giscus 评论系统加载方式
		loading: "lazy",
	},

	//disqus评论系统配置
	disqus: {
		// 获取 Disqus 评论系统
		shortname: "firefly",
	},
};
