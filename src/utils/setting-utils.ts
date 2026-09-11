import {
	BANNER_HEIGHT_EXTEND,
	DARK_MODE,
	DEFAULT_THEME,
	LIGHT_MODE,
	SYSTEM_MODE,
	WALLPAPER_BANNER,
	WALLPAPER_FULLSCREEN,
	WALLPAPER_NONE,
	WALLPAPER_OVERLAY,
} from "@constants/constants";
import type { LIGHT_DARK_MODE, WALLPAPER_MODE } from "@/types/config";
import {
	backgroundWallpaper,
	expressiveCodeConfig,
	sakuraConfig,
	siteConfig,
} from "../config";
import { isHomePage as checkIsHomePage } from "./layout-utils";

/**
 * 首页影像揭示层（HomeBlinds）仅在桌面端且未开启"减少动态效果"时激活。
 * 移动端首页没有该层，壁纸需正常渲染，否则首页无任何背景。
 */
function isHomeBlindsActive(): boolean {
	return (
		window.matchMedia("(min-width: 769px)").matches &&
		!window.matchMedia("(prefers-reduced-motion: reduce)").matches
	);
}

// Declare global functions
declare global {
	interface Window {
		initSemifullScrollDetection?: () => void;
		semifullScrollHandler?: () => void;
		setSakuraEnabled?: (enabled: boolean) => boolean;
	}
}

export function getDefaultHue(): number {
	const fallback = "250";
	// 检查是否在浏览器环境中
	if (typeof document === "undefined") {
		return Number.parseInt(fallback, 10);
	}
	const configCarrier = document.getElementById("config-carrier");
	return Number.parseInt(configCarrier?.dataset.hue || fallback, 10);
}

export function getDefaultTheme(): LIGHT_DARK_MODE {
	// 如果配置文件中设置了 defaultMode，使用配置的值
	// 否则使用 DEFAULT_THEME（向后兼容）
	return siteConfig.themeColor.defaultMode ?? DEFAULT_THEME;
}

// 获取系统主题
export function getSystemTheme(): LIGHT_DARK_MODE {
	if (typeof window === "undefined") {
		return LIGHT_MODE;
	}
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? DARK_MODE
		: LIGHT_MODE;
}

// 解析主题（如果是system模式，则获取系统主题）
export function resolveTheme(theme: LIGHT_DARK_MODE): LIGHT_DARK_MODE {
	if (theme === SYSTEM_MODE) {
		return getSystemTheme();
	}
	return theme;
}

export function getHue(): number {
	// 先检查全局对象
	if (typeof window === "undefined" || !window.localStorage) {
		return getDefaultHue();
	}
	const stored = localStorage.getItem("hue");
	return stored ? Number.parseInt(stored, 10) : getDefaultHue();
}

export function setHue(hue: number): void {
	// 先检查是否在浏览器环境
	if (
		typeof window === "undefined" ||
		!window.localStorage ||
		typeof document === "undefined"
	) {
		return;
	}
	localStorage.setItem("hue", String(hue));
	const r = document.querySelector(":root") as HTMLElement;
	if (!r) {
		return;
	}
	r.style.setProperty("--hue", String(hue));
}

