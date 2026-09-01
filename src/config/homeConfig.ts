import type { HomeConfig } from "@/types/config";
import { profileConfig } from "./profileConfig";

// 迁移自 HomeHero 的身份信息文案（profileConfig 优先，缺省用兜底值）
const homeHero = profileConfig.homeHero ?? {};
const heroBioText = Array.isArray(profileConfig.bio)
	? profileConfig.bio[0] || ""
	: profileConfig.bio || "";

/**
 * 首页影像揭示层配置（从参考站 tblog.mmzhiku.xyz 移植）。
 * 图片位于 public/assets/images/home-blinds/，文案可自由修改。
 */
export const homeConfig: HomeConfig = {
	// 桌面端双层影像交互：固定背景揭示 → 五幕画面横向叙事
	homeBlinds: {
		enabled: true,
		reveal: {
			backgroundImage: "/assets/images/home-blinds/act2/1.webp",
			foregroundImage: "/assets/images/home-blinds/act1/1.webp",
			foregroundAlt: "奔跑人物剪影",
			foregroundOpacity: 0.5,
			pointerTravel: 28,
			// 长条横移揭示的入场标题：标题单行显示（版式按 4 字排），
			// 祝福语单行显示（版式按 5 字排），可自由增减条数
			headline: {
				title: "祝愿各位",
				messages: ["夜路有星光", "岁岁皆欢愉", "所念皆星河", "版本无回滚"],
				enterDuration: 0.5,
				messageHold: 2.6,
				messageFlipDuration: 0.75,
			},
			// 迁移自 HomeHero 的身份信息文字层（长条揭示到位后浮现）
			hero: {
				enabled: true,
				occupation: profileConfig.occupation ?? "",
				displayName: profileConfig.displayName ?? "",
				badge: homeHero.bilibiliBadgeText ?? "B站：番茄煮理人",
				bio: heroBioText,
				pill: homeHero.pillText ?? "BLOG",
				verticalTitle: homeHero.verticalTitle ?? "博客",
				verticalName: profileConfig.name ?? "",
				verticalCreative: homeHero.verticalCreative ?? "CREATIVE",
				footerText: homeHero.footerText ?? "システム起動完了",
				speechChinese: homeHero.speechChinese ?? "B站：番茄煮理人？",
				speechEnglish:
					homeHero.speechEnglish ?? "Welcome to my blog, enjoy your stay!",
			},
		},
		scenes: {
			scrollDistance: 3400,
			// 背景跑马灯：列表从右往左无缝循环，只有一张也会自动复制到铺满
			cycleImages: ["/assets/images/home-blinds/act-cycle/1.webp"],
			cycleDuration: 26,
			composite: {
				eyebrow: "PROLOGUE / RUN",
				title: "奔向下一幕",
				description: "光影从身后掠过，把正在发生的故事收进这一帧。",
				alt: "背景与奔跑人物剪影合成的首幕画面",
			},
			items: [
				{
					eyebrow: "SCENE 02 / LIGHT",
					title: "沿途拾光",
					description: "让短暂的风景停驻，在下一次转场前多看一眼。",
					image: "/assets/images/home-blinds/act3/1.webp",
					alt: "第二幕插画",
				},
				{
					eyebrow: "SCENE 03 / WIND",
					title: "风经过这里",
					description: "留在画里的是此刻，被风吹动的是仍未写完的旅程。",
					image: "/assets/images/home-blinds/act3/2.webp",
					alt: "第三幕插画",
				},
				{
					eyebrow: "SCENE 04 / PAGE",
					title: "收进一页",
					description: "把颜色、温度与偶然相遇的瞬间，一起留在纸面。",
					image: "/assets/images/home-blinds/act3/3.webp",
					alt: "第四幕插画",
				},
				{
					eyebrow: "FINALE / ARRIVE",
					title: "抵达之前",
					description: "最后一幕停在中央，下一段路从这里重新开始。",
					image: "/assets/images/home-blinds/act3/4.webp",
					alt: "第五幕插画",
				},
			],
			standImages: ["/assets/images/home-blinds/act4/1.webp"],
		},
		// 终幕文字层：最后一张图放大全屏后居中显示，随放大尾段淡入上移
		// （排布与动画节奏复刻自 XUIOO 博客的 home-end-finale，文案可自由修改）
		finale: {
			eyebrow: "The End",
			titleEn: "Pure Wish True",
			titleZh: "「纯粹祈愿皆成真」",
			copyright: "Copyright © 2026 Fqzlr. All Rights Reserved",
		},
	},
};
