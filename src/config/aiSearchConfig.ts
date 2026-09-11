/**
 * AI 搜索统一配置中心
 *
 * 所有 AI 相关配置集中在此。
 *
 * ⚠️ 这里只放「展示 / 前端行为」配置。上游地址与密钥一律走服务端环境变量
 *    （AI_BASE_URL / AI_API_KEY / AI_MODEL，见 src/workers/ai-proxy.js），
 *    因为本文件会被打进浏览器 bundle，写密钥等于公开泄露。
 */

export const aiSearchConfig = {
	/** 是否启用 AI 搜索 */
	enable: true,

	/** 对话模型名称（仅用于弹窗标题展示，与后端实际调用的 AI_MODEL 解耦） */
	modelName: "deepseek-v4.1-flash",

	/** AI 名称 */
	aiName: "zhu秘书",

	/** AI 头像路径 */
	aiAvatar: "https://q1.qlogo.cn/g?b=qq&nk=20447289&s=640",

	/**
	 * 后端代理路径（三面部署均为此路径）。
	 * 必须带尾斜杠：astro.config 的 trailingSlash:"always" 会把无斜杠的
	 * /api/ai-chat 判成 404（与 editMode.ts 的 PROXY_URL 同理）。
	 */
	apiPath: "/api/ai-chat/",

	/** 随请求携带的历史消息条数上限（服务端另有 40 条硬上限） */
	maxHistory: 10,

	/** 建议问题 */
	suggestions: ["博客的技术栈是什么？", "介绍一下自己"],

	/** 后续建议问题 */
	followUpSuggestions: ["说说最近的文章", "有什么推荐的项目？"],
};