export function applyThemeToDocument(theme: LIGHT_DARK_MODE) {
	// 检查是否在浏览器环境中
	if (typeof document === "undefined") {
		return;
	}

	// 解析主题
	const resolvedTheme = resolveTheme(theme);

	// 获取当前主题状态的完整信息
	const currentIsDark = document.documentElement.classList.contains("dark");
	const currentTheme = document.documentElement.getAttribute("data-theme");

	// 计算目标主题状态
	let targetIsDark = false; // 初始化默认值
	switch (resolvedTheme) {
		case LIGHT_MODE:
			targetIsDark = false;
			break;
		case DARK_MODE:
			targetIsDark = true;
			break;
		default:
			// 处理默认情况，使用当前主题状态
			targetIsDark = currentIsDark;
			break;
	}

	// 检测是否真的需要主题切换：
	// 1. dark类状态是否改变
	// 2. expressiveCode主题是否需要更新
	const needsThemeChange = currentIsDark !== targetIsDark;
	const expectedTheme = targetIsDark
		? expressiveCodeConfig.darkTheme
		: expressiveCodeConfig.lightTheme;
	const needsCodeThemeUpdate = currentTheme !== expectedTheme;

	// 如果既不需要主题切换也不需要代码主题更新，直接返回
	if (!needsThemeChange && !needsCodeThemeUpdate) {
		return;
	}

	// 批量 DOM 操作，减少重绘
	if (needsThemeChange) {
		// 添加过渡保护类（但会导致大量重绘，所以使用更轻量的方式）
		// document.documentElement.classList.add("is-theme-transitioning");

		// 直接切换主题，利用 CSS 变量的特性让浏览器优化过渡
		if (targetIsDark) {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	}

	// Set the theme for Expressive Code based on current mode
	if (needsCodeThemeUpdate) {
		document.documentElement.setAttribute("data-theme", expectedTheme);
	}
}

// 系统主题监听器引用
let systemThemeListener:
	| ((e: MediaQueryListEvent | MediaQueryList) => void)
	| null = null;

export function setTheme(theme: LIGHT_DARK_MODE): void {
	// 检查是否在浏览器环境中
	if (
		typeof localStorage === "undefined" ||
		typeof localStorage.setItem !== "function"
	) {
		return;
	}

	// 先应用主题
	applyThemeToDocument(theme);

	// 保存到localStorage
	localStorage.setItem("theme", theme);

	// 如果切换到 system 模式，需要监听系统主题变化
	if (theme === SYSTEM_MODE) {
		setupSystemThemeListener();
	} else {
		// 如果切换其他模式，移除系统主题监听
		cleanupSystemThemeListener();
	}
}

// 设置系统主题监听器
export function setupSystemThemeListener() {
	// 先清理之前的监听器
	cleanupSystemThemeListener();

	if (typeof window === "undefined") {
		return;
	}

	const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

	// 处理系统主题变化的回调
	const handleSystemThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
		const isDark = e.matches;
		const currentIsDark = document.documentElement.classList.contains("dark");

		// 如果主题状态没有变化，直接返回
		if (currentIsDark === isDark) {
			return;
		}

		// 直接应用系统主题，不使用过渡保护类以避免大量重绘
		if (isDark) {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}

		// Set the theme for Expressive Code
		const expressiveTheme = isDark
			? expressiveCodeConfig.darkTheme
			: expressiveCodeConfig.lightTheme;
		document.documentElement.setAttribute("data-theme", expressiveTheme);

		// 触发自定义事件通知其他组件（仅在真正切换时触发）
		window.dispatchEvent(new CustomEvent("theme-change"));
	};

	// 立即调用一次以设置初始状态
	handleSystemThemeChange(mediaQuery);

	// 监听系统主题变化（现代浏览器）
	if (mediaQuery.addEventListener) {
		mediaQuery.addEventListener("change", handleSystemThemeChange);
	} else {
		// 兼容旧浏览器
		mediaQuery.addListener(handleSystemThemeChange);
	}

	systemThemeListener = handleSystemThemeChange;
}

// 清理系统主题监听器
function cleanupSystemThemeListener() {
	if (typeof window === "undefined" || !systemThemeListener) {
		return;
	}

	const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

	if (mediaQuery.removeEventListener) {
		mediaQuery.removeEventListener("change", systemThemeListener);
	} else {
		// 兼容旧浏览器
		mediaQuery.removeListener(systemThemeListener);
	}

	systemThemeListener = null;
}

export function getStoredTheme(): LIGHT_DARK_MODE {
	// 检查是否在浏览器环境中
	if (
		typeof localStorage === "undefined" ||
		typeof localStorage.getItem !== "function"
	) {
		return getDefaultTheme();
	}
	return (
		(localStorage.getItem("theme") as LIGHT_DARK_MODE) || getDefaultTheme()
	);
}

// 初始化主题监听器（用于页面加载后）
export function initThemeListener() {
	if (
		typeof localStorage === "undefined" ||
		typeof localStorage.getItem !== "function"
	) {
		return;
	}

	const theme = getStoredTheme();

	// 如果主题是 system 模式，需要监听系统主题变化
	if (theme === SYSTEM_MODE) {
		setupSystemThemeListener();
	}
}

// Wallpaper mode functions
export function applyWallpaperModeToDocument(mode: WALLPAPER_MODE) {
	// 检查是否允许切换壁纸模式
	const isSwitchable = backgroundWallpaper.switchable ?? true;
	if (!isSwitchable) {
		// 如果不允许切换，直接返回，不执行任何操作
		return;
	}

	// 获取当前的壁纸模式
	const currentMode =
		(document.documentElement.getAttribute(
			"data-wallpaper-mode",
		) as WALLPAPER_MODE) || backgroundWallpaper.mode;

	// 如果模式没有变化，直接返回
	if (currentMode === mode) {
		// 即使是相同模式，也要确保UI状态正确
		ensureWallpaperState(mode);
		return;
	}

	// 添加过渡保护类
	document.documentElement.classList.add("is-wallpaper-transitioning");

	// 更新数据属性
	document.documentElement.setAttribute("data-wallpaper-mode", mode);

	// 使用 requestAnimationFrame 确保在下一帧执行，避免闪屏
	requestAnimationFrame(() => {
		const body = document.body;

		// 移除所有壁纸相关的CSS类
		body.classList.remove("enable-banner", "wallpaper-transparent");

		// 根据模式添加相应的CSS类
		switch (mode) {
			case WALLPAPER_BANNER:
				body.classList.add("enable-banner");
				showBannerMode();
				break;
			case WALLPAPER_FULLSCREEN:
				body.classList.add("enable-banner");
				showFullscreenMode();
				break;
			case WALLPAPER_OVERLAY:
				body.classList.add("wallpaper-transparent");
				showOverlayMode();
				// 把已存储的 overlay 值同步到 DOM,避免内联样式遮挡滑块效果
				applyStoredOverlayValues();
				break;
			case WALLPAPER_NONE:
				hideAllWallpapers();
				break;
			default:
				hideAllWallpapers();
				break;
		}

		// 更新导航栏透明模式
		updateNavbarTransparency(mode);

		// 在下一帧移除过渡保护类
		requestAnimationFrame(() => {
			document.documentElement.classList.remove("is-wallpaper-transitioning");
		});
	});
}

