import type { FriendLink, FriendsPageConfig } from "../types/config";

// 可以在src/content/spec/friends.md中编写友链页面下方的自定义内容

// 友链页面配置
export const friendsPageConfig: FriendsPageConfig = {
	title: "",
	description: "",
	showCustomContent: true,
	showComment: true,
	randomizeSort: false,
	applyLink: "https://github.com/fqzlr/fqzl-bk/issues/new?template=friend-link.yml",
	siteInfo: {
		name: "fqzlr",
		desc: "躬身入局，心为主理，行有尺度，自持本心.",
		url: "https://fqzlr.com/",
		avatar: "https://q1.qlogo.cn/g?b=qq&nk=20447289&s=640",
		email: "",
	},
	notes: [
		{ title: "互换原则", content: "请先将本站添加到您的友链页面，确认后会添加您的友链" },
		{ title: "失效清理", content: "友链网站长期无法访问或内容违规，将会被移除" },
		{ title: "内容要求", content: "内容积极向上，不含有任何含色情/反动/暴力等违法违规内容" },
		{ title: "站点要求", content: "支持 HTTPS，以原创内容为主，能够正常访问且有持续更新" },
		{ title: "广告规范", content: "站点禁止充斥大量弹窗、诱导跳转、恶意悬浮广告，影响阅读体验" },
		{ title: "域名规范", content: "不接纳垃圾短链、多级跳转域名、已被标记风险的域名站点" },
		{ title: "版权规范", content: "尊重原创版权，不盗用他人文章、图片、资源，杜绝洗稿搬运站点" },
		{ title: "站点氛围", content: "不发布引战、对立、恶意引流量、抹黑攻击他人的情绪化内容" },
		{ title: "个人主页限制", content: "纯空白个人主页、无任何原创文字内容的展示站暂不互换" },
		
	],
	// 失效友链分区配置（基于 check-flink result.json 中的 fail_count 分组）
	failZones: {
		// 失效暂留：fail_count 1-6 次的友链
		failWindow: [1, 6],
		// 友链墓碑：fail_count ≥ 7 次的友链
		tombstone: [7, 9999],
		// 墓碑说明区里"联系恢复"链接
		contactLink: "https://github.com/fqzlr/fqzl-bk/issues/new?template=friend-link.yml",
		// 检测数据源 URL
		dataUrl: "https://check.fqzlr.com/result.json",
	},
};

