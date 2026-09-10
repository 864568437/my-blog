import type { CollectionsApiConfig } from "../types/config";

// 使用 favicon 服务获取网站图标
const favicon = (domain: string) => `https://favicon.im/${domain}`;

export const projectsPageConfig: CollectionsApiConfig = {
	title: "网站导航",
	description: "收录个人网站、常用工具和收藏网站",
	apis: [
		{
			category: "番茄主理人",
			items: [
				{
				  "name": "番茄の主页",
				  "url": "https://home.fqzlr.com/",
				  "description": "个人主页导航站",
				  "icon": "https://favicon.im/home.fqzlr.com",
				  "enabled": true
				},
				{
				  "name": "番茄の笔记",
				  "url": "https://bj.fqzlr.com/",
				  "description": "在线笔记应用",
				  "icon": "https://favicon.im/bj.fqzlr.com",
				  "enabled": true
				},
				{
				  "name": "友链检测",
				  "url": "https://check.fqzlr.com/",
				  "description": "友链可用性检测工具",
				  "icon": "https://favicon.im/check.fqzlr.com",
				  "enabled": true
				},
				{
				  "name": "网站统计",
				  "url": "https://umami.fqzlr.com/share/kHCJG2ZUL1r6q5Js",
				  "description": "站点访问数据统计分析",
				  "icon": "https://favicon.im/umami.fqzlr.com",
				  "enabled": true
				},
				{
				  "name": "邮箱",
				  "url": "https://fqzlr.edu.kg/inbox",
				  "description": "个人邮箱服务",
				  "icon": "https://favicon.im/fqzlr.edu.kg",
				  "enabled": true
				},
				{
				  "name": "临时邮箱",
				  "url": "https://email.fqzlr.com/",
				  "description": "临时邮箱服务",
				  "icon": "https://favicon.im/email.fqzlr.com",
				  "enabled": true
				},
				{
				  "name": "排行工具",
				  "url": "https://ranktool.fqzlr.com",
				  "description": "在线排行工具",
				  "icon": "https://favicon.im/ranktool.fqzlr.com",
				  "enabled": true
				},
			],
		},
		{
			category: "工具箱",
			items: [
				{
				  "name": "网络工具 | 中科大测速",
				  "url": "https://test.ustc.edu.cn/",
				  "description": "中科大提供的网络测速工具，用于快速测试本地带宽与网络延迟。",
				  "icon": "https://favicon.im/test.ustc.edu.cn",
				  "enabled": true
				},
				{
				  "name": "网络工具 | ITDOG",
				  "url": "https://www.itdog.cn/",
				  "description": "在线网络工具箱，支持 Ping、TCPing、网站测速、HTTP 测速、路由追踪与 DNS 查询。",
				  "icon": "https://favicon.im/itdog.cn",
				  "enabled": true
				},
				{
				  "name": "图片处理 | 在线图像工具箱",
				  "url": "https://phototool.cn/",
				  "description": "在线图片处理工具箱，支持格式转换、压缩、裁剪与批量下载。",
				  "icon": "https://favicon.im/phototool.cn",
				  "enabled": true
				},
				{
				  "name": "图片查找 | SauceNAO",
				  "url": "https://saucenao.com/",
				  "description": "以图搜图引擎，支持查找动漫插画、同人图等图片来源。",
				  "icon": "https://favicon.im/saucenao.com",
				  "enabled": true
				},
				{
				  "name": "图床 | StarDots",
				  "url": "https://dashboard.stardots.io/?lang=zh",
				  "description": "一站式图片托管与 CDN 加速平台，支持图片管理、转换与分发。",
				  "icon": "https://favicon.im/stardots.io",
				  "enabled": true
				},
				{
				  "name": "抠图 | 抠抠图",
				  "url": "https://www.koukoutu.com/removebgtool/all",
				  "description": "免费 AI 在线抠图工具，支持一键自动去背景、批量处理与透明 PNG 生成。",
				  "icon": "https://favicon.im/koukoutu.com",
				  "enabled": true
				},
				{
				  "name": "GIF 背景移除 | AdWorker",
				  "url": "https://adworker.ai/zh/tools/gif-background-remover/",
				  "description": "在线 GIF 动图背景去除工具，支持自动识别并移除 GIF 背景。",
				  "icon": "https://favicon.im/adworker.ai",
				  "enabled": true
				},
				{
				  "name": "PatorJK",
				  "url": "https://patorjk.com/",
				  "description": "在线 ASCII 艺术字生成器，还提供多种实用小工具集合。",
				  "icon": "https://favicon.im/patorjk.com",
				  "enabled": true
				},
			],
		},
		{
			category: "AI 助手",
			items: [
				{
				  "name": "豆包",
				  "url": "https://www.doubao.com/",
				  "description": "字节跳动推出的 AI 助手，支持对话、写作、翻译与编程辅助。",
				  "icon": "https://favicon.im/doubao.com",
				  "enabled": true
				},
				{
				  "name": "ChatGPT",
				  "url": "https://chatgpt.com/",
				  "description": "OpenAI 开发的对话式 AI，适用于写作、编程、分析与日常问答。",
				  "icon": "https://favicon.im/chatgpt.com",
				  "enabled": true
				},
				{
				  "name": "Claude",
				  "url": "https://claude.ai/",
				  "description": "Anthropic 开发的 AI 助手，擅长长文本理解、代码分析与深度推理。",
				  "icon": "https://favicon.im/claude.ai",
				  "enabled": true
				},
				{
				  "name": "Gemini",
				  "url": "https://gemini.google.com/",
				  "description": "Google 推出的多模态 AI，支持文本、图片理解与代码生成。",
				  "icon": "https://favicon.im/gemini.google.com",
				  "enabled": true
				},
				{
				  "name": "Grok",
				  "url": "https://grok.com/",
				  "description": "xAI 开发的 AI 助手，支持实时搜索、图像生成与深度推理。",
				  "icon": "https://favicon.im/grok.com",
				  "enabled": true
				},
			],
		},
		{
			category: "AI 工具",
			items: [
				{
				  "name": "能力排行榜 | Artificial Analysis",
				  "url": "https://artificialanalysis.ai/?intelligence-category=reasoning-vs-non-reasoning",
				  "description": "AI 模型推理能力对比分析平台，帮助理解不同模型的性能差异。",
				  "icon": "https://favicon.im/artificialanalysis.ai",
				  "enabled": true
				},
				{
				  "name": "能力排行榜 | AI Arena",
				  "url": "https://arena.ai/leaderboard",
				  "description": "AI 模型竞技排行榜，综合对比各大语言模型的能力表现。",
				  "icon": "https://favicon.im/arena.ai",
				  "enabled": true
				},
				{
				  "name": "ModelScope 魔搭社区",
				  "url": "https://www.modelscope.cn/",
				  "description": "阿里达摩院开源模型社区，提供丰富的 AI 模型与推理服务。",
				  "icon": "https://favicon.im/modelscope.cn",
				  "enabled": true
				},
				{
				  "name": "skill市场 | Skills Marketplace",
				  "url": "https://skillsmp.com/",
				  "description": "AI 技能市场，发现和分享各类 AI 工具与自动化工作流。",
				  "icon": "https://favicon.im/skillsmp.com",
				  "enabled": true
				},
				{
				  "name": "提示词优化 | PromptPilot",
				  "url": "https://promptpilot.volcengine.com/",
				  "description": "火山引擎推出的 Prompt 优化工具，帮助提升大模型输出质量。",
				  "icon": "https://favicon.im/volcengine.com",
				  "enabled": true
				},
				{
				  "name": "资源站 | ACGN AI 资源站",
				  "url": "https://res.acgnai.top/",
				  "description": "ACGN 方向的 AI 资源聚合平台，提供模型下载、工具推荐与教程。",
				  "icon": "https://favicon.im/acgnai.top",
				  "enabled": true
				},
				{
				  "name": "图像生成 | Oblivion Image Gallery",
				  "url": "https://image.oblivionis.net/gallery",
				  "description": "免费的GPT AI 生成图像画廊，展示高质量的人工智能艺术作品。",
				  "icon": "https://favicon.im/oblivionis.net",
				  "enabled": true
				},
				{
				  "name": "设计工具 | Figma",
				  "url": "https://www.figma.com/",
				  "description": "在线 UI/UX 设计协作工具，支持团队协作与 AI 辅助设计。",
				  "icon": "https://favicon.im/figma.com",
				  "enabled": true
				},
				{
				  "name": "设计工具 | Google AI Studio",
				  "url": "https://aistudio.google.com/",
				  "description": "Google 官方 AI 开发平台，支持 Chat/Build/Stream 三模式，可快速原型化 Gemini 应用。",
				  "icon": "https://favicon.im/aistudio.google.com",
				  "enabled": true
				},
				{
				  "name": "设计工具 | Google Stitch",
				  "url": "https://stitch.withgoogle.com/",
				  "description": "Google Labs 推出的 AI 原生 UI 设计工具，用文字或图片生成界面并导出代码。",
				  "icon": "https://favicon.im/withgoogle.com",
				  "enabled": true
				},
				{
				  "name": "模型部署 | Ollama",
				  "url": "https://ollama.com/",
				  "description": "本地运行大语言模型的轻量框架，支持一键部署 Llama、Qwen 等开源模型。",
				  "icon": "https://favicon.im/ollama.com",
				  "enabled": true
				},
			],
		},
		{
			category: "AI BOT",
			items: [
				{
				  "name": "NapCat",
				  "url": "https://napneko.github.io/",
				  "description": "基于 NTQQ 的 QQ 机器人框架，支持插件扩展与多协议接入。",
				  "icon": "https://favicon.im/napneko.github.io",
				  "enabled": true
				},
				{
				  "name": "AstrBot",
				  "url": "https://astrbot.app/",
				  "description": "多平台聊天机器人框架，支持 QQ、Discord、Telegram 等主流平台。",
				  "icon": "https://favicon.im/astrbot.app",
				  "enabled": true
				},
				{
				  "name": "Mai-bot",
				  "url": "https://docs.mai-mai.org/",
				  "description": "音乐游戏 MaiMai 相关机器人，支持查分、排位等功能。",
				  "icon": "https://favicon.im/mai-mai.org",
				  "enabled": true
				},
				{
				  "name": "NoneBot",
				  "url": "https://nonebot.dev/docs/",
				  "description": "Python 异步机器人框架，支持多平台适配器与丰富的插件生态。",
				  "icon": "https://favicon.im/nonebot.dev",
				  "enabled": true
				},
				{
				  "name": "LLBot",
				  "url": "https://github.com/LLOneBot/LuckyLilliaBot",
				  "description": "基于 NTQQ 的轻量 QQ 机器人框架，支持 OneBot 协议。",
				  "icon": "https://favicon.im/github.com",
				  "enabled": true
				},
			],
		},
		{
			category: "前端组件库",
			items: [
				{
				  "name": "单页设计 | One Page Love",
				  "url": "https://onepagelove.com/",
				  "description": "单页网站设计灵感库，汇集 Landing Page 模板与创意参考。",
				  "icon": "https://favicon.im/onepagelove.com",
				  "enabled": true
				},
				{
				  "name": "移动端设计 | Mobbin",
				  "url": "https://mobbin.com/",
				  "description": "移动端 UI 设计参考库，收录大量 App 界面截图与交互模式。",
				  "icon": "https://favicon.im/mobbin.com",
				  "enabled": true
				},
				{
				  "name": "设计作品 | Awwwards",
				  "url": "https://www.awwwards.com/",
				  "description": "全球优秀网页设计作品评选平台，汇集创意灵感与设计趋势。",
				  "icon": "https://favicon.im/awwwards.com",
				  "enabled": true
				},
				{
				  "name": "前端组件库 | shadcn/ui",
				  "url": "https://ui.shadcn.com/",
				  "description": "基于 Radix UI 和 Tailwind CSS 的优雅 React 组件集合。",
				  "icon": "https://favicon.im/shadcn.com",
				  "enabled": true
				},
				{
				  "name": "前端组件库 | HeroUI",
				  "url": "https://heroui.com/",
				  "description": "高性能 React UI 组件库，基于 Tailwind CSS 和 Tailwind Variants。",
				  "icon": "https://favicon.im/heroui.com",
				  "enabled": true
				},
				{
				  "name": "前端组件库 | Uiverse",
				  "url": "https://uiverse.io/",
				  "description": "社区驱动的开源 UI 元素库，提供按钮、输入框、卡片等精美组件。",
				  "icon": "https://favicon.im/uiverse.io",
				  "enabled": true
				},
				{
				  "name": "前端在线演示 | CodePen",
				  "url": "https://codepen.io/",
				  "description": "前端在线演示平台，可实时编写和分享 HTML/CSS/JS 代码片段。",
				  "icon": "https://favicon.im/codepen.io",
				  "enabled": true
				},
				{
				  "name": "前端组件库 | React Bits",
				  "url": "https://www.reactbits.dev/",
				  "description": "React 组件与 Hook 精选集合，实用且易于集成到项目中。",
				  "icon": "https://favicon.im/reactbits.dev",
				  "enabled": true
				},
				{
				  "name": "前端 UI 组件库 | Magic UI",
				  "url": "https://magicui.design/",
				  "description": "精美动画组件库，提供可直接复制使用的 UI 动效组件。",
				  "icon": "https://favicon.im/magicui.design",
				  "enabled": true
				},
				{
				  "name": "前端组件库 | Aceternity UI",
				  "url": "https://ui.aceternity.com/",
				  "description": "现代化 React 动画组件库，提供视觉效果出色的开源组件。",
				  "icon": "https://favicon.im/aceternity.com",
				  "enabled": true
				},
				{
				  "name": "图标库 | Iconify",
				  "url": "https://iconify.design/",
				  "description": "统一图标框架，汇集超过 20 万个图标，支持按需加载。",
				  "icon": "https://favicon.im/iconify.design",
				  "enabled": true
				},
				{
				  "name": "3D模型 | Sketchfab",
				  "url": "https://sketchfab.com/",
				  "description": "大型 3D 模型展示与分享平台，支持在线预览和免费下载。",
				  "icon": "https://favicon.im/sketchfab.com",
				  "enabled": true
				},
			],
		},
		{
			category: "学习知识库",
			items: [
				{
				  "name": "Java 全栈知识体系",
				  "url": "https://pdai.tech/",
				  "description": "涵盖 Java 核心、并发、JVM、框架、数据库与架构的全栈知识体系。",
				  "icon": "https://favicon.im/pdai.tech",
				  "enabled": true
				},
				{
				  "name": "JavaGuide",
				  "url": "https://javaguide.cn/",
				  "description": "Java 学习与面试指南，覆盖 Java 基础、集合、并发、JVM 与 Spring 等核心知识。",
				  "icon": "https://favicon.im/javaguide.cn",
				  "enabled": true
				},
				{
				  "name": "异常教程",
				  "url": "https://www.exception.site/",
				  "description": "提供 JetBrains 系列 IDE 的安装教程与激活资源分享。",
				  "icon": "https://favicon.im/exception.site",
				  "enabled": true
				},
				{
				  "name": "力扣 LeetCode",
				  "url": "https://leetcode.cn/",
				  "description": "技术成长与算法练习平台，提供海量题库、面试题与编程竞赛。",
				  "icon": "https://favicon.im/leetcode.cn",
				  "enabled": true
				},
				{
				  "name": "牛客网",
				  "url": "https://www.nowcoder.com/",
				  "description": "IT 求职备考与技术学习平台，提供笔试、面试题库与在线编程练习。",
				  "icon": "https://favicon.im/nowcoder.com",
				  "enabled": true
				},
			],
		},
		{
			category: "动漫&漫画",
			items: [
				{
				  "name": "AGE 动漫",
				  "url": "https://www.agedm.io/update",
				  "description": "免费动漫资源聚合站，提供高清动漫在线观看与更新推送。",
				  "icon": "https://favicon.im/agedm.io",
				  "enabled": true
				},
				{
				  "name": "ManhwaTop",
				  "url": "https://manhwatop.com/",
				  "description": "韩漫与漫画阅读平台，收录热门连载与完结漫画资源。",
				  "icon": "https://favicon.im/manhwatop.com",
				  "enabled": true
				},
			],
		},
		{
			category: "API 接口",
			items: [
				{
				  "name": "小小API",
				  "url": "https://xxapi.cn/",
				  "description": "免费 API 数据接口调用平台，提供多种聚合数据接口服务。",
				  "icon": "https://favicon.im/xxapi.cn",
				  "enabled": true
				},
				{
				  "name": "高德地图API",
				  "url": "https://lbs.amap.com/",
				  "description": "高德地图开放平台，提供地图、定位、导航等地理信息服务。",
				  "icon": "https://favicon.im/amap.com",
				  "enabled": true
				},
				{
				  "name": "聚合数据",
				  "url": "https://www.juhe.cn/",
				  "description": "国内数据服务平台，提供短信、物流、新闻等多种 API 接口。",
				  "icon": "https://favicon.im/juhe.cn",
				  "enabled": true
				},
				{
				  "name": "有道翻译API",
				  "url": "https://ai.youdao.com/",
				  "description": "网易有道提供的翻译 API 服务，支持多语言文本互译。",
				  "icon": "https://favicon.im/youdao.com",
				  "enabled": true
				},
				{
				  "name": "Tavily",
				  "url": "https://app.tavily.com/home",
				  "description": "AI 优化的搜索引擎 API，为大模型提供实时网页检索能力。",
				  "icon": "https://favicon.im/tavily.com",
				  "enabled": true
				},
			],
		},
	],
};

// 兼容旧引用
export const projectsConfig = projectsPageConfig.apis;