// 确保壁纸状态正确
function ensureWallpaperState(mode: WALLPAPER_MODE) {
	const body = document.body;

	// 移除所有壁纸相关的CSS类
	body.classList.remove("enable-banner", "wallpaper-transparent");

	// 根据模式添加相应的CSS类
	switch (mode) {
		case WALLPAPER_BANNER:
			body.classList.add("enable-banner");
			showBannerMode();
			break;
		case WALLPAPER_FULLSCREEN:
			body.classList.add("enable-banner");
			showFullscreenMode();
			break;
		case WALLPAPER_OVERLAY:
			body.classList.add("wallpaper-transparent");
			showOverlayMode();
			// 把已存储的 overlay 值同步到 DOM,确保用户设置生效
			applyStoredOverlayValues();
			break;
		case WALLPAPER_NONE:
			hideAllWallpapers();
			break;
	}

	// 更新导航栏透明模式
	updateNavbarTransparency(mode);
}

function showBannerMode() {
	// 首页时不显示 wallpaper-wrapper（首页用影像揭示层作为主视觉，不依赖壁纸）
	const isHomeForBanner = checkIsHomePage(window.location.pathname);
	const wallpaperWrapper = document.getElementById("wallpaper-wrapper");
	if (wallpaperWrapper) {
		// 移除其他模式类
		wallpaperWrapper.classList.remove(
			"wallpaper-overlay",
			"wallpaper-fullscreen",
		);

		// 恢复 banner 模式的 top 定位
		wallpaperWrapper.style.top = `-${BANNER_HEIGHT_EXTEND}vh`;

		if (isHomeForBanner && isHomeBlindsActive()) {
			// 首页（影像层激活时）：保持 wallpaper-wrapper 隐藏，避免与影像揭示层重叠
			wallpaperWrapper.style.setProperty("display", "none", "important");
		} else {
			// 非首页或移动端首页：显示 banner
			const isMobile = window.innerWidth < 1024;

			// 移动端非首页时，不显示banner；桌面端始终显示
			if (isMobile && !isHomeForBanner) {
				wallpaperWrapper.style.display = "none";
				wallpaperWrapper.classList.add("mobile-hide-banner");
			} else {
				// 桌面端：先设置display，然后使用requestAnimationFrame确保渲染
				wallpaperWrapper.style.display = "block";
				wallpaperWrapper.style.setProperty("display", "block", "important");
				requestAnimationFrame(() => {
					wallpaperWrapper.classList.remove("hidden");
					wallpaperWrapper.classList.remove("opacity-0");
					wallpaperWrapper.classList.add("opacity-100");
					wallpaperWrapper.classList.remove("mobile-hide-banner");
				});
			}
		}
	}

	// 移动端首页没有影像揭示层，壁纸照常显示，来源文本与首页文本也正常展示
	const isHomeWithBlinds = isHomeForBanner && isHomeBlindsActive();

	// 横幅图片来源文本（桌面首页隐藏，因为首页用影像揭示层）
	const creditDesktop = document.getElementById("banner-credit-desktop");
	const creditMobile = document.getElementById("banner-credit-mobile");
	const bannerCredit = document.getElementById("banner-credit");
	if (isHomeWithBlinds) {
		if (creditDesktop) creditDesktop.style.display = "none";
		if (creditMobile) creditMobile.style.display = "none";
		if (bannerCredit) bannerCredit.style.display = "none";
	} else {
		if (creditDesktop) creditDesktop.style.display = "";
		if (creditMobile) creditMobile.style.display = "";
		if (bannerCredit) bannerCredit.style.display = "";
	}

	// 显示横幅首页文本（如果启用且是首页）
	const bannerTextOverlay = document.querySelector(".banner-home-text-overlay");
	if (bannerTextOverlay) {
		// 检查是否启用 homeText
		const homeTextEnabled = backgroundWallpaper.banner?.homeText?.enable;

		// 只有在启用且在首页时才显示
		if (homeTextEnabled && isHomeWithBlinds) {
			bannerTextOverlay.classList.remove("hidden");
		} else {
			bannerTextOverlay.classList.add("hidden");
		}
	}

	// 调整主内容位置
	if (isHomeWithBlinds) {
		// 桌面首页：主内容从顶部开始（因为用影像揭示层）
		const mainContent = document.querySelector(
			".w-full.z-30.pointer-events-none",
		) as HTMLElement;
		if (mainContent) {
			mainContent.classList.add("no-banner-layout");
			mainContent.style.position = "";
			mainContent.style.zIndex = "";
			mainContent.style.marginTop = "";
			mainContent.style.top = "0";
		}
	} else {
		adjustMainContentPosition("banner");
	}

	// 处理移动端非首页主内容区域位置
	const mainContentWrapper = document.querySelector(
		".w-full.z-30.pointer-events-none",
	);
	if (mainContentWrapper && !isHomeForBanner) {
		const isMobile = window.innerWidth < 1024;
		// 只在移动端非首页时调整主内容位置
		if (isMobile) {
			mainContentWrapper.classList.add("mobile-main-no-banner");
		} else {
			mainContentWrapper.classList.remove("mobile-main-no-banner");
		}
	}

	// 移除透明效果（横幅模式不使用半透明）
	adjustMainContentTransparency(false);

	// 调整导航栏透明度
	const navbar = document.getElementById("navbar");
	if (navbar) {
		// 获取导航栏透明模式配置（banner模式）
		const transparentMode =
			backgroundWallpaper.banner?.navbar?.transparentMode || "semi";
		navbar.setAttribute("data-transparent-mode", transparentMode);

		// 重新初始化半透明模式滚动检测（如果需要）
		if (
			transparentMode === "semifull" &&
			typeof window.initSemifullScrollDetection === "function"
		) {
			window.initSemifullScrollDetection();
		}
	}
}