// 友链配置
export const friendsConfig: FriendLink[] = [
		{
		  "title": "番茄主理人",
		  "imgurl": "https://q1.qlogo.cn/g?b=qq&nk=20447289&s=640",
		  "desc": "躬身入局，心为主理，行有尺度，自持本心.",
		  "siteurl": "https://fqzlr.com/",
		  "linkpage": "https://fqzlr.com/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "MmzMing的知识库",
		  "imgurl": "https://i.stardots.io/784774835/StarDots-2026052116374135506.jpg",
		  "desc": "哈基米，南北绿豆",
		  "siteurl": "https://tblog.mmzhiku.xyz/",
		  "linkpage": "https://tblog.mmzhiku.xyz/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "团子和蛋糕",
		  "imgurl": "https://re.tsh520.cn/zl/tx.webp",
		  "desc": "如果你喜欢那么欢迎来到我的世界！",
		  "siteurl": "https://blog.tsh520.cn/",
		  "linkpage": "https://blog.tsh520.cn/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "Olinl Blog",
		  "imgurl": "https://q2.qlogo.cn/headimg_dl?dst_uin=9892214&spec=0",
		  "desc": "分享、实践、学习",
		  "siteurl": "https://blog.olinl.com/",
		  "linkpage": "https://blog.olinl.com/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "夏夜流萤",
		  "imgurl": "https://weavatar.com/avatar/d252655d40d6874417a720bad0a6c5f77f8f6a1fd2f882f8f338402dc37e4190?s=640",
		  "desc": "飞萤之火自无梦的长夜亮起，绽放在终竟的明天。",
		  "siteurl": "https://blog.cuteleaf.cn/",
		  "linkpage": "https://blog.cuteleaf.cn/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "椰汁の主页",
		  "imgurl": "https://free.picui.cn/free/2026/03/23/69c12fe83f7a4.jpg",
		  "desc": "关关难过关关过,前路漫漫亦灿灿.",
		  "siteurl": "https://home.132614.xyz/",
		  "linkpage": "https://home.132614.xyz/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "UpXuu",
		  "imgurl": "https://upxuu.com/images/20260214145619.jpg",
		  "desc": "逐光而上！",
		  "siteurl": "https://upxuu.com/",
		  "linkpage": "https://upxuu.com/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "Re.Y.Ju.hao | 个人主页",
		  "imgurl": "https://img.cdn1.vip/i/69f03a1c79908_1777351196.webp",
		  "desc": "先活着吧，其他的再想想",
		  "siteurl": "http://irehao.42web.io/",
		  "linkpage": "https://irehao.42web.io/friendship.html",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "大熊",
		  "imgurl": "https://halo.aizaibao.cn/upload/%E5%A4%B4%E5%83%8F-AHbr.jpg",
		  "desc": "日常随笔与灵感收集小角落",
		  "siteurl": "https://halo.aizaibao.cn/",
		  "linkpage": "https://halo.aizaibao.cn/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "xf_blog",
		  "imgurl": "https://github.com/xfcnl/xfcnl.github.io/blob/main/image/MEITU_20260128_220225596.jpg?raw=true",
		  "desc": "立志用 cloudflare workers，GitHub pages 和 vercel 做出整个互联网的up（虽然不会成功",
		  "siteurl": "https://xfcnl.github.io/",
		  "linkpage": "https://xfcnl.github.io/link/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "年华",
		  "imgurl": "https://q1.qlogo.cn/g?b=qq&nk=1323860289&s=640",
		  "desc": "分享生活和技术。",
		  "siteurl": "https://blog.520781.xyz/",
		  "linkpage": "https://blog.520781.xyz/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "yukino",
		  "imgurl": "https://tu.ztyukino.com/file/1778322126543_%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_2026-05-09_182135_917.jpg",
		  "desc": "一个现充的个人博客网站！",
		  "siteurl": "https://blog.ztyukino.com/",
		  "linkpage": "https://blog.ztyukino.com/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "king-blog",
		  "imgurl": "https://pan.lingview.xyz/d/%E9%9B%A8%E4%BA%91%E8%8A%82%E7%82%B9/%E5%9B%BE%E5%BA%93/%E5%A4%A9%E4%BE%9D/Image_1721230292906.png?sign=JU30z6z_RsZ3Vv7HB_5D3msYRneiga5NLjhN3EpL-3w=:0",
		  "desc": "这是一个很随便的网站",
		  "siteurl": "https://www.888721.xyz/",
		  "linkpage": "https://www.888721.xyz/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "冬月",
		  "imgurl": "https://dongyue.org/avatar.webp",
		  "desc": "分享自己的一些学习心得和生活琐事",
		  "siteurl": "https://dongyue.org/",
		  "linkpage": "https://dongyue.org/links/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "ZSSO",
		  "imgurl": "https://z.wiki/u/bV2PV5yR9",
		  "desc": "一步一印，自成风景。",
		  "siteurl": "https://www.zsso.net/",
		  "linkpage": "https://www.zsso.net/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "versus0",
		  "imgurl": "https://img.542000.xyz/file/friend_avatar/1778931720838_f167cb95af9d881f4378b92b3e181d89_4647054993754934443.jpg",
		  "desc": "技术个人博客",
		  "siteurl": "https://blog.542000.xyz/",
		  "linkpage": "https://blog.542000.xyz/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "星遐蝶梦",
		  "imgurl": "https://blog.casto.top/assets/images/icon.png",
		  "desc": "星穹漫遐，蝶携清梦。",
		  "siteurl": "https://blog.casto.top/",
		  "linkpage": "https://blog.casto.top/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "晴宙",
		  "imgurl": "https://pilvocmbhhgywprdywkx.supabase.co/storage/v1/object/public/images/avatar/avatar.jpg",
		  "desc": "保持热爱，持续创造",
		  "siteurl": "https://qingzhou.dpdns.org/",
		  "linkpage": "https://qingzhou.dpdns.org/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "Saimen blog",
		  "imgurl": "https://img.z2m.store/file/1779081943822_butterfly-icon.png",
		  "desc": "读史可以明智,知古方能鉴今",
		  "siteurl": "https://com.z2m.store/",
		  "linkpage": "https://com.z2m.store/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "miuo",
		  "imgurl": "https://blog.miuo.me/avatar.avif",
		  "desc": "记录文章、笔记、实验和暂时不想丢掉的内容。",
		  "siteurl": "https://miuo.me/",
		  "linkpage": "https://miuo.me/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "my.vueko",
		  "imgurl": "https://q1.qlogo.cn/g?b=qq&nk=2710155768&s=640",
		  "desc": "来了",
		  "siteurl": "https://vuekoo.com/",
		  "linkpage": "https://vuekoo.com/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "YFBLOG - 幻新至简",
		  "imgurl": "https://cdn.yfblog.asia/image/favicon.ico",
		  "desc": "随手笔记，技术心得分享.",
		  "siteurl": "https://yfblog.asia/",
		  "linkpage": "https://yfblog.asia/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "十三",
		  "imgurl": "https://img.nw177.cn/blog/100.assets/avatar.webp",
		  "desc": "欲买桂花同载酒，终不似，少年游。",
		  "siteurl": "https://blog.nw177.cn/",
		  "linkpage": "https://blog.nw177.cn/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "ZhiJing’s Blog",
		  "imgurl": "https://iwexe.top/avatar.svg",
		  "desc": "Go with the flow.",
		  "siteurl": "https://iwexe.top/",
		  "linkpage": "https://iwexe.top/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "Sigrika-善良耙耙柑🍊",
		  "imgurl": "https://weavatar.com/avatar/bc0dba25ea5949e8290d012e081ceec669aa7784c7ad765173473c80cbaee404:tv_%E5%A4%A7%E5%93%AD",
		  "desc": "记录我的二次元之旅",
		  "siteurl": "https://qwq.sigrika.cc/",
		  "linkpage": "https://qwq.sigrika.cc/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "L!!!!ght",
		  "imgurl": "https://easyimg.kejk.cn/i/4484873c-c2cc-4b3d-bc35-5c72ed01cfd9.webp",
		  "desc": "阳光正好，慢慢前行。",
		  "siteurl": "https://sunlight.kejk.cn/",
		  "linkpage": "https://sunlight.kejk.cn/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "拾光の博客",
		  "imgurl": "https://weavatar.com/api/avatar/ff2a232e034fb7677c9f211c5979619f3f4818302ae2cf2a11ea74af530e7758?s=50&t=1780753762637",
		  "desc": "拾取散落的时光碎片",
		  "siteurl": "https://mistfly.xyz/",
		  "linkpage": "https://mistfly.xyz/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "冰汐梦",
		  "imgurl": "https://tu.irier0023.xyz/file/1780921907488_avatar.avif",
		  "desc": "当所有剑都归鞘时，真正的较量才刚刚开始——那是人心与天地的对弈。",
		  "siteurl": "https://blog.irier0023.xyz/",
		  "linkpage": "https://blog.irier0023.xyz/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "ysdy~Blog",
		  "imgurl": "https://i.stardots.io/366046882645/StarDots-2026052814483375536.png",
		  "desc": "人生苦短，摆烂优先",
		  "siteurl": "https://ysdyblog.ccwu.cc/",
		  "linkpage": "https://ysdyblog.ccwu.cc/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "风起",
		  "imgurl": "https://blog.windstart.top/_astro/xiao.DZR3cwiW_1XI6Uv.webp",
		  "desc": "无善无恶心之体，有善有恶意之动",
		  "siteurl": "https://blog.windstart.top/",
		  "linkpage": "https://blog.windstart.top/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "小生",
		  "imgurl": "https://t.alcy.cc/tx",
		  "desc": "天生我材必有用，千金散尽还复来。",
		  "siteurl": "https://www.zsso.cn/",
		  "linkpage": "https://www.zsso.cn/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "Hyde Blog",
		  "imgurl": "https://seasir.top/assets/avatar.avif",
		  "desc": "人心中的成见是一座大山",
		  "siteurl": "https://seasir.top/",
		  "linkpage": "https://seasir.top/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "gc的小站",
		  "imgurl": "https://www.gcweb.cc/static/img/pig.jpg",
		  "desc": "综合性网站，希望对你有帮助",
		  "siteurl": "https://gcweb.cc/",
		  "linkpage": "https://gcweb.cc/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "他说",
		  "imgurl": "https://090909.top/assets/images/logo.ico",
		  "desc": "梁栋烨的博客网站。",
		  "siteurl": "https://090909.top/",
		  "linkpage": "https://090909.top/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "RAGNote",
		  "imgurl": "https://ragnote.top/avatar.png",
		  "desc": "一堆水文的小站，记录学习过程、项目实践，以及那些让我感兴趣的事物。Life is code. I will debug it.",
		  "siteurl": "https://ragnote.top/",
		  "linkpage": "https://ragnote.top/links/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "深渊园丁",
		  "imgurl": "https://www.minedensity.top/favicon.svg",
		  "desc": "这个网站是我送给互联网的一本手绘笔记。如果你在这里找到了什么让你停留的东西，那我们就已经是朋友了",
		  "siteurl": "https://www.minedensity.top/",
		  "linkpage": "https://www.minedensity.top/recommendations/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "落樱大王の小窝",
		  "imgurl": "https://aclsky.sakurafishermua.top/i/2026/05/26/6a15b692c4cb9.jpg",
		  "desc": "生如利刃，熔炉竟是我自己。",
		  "siteurl": "https://acblog.sakurafishermua.top/",
		  "linkpage": "https://acblog.sakurafishermua.top/links/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "xane",
		  "imgurl": "https://cloudflare-imgbed-d88.pages.dev/file/1784102742642_%E5%A4%B4%E5%83%8F.jpg",
		  "desc": "Keep going.",
		  "siteurl": "https://xane.eu.cc/",
		  "linkpage": "https://xane.eu.cc/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "JerryLife",
		  "imgurl": "https://free.picui.cn/free/2026/07/16/6a58eb63ecbd1.png",
		  "desc": "Enjoy life",
		  "siteurl": "https://jerry-nis.top/",
		  "linkpage": "https://jerry-nis.top/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		"title": "Yukihime",
		"imgurl": "https://yukihime.dev/assets/images/moments-avatar.webp?v=20260725-avatar",
		"desc": "你的瞳色 是我生命苦寻的永生花",
		"siteurl": "https://yukihime.dev/",
		"linkpage": "https://yukihime.dev/friends/",
		"tags": [
			"Blog"
		],
		"weight": 10,
		"enabled": true
		},
		{
		  "title": "旧梦与花",
		  "imgurl": "https://zhh2001.github.io/avatar.jpg",
		  "desc": "欲买桂花同载酒，终不似，少年游",
		  "siteurl": "https://zhh2001.github.io/",
		  "linkpage": "https://zhh2001.github.io/links",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "Zero-浮生",
		  "imgurl": "https://vtdd.vip/_astro/avatar.ryzKiMN3_19g6Gw.webp",
		  "desc": "浮生一刹万般皆舍.",
		  "siteurl": "https://vtdd.vip/",
		  "linkpage": "https://vtdd.vip/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "萧小晓",
		  "imgurl": "https://www.lxlovo.top/png.png",
		  "desc": "一个爱写文的菜鸡。",
		  "siteurl": "https://blog.lxlovo.top/",
		  "linkpage": "https://blog.lxlovo.top/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "Aimerting",
		  "imgurl": "https://blog.xuioo.com/avatar.jpg",
		  "desc": "「纯粹祈愿皆成真」",
		  "siteurl": "https://blog.xuioo.com/",
		  "linkpage": "https://blog.xuioo.com/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "笔尖代码",
		  "imgurl": "https://123456l.com/assets/images/logo.png",
		  "desc": "笔尖代码 - 一个汇聚了前端、后端、数据库、运维、系统知识等内容的个人技术文档库",
		  "siteurl": "https://123456l.com/",
		  "linkpage": "https://123456l.com/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		  "title": "Pasule",
		  "imgurl": "https://pasule.com/favicon/favicon-pasule.ico",
		  "desc": "如果等着遗忘，你又为什么歌唱\n",
		  "siteurl": "https://pasule.com/",
		  "linkpage": "https://pasule.com/friends/",
		  "tags": [
		    "Blog"
		  ],
		  "weight": 10,
		  "enabled": true
		},
		{
		"title": "天狗的博客",
		"imgurl": "http://tengu.l2.ink/wp-content/uploads/2026/07/cropped-Camera_XHS_17834972703201040g00831dq5qmlm0m6g5od3.jpg",
		"desc": "一个记录生活的博客",
		"siteurl": "https://tengu.l2.ink/",
		"linkpage": "https://tengu.l2.ink/friends/",
		"tags": [
			"Blog"
		],
		"weight": 10,
		"enabled": true
		},
		{
	  "title": "星诺的博客",
	  "imgurl": "https://blog.astrvow.com/_astro/logo.DuHgmi9I_1k5uPc.webp",
	  "desc": "只要热爱，太阳就会升起！",
	  "siteurl": "https://blog.astrvow.com/",
	  "linkpage": "https://blog.astrvow.com/friends/",
	  "tags": [
	    "Blog"
	  ],
	  "weight": 10,
	  "enabled": true
	},
	{
	  "title": "LQQ",
	  "imgurl": "https://lqq.ai/assets/avatar-128.webp",
	  "desc": "关于设计、技术与长期主义的个人记录。",
	  "siteurl": "https://lqq.ai/",
	  "linkpage": "https://lqq.ai/friends",
	  "tags": [
	    "Blog"
	  ],
	  "weight": 10,
	  "enabled": true
	},
	{
	  "title": "逸树の小屋",
	  "imgurl": "https://474029.xyz/assets/images/mmexport1766207871022.png",
	  "desc": "逸枝向野，静木生风。",
	  "siteurl": "https://474029.xyz/",
	  "linkpage": "https://474029.xyz/friends/",
	  "tags": [
	    "Blog"
	  ],
	  "weight": 10,
	  "enabled": true
	},
	{
	  "title": "睿朗的小窝",
	  "imgurl": "https://iamcrl.cn/avatar.jpg",
	  "desc": "睿朗的个人网站",
	  "siteurl": "https://iamcrl.cn",
	  "linkpage": "https://blog.iamcrl.cn/youlian",
	  "tags": [
	    "Blog"
	  ],
	  "weight": 10,
	  "enabled": true
	},
		{
	  "title": "小鱼钓猫🐱",
	  "imgurl": "https://img.z2m.store/file/public/1779443451063_blog.png",
	  "desc": "分享热爱”",
	  "siteurl": "https://blog.z2m.store",
	  "linkpage": "https://blog.z2m.store/friends/",
	  "tags": [
	    "Blog"
	  ],
	  "weight": 10,
	  "enabled": true
	},
	{
	  "title": "灵阈研都",
	  "imgurl": "http://mu.baimu.live/a/img/ico-baimu.png",
	  "desc": "让知识御风而行，也始终有线牵引",
	  "siteurl": "https://gl.baimu.live/",
	  "linkpage": "https://gl.baimu.live/friendlinks",
	  "tags": [
	    "Blog"
	  ],
	  "weight": 10,
	  "enabled": true
	},
	
];

// 获取启用的友链并进行排序
export const getEnabledFriends = (): FriendLink[] => {
	const friends = friendsConfig.filter((friend) => friend.enabled);
	if (friendsPageConfig.randomizeSort) {
		return friends.sort(() => Math.random() - 0.5);
	}
	return friends.sort((a, b) => b.weight - a.weight);
};
