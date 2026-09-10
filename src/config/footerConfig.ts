import type { FooterConfig } from "../types/config";

export const footerConfig: FooterConfig = {
	// 是否启用Footer HTML注入功能（备案号等，编辑 config/FooterConfig.html）
	enable: true,

	// 签名下方标语，留空则使用 profileConfig.bio[0]
	tagline: "",

	// 状态行：是否显示「已运行 N 天」（由 siteConfig.siteStartDate 计算）
	showRunningDays: true,

	// 状态行：是否显示「最后更新于 N 天前」（由最新文章发布日期计算）
	showLastUpdate: true,
};

// 直接编辑 config/FooterConfig.html 文件来添加备案号等自定义内容