function showOverlayMode() {
	// 首页时不显示 wallpaper-wrapper（首页用影像揭示层作为主视觉，不依赖壁纸）
	const isHomeForOverlay = checkIsHomePage(window.location.pathname);
	const wallpaperWrapper = document.getElementById("wallpaper-wrapper");
	if (wallpaperWrapper) {
		// 移除其他模式类，添加 overlay 模式类
		wallpaperWrapper.classList.remove("wallpaper-fullscreen");
		wallpaperWrapper.classList.add("wallpaper-overlay");

		if (isHomeForOverlay && isHomeBlindsActive()) {
			// 首页（影像层激活时）：保持 wallpaper-wrapper 隐藏，避免与影像揭示层重叠
			wallpaperWrapper.style.setProperty("display", "none", "important");
		} else {
			// 非首页或移动端首页：显示壁纸
			wallpaperWrapper.style.display = "block";
			wallpaperWrapper.style.setProperty("display", "block", "important");
			wallpaperWrapper.style.top = "";
			requestAnimationFrame(() => {
				wallpaperWrapper.classList.remove("hidden");
				wallpaperWrapper.classList.remove("opacity-0");
				wallpaperWrapper.classList.add("opacity-100");
				wallpaperWrapper.classList.remove("mobile-hide-banner");
			});
		}
	}

	// 横幅图片来源文本（首页隐藏，因为首页用影像揭示层）
	const creditDesktop = document.getElementById("banner-credit-desktop");
	const creditMobile = document.getElementById("banner-credit-mobile");
	const bannerCredit = document.getElementById("banner-credit");
	if (isHomeForOverlay) {
		if (creditDesktop) creditDesktop.style.display = "none";
		if (creditMobile) creditMobile.style.display = "none";
		if (bannerCredit) bannerCredit.style.display = "none";
	} else {
		if (creditDesktop) creditDesktop.style.display = "none";
		if (creditMobile) creditMobile.style.display = "none";
		if (bannerCredit) bannerCredit.style.display = "none";
	}

	// 隐藏横幅首页文本
	const bannerTextOverlay = document.querySelector(".banner-home-text-overlay");
	if (bannerTextOverlay) {
		bannerTextOverlay.classList.add("hidden");
	}

	// 调整主内容透明度
	adjustMainContentTransparency(true);

	// 调整布局
	if (isHomeForOverlay && isHomeBlindsActive()) {
		// 桌面首页：主内容从顶部开始（因为用影像揭示层）
		const mainContent = document.querySelector(
			".w-full.z-30.pointer-events-none",
		) as HTMLElement;
		if (mainContent) {
			mainContent.classList.add("no-banner-layout");
			mainContent.style.position = "";
			mainContent.style.zIndex = "";
			mainContent.style.marginTop = "";
			mainContent.style.top = "0";
		}
	} else {
		// 非首页或移动端首页：紧凑布局
		adjustMainContentPosition("overlay");
	}
}

function showFullscreenMode() {
	// 首页时不显示 wallpaper-wrapper（首页用影像揭示层作为主视觉，不依赖壁纸）
	const isHomeForFullscreenWallpaper =
		window.location.pathname === "/" ||
		window.location.pathname === "" ||
		window.location.pathname.endsWith("/index.html");
	// 全屏壁纸模式：壁纸铺满全屏，内容正常显示（不透明）
	const wallpaperWrapper = document.getElementById("wallpaper-wrapper");
	if (wallpaperWrapper) {
		// 移除 overlay 模式类，添加 fullscreen 模式类
		wallpaperWrapper.classList.remove("wallpaper-overlay");
		wallpaperWrapper.classList.add("wallpaper-fullscreen");
		if (isHomeForFullscreenWallpaper && isHomeBlindsActive()) {
			// 首页（影像层激活时）：保持 wallpaper-wrapper 隐藏，避免在公告/影像层后面出现壁纸
			wallpaperWrapper.style.setProperty("display", "none", "important");
		} else {
			// 非首页或移动端首页：显示壁纸，铺满全屏
			wallpaperWrapper.style.display = "block";
			wallpaperWrapper.style.setProperty("display", "block", "important");
			wallpaperWrapper.style.top = "";
			requestAnimationFrame(() => {
				wallpaperWrapper.classList.remove("hidden");
				wallpaperWrapper.classList.remove("opacity-0");
				wallpaperWrapper.classList.add("opacity-100");
				wallpaperWrapper.classList.remove("mobile-hide-banner");
			});
		}
	}

	// 隐藏横幅图片来源文本
	const creditDesktop = document.getElementById("banner-credit-desktop");
	const creditMobile = document.getElementById("banner-credit-mobile");
	const bannerCredit = document.getElementById("banner-credit");
	if (creditDesktop) creditDesktop.style.display = "none";
	if (creditMobile) creditMobile.style.display = "none";
	if (bannerCredit) bannerCredit.style.display = "none";

	// 显示横幅首页文本（如果是首页且启用）
	const bannerTextOverlay = document.querySelector(".banner-home-text-overlay");
	if (bannerTextOverlay) {
		const isHome =
			window.location.pathname === "/" ||
			window.location.pathname === "" ||
			window.location.pathname.endsWith("/index.html");
		if (isHome) {
			bannerTextOverlay.classList.remove("hidden");
		} else {
			bannerTextOverlay.classList.add("hidden");
		}
	}

	// 不启用透明效果，内容正常显示
	adjustMainContentTransparency(false);

	// 调整布局为全屏模式
	adjustMainContentPosition("fullscreen");
}

function hideAllWallpapers() {
	// 隐藏壁纸
	const wallpaperWrapper = document.getElementById("wallpaper-wrapper");

	if (wallpaperWrapper) {
		wallpaperWrapper.style.display = "none";
		wallpaperWrapper.classList.add("hidden");
		wallpaperWrapper.classList.add("opacity-0");
		wallpaperWrapper.classList.remove("wallpaper-overlay");
	}

	// 隐藏横幅图片来源文本
	const creditDesktop = document.getElementById("banner-credit-desktop");
	const creditMobile = document.getElementById("banner-credit-mobile");
	const bannerCredit = document.getElementById("banner-credit");
	if (creditDesktop) creditDesktop.style.display = "none";
	if (creditMobile) creditMobile.style.display = "none";
	if (bannerCredit) bannerCredit.style.display = "none";

	// 隐藏横幅首页文本
	const bannerTextOverlay = document.querySelector(".banner-home-text-overlay");
	if (bannerTextOverlay) {
		bannerTextOverlay.classList.add("hidden");
	}

	// 恢复显示首页 HomeHero
	const homeHero = document.getElementById("home-hero");
	if (homeHero) {
		homeHero.style.display = "";
	}

	// 调整主内容位置和透明度
	adjustMainContentPosition("none");
	adjustMainContentTransparency(false);
}

function updateNavbarTransparency(mode: WALLPAPER_MODE) {
	const navbar = document.getElementById("navbar");
	if (!navbar) return;

	let transparentMode: string;
	let enableBlur: boolean;

	// 根据当前壁纸模式设置导航栏透明模式和模糊效果
	if (mode === WALLPAPER_NONE) {
		// 纯色背景模式
		transparentMode = "none";
		enableBlur = false;
	} else {
		// Banner / Overlay / Fullscreen 模式：统一使用配置的透明模式和模糊效果
		// 使导航栏在所有页面下保持一致的半透明背景
		transparentMode =
			backgroundWallpaper.banner?.navbar?.transparentMode || "semi";
		enableBlur = backgroundWallpaper.banner?.navbar?.enableBlur ?? true;
	}

	// 更新导航栏的透明模式属性
	navbar.setAttribute("data-transparent-mode", transparentMode);
	navbar.setAttribute("data-enable-blur", String(enableBlur));

	// 移除现有的透明模式类
	navbar.classList.remove(
		"navbar-transparent-semi",
		"navbar-transparent-full",
		"navbar-transparent-semifull",
	);

	// 移除scrolled类
	navbar.classList.remove("scrolled");

	// 滚动检测功能
	if (
		transparentMode === "semifull" &&
		mode === WALLPAPER_BANNER &&
		typeof window.initSemifullScrollDetection === "function"
	) {
		// 仅在Banner模式的semifull下启用滚动检测
		window.initSemifullScrollDetection();
	} else if (window.semifullScrollHandler) {
		// 移除滚动监听器
		window.removeEventListener("scroll", window.semifullScrollHandler);
		delete window.semifullScrollHandler;
	}
}

function adjustMainContentPosition(
	mode: WALLPAPER_MODE | "banner" | "none" | "overlay" | "fullscreen",
) {
	const mainContent = document.querySelector(
		".w-full.z-30.pointer-events-none",
	) as HTMLElement;
	if (!mainContent) return;

	// 移除现有的位置类
	mainContent.classList.remove("mobile-main-no-banner", "no-banner-layout");

	switch (mode) {
		case "banner":
			// Banner模式：主内容在banner下方
			mainContent.style.position = "";
			mainContent.style.zIndex = "";
			mainContent.style.marginTop = "";
			mainContent.style.top = "calc(var(--banner-height) - 3rem)";
			break;
		case "overlay":
			// Overlay模式：使用紧凑布局，主内容从导航栏下方开始
			mainContent.classList.add("no-banner-layout");
			mainContent.style.position = "";
			mainContent.style.zIndex = "";
			mainContent.style.marginTop = "";
			mainContent.style.top = "5.5rem";
			break;
		case "fullscreen": {
			mainContent.classList.add("no-banner-layout");
			// 首页时使用 absolute 定位以保证 HomeHero 正常全宽破出
			// 非首页时使用 relative 避免与全屏壁纸重叠
			const isHomeForFullscreen =
				window.location.pathname === "/" ||
				window.location.pathname === "" ||
				window.location.pathname.endsWith("/index.html");
			if (isHomeForFullscreen && isHomeBlindsActive()) {
				mainContent.style.position = "";
				mainContent.style.zIndex = "";
				mainContent.style.marginTop = "";
				mainContent.style.top = "0";
			} else {
				mainContent.style.position = "relative";
				mainContent.style.zIndex = "30";
				mainContent.style.top = "0";
				mainContent.style.marginTop = "1rem";
			}
			break;
		}
		case "none":
			// 无壁纸模式：主内容从导航栏下方开始
			mainContent.classList.add("no-banner-layout");
			mainContent.style.position = "";
			mainContent.style.zIndex = "";
			mainContent.style.marginTop = "";
			mainContent.style.top = "5.5rem";
			break;
		default:
			mainContent.style.position = "";
			mainContent.style.zIndex = "";
			mainContent.style.marginTop = "";
			mainContent.style.top = "5.5rem";
			break;
	}
}

function adjustMainContentTransparency(enable: boolean) {
	const mainContent = document.querySelector(
		".w-full.z-30.pointer-events-none",
	);
	const body = document.body;

	if (!mainContent || !body) return;

	if (enable) {
		mainContent.classList.add("wallpaper-transparent");
		body.classList.add("wallpaper-transparent");
	} else {
		mainContent.classList.remove("wallpaper-transparent");
		body.classList.remove("wallpaper-transparent");
	}
}

export function setWallpaperMode(mode: WALLPAPER_MODE): void {
	// 检查是否在浏览器环境中
	if (
		typeof localStorage === "undefined" ||
		typeof localStorage.setItem !== "function"
	) {
		return;
	}
	localStorage.setItem("wallpaperMode", mode);
	applyWallpaperModeToDocument(mode);
}

export function initWallpaperMode(): void {
	const storedMode = getStoredWallpaperMode();
	applyWallpaperModeToDocument(storedMode);
}

export function getStoredWallpaperMode(): WALLPAPER_MODE {
	// 检查是否在浏览器环境中
	if (
		typeof localStorage === "undefined" ||
		typeof localStorage.getItem !== "function"
	) {
		return backgroundWallpaper.mode;
	}
	return (
		(localStorage.getItem("wallpaperMode") as WALLPAPER_MODE) ||
		backgroundWallpaper.mode
	);
}

// Waves animation functions
export function getDefaultWavesEnabled(): boolean {
	const wavesConfig = backgroundWallpaper.banner?.waves?.enable;
	if (typeof wavesConfig === "object") {
		// 如果是分设备配置，检查当前设备
		const isMobile =
			typeof window !== "undefined" ? window.innerWidth < 768 : false;
		return isMobile
			? (wavesConfig.mobile ?? false)
			: (wavesConfig.desktop ?? false);
	}
	return wavesConfig ?? false;
}

export function getStoredWavesEnabled(): boolean {
	if (
		typeof localStorage === "undefined" ||
		typeof localStorage.getItem !== "function"
	) {
		return getDefaultWavesEnabled();
	}
	const stored = localStorage.getItem("wavesEnabled");
	if (stored === null) {
		return getDefaultWavesEnabled();
	}
	return stored === "true";
}

export function setWavesEnabled(enabled: boolean): void {
	if (
		typeof localStorage === "undefined" ||
		typeof localStorage.setItem !== "function"
	) {
		return;
	}
	localStorage.setItem("wavesEnabled", String(enabled));
	applyWavesEnabledToDocument(enabled);
}

export function applyWavesEnabledToDocument(enabled: boolean): void {
	if (typeof document === "undefined") {
		return;
	}
	// 更新 html 属性，CSS 会立即生效
	document.documentElement.setAttribute("data-waves-enabled", String(enabled));
	// 同时更新元素样式（兼容性）
	const wavesElement = document.getElementById("header-waves");
	if (wavesElement) {
		if (enabled) {
			wavesElement.style.display = "";
			wavesElement.classList.remove("waves-disabled");
		} else {
			wavesElement.style.display = "none";
			wavesElement.classList.add("waves-disabled");
		}
	}
}

// Banner title functions
export function getDefaultBannerTitleEnabled(): boolean {
	return backgroundWallpaper.banner?.homeText?.enable ?? true;
}

export function getStoredBannerTitleEnabled(): boolean {
	if (
		typeof localStorage === "undefined" ||
		typeof localStorage.getItem !== "function"
	) {
		return getDefaultBannerTitleEnabled();
	}
	const stored = localStorage.getItem("bannerTitleEnabled");
	if (stored === null) {
		return getDefaultBannerTitleEnabled();
	}
	return stored === "true";
}

export function setBannerTitleEnabled(enabled: boolean): void {
	if (
		typeof localStorage === "undefined" ||
		typeof localStorage.setItem !== "function"
	) {
		return;
	}
	localStorage.setItem("bannerTitleEnabled", String(enabled));
	applyBannerTitleEnabledToDocument(enabled);
}

export function applyBannerTitleEnabledToDocument(enabled: boolean): void {
	if (typeof document === "undefined") {
		return;
	}
	// 更新 html 属性，CSS 会立即生效
	document.documentElement.setAttribute(
		"data-banner-title-enabled",
		String(enabled),
	);
	// 同时更新元素样式（兼容性）
	const bannerTextOverlay = document.querySelector(
		".banner-home-text-overlay",
	) as HTMLElement;
	if (bannerTextOverlay) {
		if (enabled) {
			bannerTextOverlay.classList.remove("user-hidden");
		} else {
			bannerTextOverlay.classList.add("user-hidden");
		}
	}
}

// Wallpaper carousel functions
export function getDefaultWallpaperCarouselEnabled(): boolean {
	return backgroundWallpaper.banner?.carousel?.enable ?? false;
}

export function getStoredWallpaperCarouselEnabled(): boolean {
	if (
		typeof localStorage === "undefined" ||
		typeof localStorage.getItem !== "function"
	) {
		return getDefaultWallpaperCarouselEnabled();
	}
	const stored = localStorage.getItem("wallpaperCarouselEnabled");
	if (stored === null) {
		return getDefaultWallpaperCarouselEnabled();
	}
	return stored === "true";
}

export function setWallpaperCarouselEnabled(enabled: boolean): void {
	if (
		typeof localStorage === "undefined" ||
		typeof localStorage.setItem !== "function"
	) {
		return;
	}
	localStorage.setItem("wallpaperCarouselEnabled", String(enabled));
}

// Gradient transition functions
export function getDefaultGradientEnabled(): boolean {
	const gradientConfig = backgroundWallpaper.banner?.gradient?.enable;
	if (typeof gradientConfig === "object") {
		const isMobile =
			typeof window !== "undefined" ? window.innerWidth < 768 : false;
		return isMobile
			? (gradientConfig.mobile ?? true)
			: (gradientConfig.desktop ?? true);
	}
	return gradientConfig ?? true;
}

export function getStoredGradientEnabled(): boolean {
	if (
		typeof localStorage === "undefined" ||
		typeof localStorage.getItem !== "function"
	) {
		return getDefaultGradientEnabled();
	}
	const stored = localStorage.getItem("gradientEnabled");
	if (stored === null) {
		return getDefaultGradientEnabled();
	}
	return stored === "true";
}

export function setGradientEnabled(enabled: boolean): void {
	if (
		typeof localStorage === "undefined" ||
		typeof localStorage.setItem !== "function"
	) {
		return;
	}
	localStorage.setItem("gradientEnabled", String(enabled));
	applyGradientEnabledToDocument(enabled);
}

export function applyGradientEnabledToDocument(enabled: boolean): void {
	if (typeof document === "undefined") {
		return;
	}
	// 更新 html 属性，CSS 会立即生效
	document.documentElement.setAttribute(
		"data-gradient-enabled",
		String(enabled),
	);
	// 同时更新元素样式（兼容性）
	const gradientElement = document.getElementById("wallpaper-gradient");
	if (gradientElement) {
		if (enabled) {
			gradientElement.style.display = "";
			gradientElement.classList.remove("gradient-disabled");
		} else {
			gradientElement.style.display = "none";
			gradientElement.classList.add("gradient-disabled");
		}
	}
}

// 应用 overlay CSS 变量到 documentElement 与 #wallpaper-wrapper,
// 因为 wallpaper-wrapper 元素在 SSR 阶段存在内联样式,内联样式优先级高于
// documentElement 上的同名变量,这里需要同时更新两者才能让滑块设置生效
function applyOverlayVarToRootAndWrapper(name: string, value: string): void {
	if (typeof document === "undefined") return;
	document.documentElement.style.setProperty(name, value);
	const wallpaperWrapper = document.getElementById("wallpaper-wrapper");
	if (wallpaperWrapper) {
		wallpaperWrapper.style.setProperty(name, value);
	}
}

// Overlay opacity functions
export function getDefaultOverlayOpacity(): number {
	return backgroundWallpaper.overlay?.opacity ?? 80;
}

export function getStoredOverlayOpacity(): number {
	if (
		typeof localStorage === "undefined" ||
		typeof localStorage.getItem !== "function"
	) {
		return getDefaultOverlayOpacity();
	}
	const stored = localStorage.getItem("overlayOpacity");
	return stored ? Number.parseInt(stored, 10) : getDefaultOverlayOpacity();
}

export function setOverlayOpacity(opacity: number): void {
	if (
		typeof localStorage === "undefined" ||
		typeof localStorage.setItem !== "function"
	) {
		return;
	}
	localStorage.setItem("overlayOpacity", String(opacity));
	applyOverlayVarToRootAndWrapper("--overlay-opacity", `${opacity}%`);
}

export function applyOverlayOpacityToDocument(opacity: number): void {
	if (typeof document === "undefined") return;
	applyOverlayVarToRootAndWrapper("--overlay-opacity", `${opacity}%`);
}

// Overlay blur functions
export function getDefaultOverlayBlur(): number {
	return backgroundWallpaper.overlay?.blur ?? 0;
}

export function getStoredOverlayBlur(): number {
	if (
		typeof localStorage === "undefined" ||
		typeof localStorage.getItem !== "function"
	) {
		return getDefaultOverlayBlur();
	}
	const stored = localStorage.getItem("overlayBlur");
	return stored ? Number.parseInt(stored, 10) : getDefaultOverlayBlur();
}

export function setOverlayBlur(blur: number): void {
	if (
		typeof localStorage === "undefined" ||
		typeof localStorage.setItem !== "function"
	) {
		return;
	}
	localStorage.setItem("overlayBlur", String(blur));
	applyOverlayVarToRootAndWrapper("--overlay-blur", `${blur}px`);
}

export function applyOverlayBlurToDocument(blur: number): void {
	if (typeof document === "undefined") return;
	applyOverlayVarToRootAndWrapper("--overlay-blur", `${blur}px`);
}

// Overlay card opacity functions
export function getDefaultOverlayCardOpacity(): number {
	return backgroundWallpaper.overlay?.cardOpacity ?? 99;
}

export function getStoredOverlayCardOpacity(): number {
	if (
		typeof localStorage === "undefined" ||
		typeof localStorage.getItem !== "function"
	) {
		return getDefaultOverlayCardOpacity();
	}
	const stored = localStorage.getItem("overlayCardOpacity");
	return stored ? Number.parseInt(stored, 10) : getDefaultOverlayCardOpacity();
}

export function setOverlayCardOpacity(opacity: number): void {
	if (
		typeof localStorage === "undefined" ||
		typeof localStorage.setItem !== "function"
	) {
		return;
	}
	localStorage.setItem("overlayCardOpacity", String(opacity));
	applyOverlayVarToRootAndWrapper("--overlay-card-opacity", `${opacity}%`);
}

export function applyOverlayCardOpacityToDocument(opacity: number): void {
	if (typeof document === "undefined") return;
	applyOverlayVarToRootAndWrapper("--overlay-card-opacity", `${opacity}%`);
}

// Text glow strength (夜晚模式文字发光亮度 0-1)
export function getDefaultTextGlowStrength(): number {
	return 0.5;
}

export function getStoredTextGlowStrength(): number {
	if (
		typeof localStorage === "undefined" ||
		typeof localStorage.getItem !== "function"
	) {
		return getDefaultTextGlowStrength();
	}
	const stored = localStorage.getItem("textGlowStrength");
	if (stored === null) return getDefaultTextGlowStrength();
	const parsed = Number.parseFloat(stored);
	return Number.isFinite(parsed)
		? Math.max(0, Math.min(1, parsed))
		: getDefaultTextGlowStrength();
}

export function setTextGlowStrength(strength: number): void {
	if (typeof document === "undefined") return;
	const clamped = Math.max(0, Math.min(1, strength));
	document.documentElement.style.setProperty(
		"--text-glow-strength",
		String(clamped),
	);
	if (
		typeof localStorage !== "undefined" &&
		typeof localStorage.setItem === "function"
	) {
		localStorage.setItem("textGlowStrength", String(clamped));
	}
}

export function applyStoredTextGlowStrength(): void {
	setTextGlowStrength(getStoredTextGlowStrength());
}

// 在切换到 overlay 模式或初始化时,把已存储的 overlay 值同步到
// documentElement 与 #wallpaper-wrapper,避免内联样式遮挡滑块效果
export function applyStoredOverlayValues(): void {
	applyOverlayOpacityToDocument(getStoredOverlayOpacity());
	applyOverlayBlurToDocument(getStoredOverlayBlur());
	applyOverlayCardOpacityToDocument(getStoredOverlayCardOpacity());
}

// Sakura effect functions
export function getDefaultSakuraEnabled(): boolean {
	return sakuraConfig.enable;
}

export function getStoredSakuraEnabled(): boolean {
	if (
		typeof localStorage === "undefined" ||
		typeof localStorage.getItem !== "function"
	) {
		return getDefaultSakuraEnabled();
	}
	const stored = localStorage.getItem("sakuraEnabled");
	if (stored === null) {
		return getDefaultSakuraEnabled();
	}
	return stored === "true";
}

export function setSakuraEnabled(enabled: boolean): void {
	if (
		typeof localStorage === "undefined" ||
		typeof localStorage.setItem !== "function"
	) {
		return;
	}
	localStorage.setItem("sakuraEnabled", String(enabled));
	applySakuraEnabledToDocument(enabled);
}

export function applySakuraEnabledToDocument(enabled: boolean): void {
	if (typeof window === "undefined") {
		return;
	}
	// 调用 SakuraEffect.astro 内联脚本暴露的全局接口，立即启动/停止动画
	window.setSakuraEnabled?.(enabled);
}
