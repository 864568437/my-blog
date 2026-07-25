<script lang="ts">
import {
	WALLPAPER_BANNER,
	WALLPAPER_FULLSCREEN,
	WALLPAPER_NONE,
	WALLPAPER_OVERLAY,
} from "@constants/constants";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import {
	getDefaultBannerTitleEnabled,
	getDefaultGradientEnabled,
	getDefaultHue,
	getDefaultOverlayBlur,
	getDefaultOverlayCardOpacity,
	getDefaultOverlayOpacity,
	getDefaultSakuraEnabled,
	getDefaultTextGlowStrength,
	getDefaultWallpaperCarouselEnabled,
	getDefaultWavesEnabled,
	getHue,
	getStoredBannerTitleEnabled,
	getStoredGradientEnabled,
	getStoredOverlayBlur,
	getStoredOverlayCardOpacity,
	getStoredOverlayOpacity,
	getStoredSakuraEnabled,
	getStoredTextGlowStrength,
	getStoredWallpaperCarouselEnabled,
	getStoredWallpaperMode,
	getStoredWavesEnabled,
	setBannerTitleEnabled,
	setGradientEnabled,
	setHue,
	setOverlayBlur,
	setOverlayCardOpacity,
	setOverlayOpacity,
	setSakuraEnabled,
	setTextGlowStrength,
	setWallpaperCarouselEnabled,
	setWallpaperMode,
	setWavesEnabled,
} from "@utils/setting-utils";
import { onMount } from "svelte";
import Icon from "@/components/common/Icon.svelte";
import { backgroundWallpaper, siteConfig } from "@/config";
import type { WALLPAPER_MODE } from "@/types/config";

let hue = $state(getHue());
const defaultHue = getDefaultHue();
let wallpaperMode: WALLPAPER_MODE = $state(backgroundWallpaper.mode);
const defaultWallpaperMode = backgroundWallpaper.mode;
let currentLayout: "list" | "grid" = $state("list");
const defaultLayout = siteConfig.postListLayout.defaultMode;
let mounted = $state(false);
let isSmallScreen = $state(false);
let isSwitching = $state(false);
let textGlowStrength = $state(getStoredTextGlowStrength());
const defaultTextGlowStrength = getDefaultTextGlowStrength();
let wavesEnabled = $state(true);
const defaultWavesEnabled = getDefaultWavesEnabled();
let gradientEnabled = $state(true);
const defaultGradientEnabled = getDefaultGradientEnabled();
let bannerTitleEnabled = $state(true);
const defaultBannerTitleEnabled = getDefaultBannerTitleEnabled();
let wallpaperCarouselEnabled = $state(false);
const defaultWallpaperCarouselEnabled = getDefaultWallpaperCarouselEnabled();
let overlayOpacity = $state(getDefaultOverlayOpacity());
const defaultOverlayOpacity = getDefaultOverlayOpacity();
let overlayBlur = $state(getDefaultOverlayBlur());
const defaultOverlayBlur = getDefaultOverlayBlur();
let overlayCardOpacity = $state(getDefaultOverlayCardOpacity());
const defaultOverlayCardOpacity = getDefaultOverlayCardOpacity();
let sakuraEnabled = $state(false);
const defaultSakuraEnabled = getDefaultSakuraEnabled();

// ========== 面板层级折叠/标签页状态 ==========
type TabKey = "theme" | "wallpaper";
let activeTab: TabKey = $state("theme");

// 默认所有子区块均展开（用户可手动折叠）
let themeColorCollapsed = $state(false);
let effectsCollapsed = $state(false);
let wallpaperModeCollapsed = $state(false);
let overlayCollapsed = $state(false);
let bannerCollapsed = $state(false);
let layoutCollapsed = $state(false);

function switchTab(tab: TabKey) {
	if (activeTab === tab) return;
	activeTab = tab;
}

function toggleSection(section: string) {
	switch (section) {
		case "themeColor":
			themeColorCollapsed = !themeColorCollapsed;
			break;
		case "wallpaperMode":
			wallpaperModeCollapsed = !wallpaperModeCollapsed;
			break;
		case "overlay":
			overlayCollapsed = !overlayCollapsed;
			break;
		case "banner":
			bannerCollapsed = !bannerCollapsed;
			break;
		case "effects":
			effectsCollapsed = !effectsCollapsed;
			break;
		case "layout":
			layoutCollapsed = !layoutCollapsed;
			break;
	}
}

const isWallpaperSwitchable = backgroundWallpaper.switchable ?? true;
const allowLayoutSwitch = siteConfig.postListLayout.allowSwitch;
const showThemeColor = !siteConfig.themeColor.fixed;
// 是否允许用户切换水波纹动画（只看 switchable 配置）
const isWavesSwitchable =
	backgroundWallpaper.banner?.waves?.switchable ?? false;
// 是否允许用户切换渐变过渡
const isGradientSwitchable = true;
// 检查是否启用横幅标题配置
const isBannerTitleEnabled =
	backgroundWallpaper.banner?.homeText?.enable ?? false;
// 是否允许用户切换横幅标题
const isBannerTitleSwitchable =
	isBannerTitleEnabled &&
	(backgroundWallpaper.banner?.homeText?.switchable ?? false);
// 是否允许用户切换壁纸轮播
const isCarouselSwitchable =
	backgroundWallpaper.banner?.carousel?.switchable ?? false;
// 是否允许用户切换全屏透明模式
const isOverlaySwitchable = backgroundWallpaper.overlay?.switchable ?? true;
// 是否允许用户切换樱花特效
const isSakuraSwitchable = true;

// 横幅设置是否全部为默认值
let bannerSettingsIsDefault = $derived(
	(!isBannerTitleSwitchable ||
		bannerTitleEnabled === defaultBannerTitleEnabled) &&
		(!isCarouselSwitchable ||
			wallpaperCarouselEnabled === defaultWallpaperCarouselEnabled) &&
		(!isWavesSwitchable || wavesEnabled === defaultWavesEnabled) &&
		gradientEnabled === defaultGradientEnabled,
);
// 透明设置是否全部为默认值
let overlaySettingsIsDefault = $derived(
	overlayOpacity === defaultOverlayOpacity &&
		overlayBlur === defaultOverlayBlur &&
		overlayCardOpacity === defaultOverlayCardOpacity,
);
// 特效设置是否全部为默认值
let effectsSettingsIsDefault = $derived(sakuraEnabled === defaultSakuraEnabled);

const hasAnyContent =
	showThemeColor ||
	isWallpaperSwitchable ||
	allowLayoutSwitch ||
	isWavesSwitchable ||
	isBannerTitleSwitchable ||
	isCarouselSwitchable ||
	isOverlaySwitchable ||
	isSakuraSwitchable;

function resetHue() {
	hue = getDefaultHue();
	requestAnimationFrame(refreshAllRangeProgress);
}

function resetWallpaperMode() {
	wallpaperMode = defaultWallpaperMode;
	setWallpaperMode(defaultWallpaperMode);
}

function resetLayout() {
	currentLayout = defaultLayout;
	localStorage.removeItem("postListLayout");

	const event = new CustomEvent("layoutChange", {
		detail: { layout: defaultLayout },
	});
	window.dispatchEvent(event);
}

function resetBannerSettings() {
	if (
		isBannerTitleSwitchable &&
		bannerTitleEnabled !== defaultBannerTitleEnabled
	) {
		bannerTitleEnabled = defaultBannerTitleEnabled;
		setBannerTitleEnabled(defaultBannerTitleEnabled);
	}
	if (
		isCarouselSwitchable &&
		wallpaperCarouselEnabled !== defaultWallpaperCarouselEnabled
	) {
		wallpaperCarouselEnabled = defaultWallpaperCarouselEnabled;
		setWallpaperCarouselEnabled(defaultWallpaperCarouselEnabled);
	}
	if (isWavesSwitchable && wavesEnabled !== defaultWavesEnabled) {
		wavesEnabled = defaultWavesEnabled;
		setWavesEnabled(defaultWavesEnabled);
	}
	gradientEnabled = defaultGradientEnabled;
	setGradientEnabled(defaultGradientEnabled);
}

function resetOverlaySettings() {
	overlayOpacity = defaultOverlayOpacity;
	setOverlayOpacity(defaultOverlayOpacity);
	overlayBlur = defaultOverlayBlur;
	setOverlayBlur(defaultOverlayBlur);
	overlayCardOpacity = defaultOverlayCardOpacity;
	setOverlayCardOpacity(defaultOverlayCardOpacity);
	requestAnimationFrame(refreshAllRangeProgress);
}

function toggleWavesEnabled() {
	wavesEnabled = !wavesEnabled;
	setWavesEnabled(wavesEnabled);
}

function toggleGradientEnabled() {
	gradientEnabled = !gradientEnabled;
	setGradientEnabled(gradientEnabled);
}

function toggleBannerTitleEnabled() {
	bannerTitleEnabled = !bannerTitleEnabled;
	setBannerTitleEnabled(bannerTitleEnabled);
}

function toggleWallpaperCarouselEnabled() {
	wallpaperCarouselEnabled = !wallpaperCarouselEnabled;
	setWallpaperCarouselEnabled(wallpaperCarouselEnabled);
}

function toggleSakuraEnabled() {
	sakuraEnabled = !sakuraEnabled;
	setSakuraEnabled(sakuraEnabled);
}

function switchWallpaperMode(newMode: WALLPAPER_MODE) {
	wallpaperMode = newMode;
	setWallpaperMode(newMode);
	window.scrollTo({ top: 0 });

	if (newMode === WALLPAPER_OVERLAY) {
		requestAnimationFrame(refreshAllRangeProgress);
	}
}

function checkScreenSize() {
	isSmallScreen = window.innerWidth < 1200;
	if (isSmallScreen) {
		currentLayout = "list";
	}
}

function updateRangeProgress(input: HTMLInputElement) {
	const min = Number(input.min || 0);
	const max = Number(input.max || 100);
	const value = Number(input.value || 0);
	const progress = ((value - min) * 100) / (max - min || 1);
	input.style.setProperty(
		"--range-progress",
		`${Math.min(100, Math.max(0, progress))}%`,
	);
}

function refreshAllRangeProgress() {
	const panel = document.getElementById("display-setting");
	if (!panel) return;

	const rangeInputs = Array.from(
		panel.querySelectorAll('input[type="range"]'),
	) as HTMLInputElement[];

	rangeInputs.forEach((input) => {
		updateRangeProgress(input);
	});
}

function switchLayout() {
	if (!mounted || isSmallScreen || isSwitching) return;

	isSwitching = true;
	currentLayout = currentLayout === "list" ? "grid" : "list";
	localStorage.setItem("postListLayout", currentLayout);

	const event = new CustomEvent("layoutChange", {
		detail: { layout: currentLayout },
	});
	window.dispatchEvent(event);

	setTimeout(() => {
		isSwitching = false;
	}, 500);
}

onMount(() => {
	mounted = true;
	isSmallScreen = window.innerWidth < 1200;
	checkScreenSize();

	hue = getHue();
	wallpaperMode = getStoredWallpaperMode();
	wavesEnabled = getStoredWavesEnabled();
	gradientEnabled = getStoredGradientEnabled();
	bannerTitleEnabled = getStoredBannerTitleEnabled();
	wallpaperCarouselEnabled = getStoredWallpaperCarouselEnabled();
	overlayOpacity = getStoredOverlayOpacity();
	overlayBlur = getStoredOverlayBlur();
	overlayCardOpacity = getStoredOverlayCardOpacity();
	sakuraEnabled = getStoredSakuraEnabled();

	const savedLayout = localStorage.getItem("postListLayout");
	if (savedLayout && (savedLayout === "list" || savedLayout === "grid")) {
		currentLayout = savedLayout;
	} else {
		currentLayout = siteConfig.postListLayout.defaultMode;
	}

	window.addEventListener("resize", checkScreenSize);

	return () => {
		window.removeEventListener("resize", checkScreenSize);
	};
});

onMount(() => {
	const handleCustomEvent = (event: Event) => {
		const customEvent = event as CustomEvent<{ layout: "list" | "grid" }>;
		currentLayout = customEvent.detail.layout;
	};

	window.addEventListener("layoutChange", handleCustomEvent);

	return () => {
		window.removeEventListener("layoutChange", handleCustomEvent);
	};
});

onMount(() => {
	const panel = document.getElementById("display-setting");
	if (!panel) return;

	const handleRangeInput = (event: Event) => {
		const target = event.target;
		if (target instanceof HTMLInputElement && target.type === "range") {
			updateRangeProgress(target);
		}
	};

	refreshAllRangeProgress();
	panel.addEventListener("input", handleRangeInput);

	return () => {
		panel.removeEventListener("input", handleRangeInput);
	};
});

onMount(() => {
	const handleWallpaperModeChange = (event: Event) => {
		const customEvent = event as CustomEvent<{ mode: WALLPAPER_MODE }>;
		wallpaperMode = customEvent.detail.mode;
	};

	window.addEventListener("wallpaperModeChange", handleWallpaperModeChange);

	return () => {
		window.removeEventListener(
			"wallpaperModeChange",
			handleWallpaperModeChange,
		);
	};
});

$effect(() => {
	if (hue || hue === 0) {
		setHue(hue);
	}
});

$effect(() => {
	if (wallpaperMode === WALLPAPER_OVERLAY) {
		setOverlayOpacity(overlayOpacity);
		setOverlayBlur(overlayBlur);
		setOverlayCardOpacity(overlayCardOpacity);
	}
});

// 当前 Tab 是否有可见内容
let hasThemeTabContent = $derived(showThemeColor);
let hasWallpaperTabContent = $derived(
	isWallpaperSwitchable ||
		(wallpaperMode === WALLPAPER_OVERLAY && isOverlaySwitchable) ||
		((wallpaperMode === WALLPAPER_BANNER ||
			wallpaperMode === WALLPAPER_FULLSCREEN) &&
			(isBannerTitleSwitchable ||
				isCarouselSwitchable ||
				isWavesSwitchable)) ||
		isSakuraSwitchable,
);

// 默认选中有内容的第一个 Tab
$effect(() => {
	if (activeTab === "theme" && !hasThemeTabContent && hasWallpaperTabContent) {
		activeTab = "wallpaper";
	} else if (activeTab === "wallpaper" && !hasWallpaperTabContent && hasThemeTabContent) {
		activeTab = "theme";
	}
});
</script>

{#if hasAnyContent}
<div id="display-setting" class="display-panel float-panel float-panel-closed absolute transition-all w-80 right-4 px-4 py-2">
    <!-- ========== Tab Bar ========== -->
    <div class="display-tabs">
        {#if hasThemeTabContent}
        <button
            class="display-tab"
            class:active={activeTab === "theme"}
            onclick={() => switchTab("theme")}
            type="button"
        >
            {i18n(I18nKey.displayTabTheme)}
        </button>
        {/if}
        {#if hasWallpaperTabContent}
        <button
            class="display-tab"
            class:active={activeTab === "wallpaper"}
            onclick={() => switchTab("wallpaper")}
            type="button"
        >
            {i18n(I18nKey.displayTabWallpaper)}
        </button>
        {/if}
    </div>

    <!-- ========== Tab Content ========== -->
    <div class="display-content">
        <!-- ====== Theme Tab ====== -->
        {#if activeTab === "theme" && hasThemeTabContent}
        <div class="display-tab-panel">
            <!-- Theme Color Section -->
            {#if showThemeColor}
            <div class="display-section">
                <div
                    class="display-section-header"
                    role="button"
                    tabindex="0"
                    onclick={(e) => { if ((e.target as HTMLElement).tagName !== 'BUTTON') toggleSection('themeColor'); }}
                    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSection('themeColor'); } }}
                >
                    <div class="flex gap-1.5 font-bold text-[0.9rem] items-center text-neutral-900 dark:text-neutral-100 transition relative ml-2.5
                        before:w-1 before:h-3.5 before:rounded-md before:bg-(--primary)
                        before:absolute before:-left-2.5 before:top-1/2 before:-translate-y-1/2"
                    >
                        {i18n(I18nKey.themeColor)}
                        <button aria-label="Reset to Default" class="btn-regular w-5 h-5 rounded-md active:scale-90"
                                class:opacity-0={hue === defaultHue} class:pointer-events-none={hue === defaultHue}
                                onclick={(e) => { e.stopPropagation(); resetHue(); }}>
                            <div class="text-(--btn-content)">
                                <Icon icon="fa7-solid:arrow-rotate-left" class="text-[0.7rem]"></Icon>
                            </div>
                        </button>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <div id="hueValue" class="transition bg-(--btn-regular-bg) w-9 h-6 rounded-md flex justify-center
                            font-bold text-[0.7rem] items-center text-(--btn-content)">
                            {hue}
                        </div>
                        <Icon icon="material-symbols:expand-more-rounded"
                              class={`display-caret text-[1.1rem] text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${!themeColorCollapsed ? 'rotated' : ''}`}></Icon>
                    </div>
                </div>
                <div class="display-section-body" class:collapsed={themeColorCollapsed}>
                    <div class="w-full h-6 px-1 bg-[oklch(0.80_0.10_0)] dark:bg-[oklch(0.70_0.10_0)] rounded-sm select-none">
                        <input aria-label={i18n(I18nKey.themeColor)} type="range" min="0" max="360" bind:value={hue}
                               class="slider" id="colorSlider" step="5" style="width: 100%">
                    </div>
                    <!-- 夜晚文字发光亮度（仅在夜晚模式生效） -->
                    <div class="mt-2 flex items-center gap-2">
                        <div class="flex items-center gap-1.5 text-xs font-medium text-(--btn-content) opacity-80 min-w-16">
                            <Icon icon="material-symbols:wb-twilight-outline" class="text-[0.95rem]"></Icon>
                            <span>文字发光</span>
                        </div>
                        <div class="flex-1 h-5 px-1 bg-[oklch(0.85_0.05_var(--hue))] dark:bg-[oklch(0.30_0.06_var(--hue))] rounded-sm select-none">
                            <input aria-label="文字发光亮度" type="range" min="0" max="100" step="1"
                                   value={Math.round(textGlowStrength * 100)}
                                   oninput={(e) => { textGlowStrength = Number((e.currentTarget as HTMLInputElement).value) / 100; setTextGlowStrength(textGlowStrength); }}
                                   class="slider w-full" />
                        </div>
                        <div class="w-9 h-6 bg-(--btn-regular-bg) rounded-md flex justify-center font-bold text-[0.7rem] items-center text-(--btn-content)">
                            {Math.round(textGlowStrength * 100)}
                        </div>
                    </div>
                </div>
            </div>
            {/if}

            <!-- Post List Layout Section (从布局 Tab 整合到主题 Tab) -->
            {#if allowLayoutSwitch}
            <div class="display-section">
                <div
                    class="display-section-header"
                    role="button"
                    tabindex="0"
                    onclick={(e) => { if ((e.target as HTMLElement).tagName !== 'BUTTON') toggleSection('layout'); }}
                    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSection('layout'); } }}
                >
                    <div class="flex gap-1.5 font-bold text-[0.9rem] items-center text-neutral-900 dark:text-neutral-100 transition relative ml-2.5
                        before:w-1 before:h-3.5 before:rounded-md before:bg-(--primary)
                        before:absolute before:-left-2.5 before:top-1/2 before:-translate-y-1/2"
                    >
                        {i18n(I18nKey.postListLayout)}
                        <button aria-label="Reset to Default" class="btn-regular w-5 h-5 rounded-md active:scale-90"
                                class:opacity-0={currentLayout === defaultLayout} class:pointer-events-none={currentLayout === defaultLayout}
                                onclick={(e) => { e.stopPropagation(); resetLayout(); }}>
                            <div class="text-(--btn-content)">
                                <Icon icon="fa7-solid:arrow-rotate-left" class="text-[0.7rem]"></Icon>
                            </div>
                        </button>
                    </div>
                    <Icon icon="material-symbols:expand-more-rounded"
                          class={`display-caret text-[1.1rem] text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${!layoutCollapsed ? 'rotated' : ''}`}></Icon>
                </div>
                <div class="display-section-body" class:collapsed={layoutCollapsed}>
                    <div class="flex gap-2">
                        <button
                            aria-label={i18n(I18nKey.postListLayoutList)}
                            class="flex-1 btn-regular rounded-md py-2 px-3 flex items-center justify-center gap-2 active:scale-95 transition-all relative overflow-hidden"
                            class:opacity-60={currentLayout !== 'list'}
                            class:bg-(--btn-regular-bg-hover)={currentLayout === 'list'}
                            disabled={isSwitching}
                            onclick={switchLayout}
                            title={i18n(I18nKey.postListLayoutList)}
                        >
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
                            </svg>
                            <span class="text-xs font-medium">{i18n(I18nKey.postListLayoutList)}</span>
                        </button>
                        <button
                            aria-label={i18n(I18nKey.postListLayoutGrid)}
                            class="flex-1 btn-regular rounded-md py-2 px-3 flex items-center justify-center gap-2 active:scale-95 transition-all relative overflow-hidden"
                            class:opacity-60={currentLayout !== 'grid'}
                            class:bg-(--btn-regular-bg-hover)={currentLayout === 'grid'}
                            disabled={isSwitching}
                            onclick={switchLayout}
                            title={i18n(I18nKey.postListLayoutGrid)}
                        >
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z"/>
                            </svg>
                            <span class="text-xs font-medium">{i18n(I18nKey.postListLayoutGrid)}</span>
                        </button>
                    </div>
                </div>
            </div>
            {/if}

            <!-- Effects Settings Section (樱花特效，从壁纸整合到主题) -->
            {#if isSakuraSwitchable}
            <div class="display-section">
                <div
                    class="display-section-header"
                    role="button"
                    tabindex="0"
                    onclick={(e) => { if ((e.target as HTMLElement).tagName !== 'BUTTON') toggleSection('effects'); }}
                    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSection('effects'); } }}
                >
                    <div class="flex gap-1.5 font-bold text-[0.9rem] items-center text-neutral-900 dark:text-neutral-100 transition relative ml-2.5
                        before:w-1 before:h-3.5 before:rounded-md before:bg-(--primary)
                        before:absolute before:-left-2.5 before:top-1/2 before:-translate-y-1/2"
                    >
                        {i18n(I18nKey.effectsSettings)}
                        <button aria-label="Reset to Default" class="btn-regular w-5 h-5 rounded-md active:scale-90"
                                class:opacity-0={sakuraEnabled === defaultSakuraEnabled} class:pointer-events-none={sakuraEnabled === defaultSakuraEnabled}
                                onclick={(e) => { e.stopPropagation(); sakuraEnabled = defaultSakuraEnabled; setSakuraEnabled(defaultSakuraEnabled); }}>
                            <div class="text-(--btn-content)">
                                <Icon icon="fa7-solid:arrow-rotate-left" class="text-[0.7rem]"></Icon>
                            </div>
                        </button>
                    </div>
                    <Icon icon="material-symbols:expand-more-rounded"
                          class={`display-caret text-[1.1rem] text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${!effectsCollapsed ? 'rotated' : ''}`}></Icon>
                </div>
                <div class="display-section-body" class:collapsed={effectsCollapsed}>
                    <div class="space-y-1">
                        <button
                            class="w-full btn-regular rounded-md py-2 px-3 flex items-center gap-3 text-left active:scale-95 transition-all relative overflow-hidden"
                            class:bg-(--btn-regular-bg-hover)={sakuraEnabled}
                            onclick={toggleSakuraEnabled}
                        >
                            <Icon icon="mdi:flower-poppy" class="text-[1.25rem] shrink-0"></Icon>
                            <span class="text-sm flex-1">{i18n(I18nKey.sakuraEffect)}</span>
                            <div class="w-10 h-5 rounded-full transition-all duration-200 relative"
                                 class:bg-(--primary)={sakuraEnabled}
                                 class:bg-(--btn-regular-bg-active)={!sakuraEnabled}>
                                <div class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
                                     class:left-0.5={!sakuraEnabled}
                                     class:left-5={sakuraEnabled}></div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
            {/if}
        </div>
        {/if}

        <!-- ====== Wallpaper Tab ====== -->
        {#if activeTab === "wallpaper" && hasWallpaperTabContent}
        <div class="display-tab-panel">
            <!-- Wallpaper Mode Section -->
            {#if isWallpaperSwitchable}
            <div class="display-section">
                <div
                    class="display-section-header"
                    role="button"
                    tabindex="0"
                    onclick={(e) => { if ((e.target as HTMLElement).tagName !== 'BUTTON') toggleSection('wallpaperMode'); }}
                    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSection('wallpaperMode'); } }}
                >
                    <div class="flex gap-1.5 font-bold text-[0.9rem] items-center text-neutral-900 dark:text-neutral-100 transition relative ml-2.5
                        before:w-1 before:h-3.5 before:rounded-md before:bg-(--primary)
                        before:absolute before:-left-2.5 before:top-1/2 before:-translate-y-1/2"
                    >
                        {i18n(I18nKey.wallpaperMode)}
                        <button aria-label="Reset to Default" class="btn-regular w-5 h-5 rounded-md active:scale-90"
                                class:opacity-0={wallpaperMode === defaultWallpaperMode} class:pointer-events-none={wallpaperMode === defaultWallpaperMode}
                                onclick={(e) => { e.stopPropagation(); resetWallpaperMode(); }}>
                            <div class="text-(--btn-content)">
                                <Icon icon="fa7-solid:arrow-rotate-left" class="text-[0.7rem]"></Icon>
                            </div>
                        </button>
                    </div>
                    <Icon icon="material-symbols:expand-more-rounded"
                          class={`display-caret text-[1.1rem] text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${!wallpaperModeCollapsed ? 'rotated' : ''}`}></Icon>
                </div>
                <div class="display-section-body" class:collapsed={wallpaperModeCollapsed}>
                    <div class="flex gap-2">
                        <button
                            class="flex-1 btn-regular rounded-md py-2 px-3 flex items-center justify-center gap-2 active:scale-95 transition-all relative overflow-hidden"
                            class:opacity-60={wallpaperMode !== WALLPAPER_BANNER}
                            class:bg-(--btn-regular-bg-hover)={wallpaperMode === WALLPAPER_BANNER}
                            onclick={() => switchWallpaperMode(WALLPAPER_BANNER)}
                        >
                            <Icon icon="material-symbols:image-outline" class="text-[1.25rem] shrink-0"></Icon>
                            <span class="text-xs font-medium">{i18n(I18nKey.wallpaperBannerMode)}</span>
                        </button>
                        <button
                            class="flex-1 btn-regular rounded-md py-2 px-3 flex items-center justify-center gap-2 active:scale-95 transition-all relative overflow-hidden"
                            class:opacity-60={wallpaperMode !== WALLPAPER_FULLSCREEN}
                            class:bg-(--btn-regular-bg-hover)={wallpaperMode === WALLPAPER_FULLSCREEN}
                            onclick={() => switchWallpaperMode(WALLPAPER_FULLSCREEN)}
                        >
                            <Icon icon="material-symbols:wallpaper" class="text-[1.25rem] shrink-0"></Icon>
                            <span class="text-xs font-medium">{i18n(I18nKey.wallpaperFullscreenMode)}</span>
                        </button>
                    </div>
                    <div class="flex gap-2 mt-2">
                        <button
                            class="flex-1 btn-regular rounded-md py-2 px-3 flex items-center justify-center gap-2 active:scale-95 transition-all relative overflow-hidden"
                            class:opacity-60={wallpaperMode !== WALLPAPER_OVERLAY}
                            class:bg-(--btn-regular-bg-hover)={wallpaperMode === WALLPAPER_OVERLAY}
                            onclick={() => switchWallpaperMode(WALLPAPER_OVERLAY)}
                        >
                            <Icon icon="material-symbols:full-coverage-outline-rounded" class="text-[1.25rem] shrink-0"></Icon>
                            <span class="text-xs font-medium">{i18n(I18nKey.wallpaperOverlayMode)}</span>
                        </button>
                        <button
                            class="flex-1 btn-regular rounded-md py-2 px-3 flex items-center justify-center gap-2 active:scale-95 transition-all relative overflow-hidden"
                            class:opacity-60={wallpaperMode !== WALLPAPER_NONE}
                            class:bg-(--btn-regular-bg-hover)={wallpaperMode === WALLPAPER_NONE}
                            onclick={() => switchWallpaperMode(WALLPAPER_NONE)}
                        >
                            <Icon icon="material-symbols:hide-image-outline" class="text-[1.25rem] shrink-0"></Icon>
                            <span class="text-xs font-medium">{i18n(I18nKey.wallpaperNoneMode)}</span>
                        </button>
                    </div>
                </div>
            </div>
            {/if}

            <!-- Overlay Settings Section -->
            {#if wallpaperMode === WALLPAPER_OVERLAY && isOverlaySwitchable}
            <div class="display-section">
                <div
                    class="display-section-header"
                    role="button"
                    tabindex="0"
                    onclick={(e) => { if ((e.target as HTMLElement).tagName !== 'BUTTON') toggleSection('overlay'); }}
                    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSection('overlay'); } }}
                >
                    <div class="flex gap-1.5 font-bold text-[0.9rem] items-center text-neutral-900 dark:text-neutral-100 transition relative ml-2.5
                        before:w-1 before:h-3.5 before:rounded-md before:bg-(--primary)
                        before:absolute before:-left-2.5 before:top-1/2 before:-translate-y-1/2"
                    >
                        {i18n(I18nKey.overlaySettings)}
                        <button aria-label="Reset to Default" class="btn-regular w-5 h-5 rounded-md active:scale-90"
                                class:opacity-0={overlaySettingsIsDefault} class:pointer-events-none={overlaySettingsIsDefault}
                                onclick={(e) => { e.stopPropagation(); resetOverlaySettings(); }}>
                            <div class="text-(--btn-content)">
                                <Icon icon="fa7-solid:arrow-rotate-left" class="text-[0.7rem]"></Icon>
                            </div>
                        </button>
                    </div>
                    <Icon icon="material-symbols:expand-more-rounded"
                          class={`display-caret text-[1.1rem] text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${!overlayCollapsed ? 'rotated' : ''}`}></Icon>
                </div>
                <div class="display-section-body" class:collapsed={overlayCollapsed}>
                    <div class="space-y-2">
                        <div class="rounded-md bg-(--btn-regular-bg) p-2">
                            <div class="flex items-center justify-between mb-1">
                                <span class="text-sm font-medium text-(--btn-content) opacity-80">{i18n(I18nKey.overlayOpacity)}</span>
                                <span class="text-xs text-(--btn-content)">{Math.round(overlayOpacity)}%</span>
                            </div>
                            <input
                                aria-label={i18n(I18nKey.overlayOpacity)}
                                type="range"
                                min="20"
                                max="100"
                                step="1"
                                value={Math.round(overlayOpacity)}
                                oninput={(e) => { overlayOpacity = Number((e.currentTarget as HTMLInputElement).value); setOverlayOpacity(overlayOpacity); }}
                                class="slider w-full overlay-slider"
                            />
                        </div>
                        <div class="rounded-md bg-(--btn-regular-bg) p-2">
                            <div class="flex items-center justify-between mb-1">
                                <span class="text-sm font-medium text-(--btn-content) opacity-80">{i18n(I18nKey.overlayBlur)}</span>
                                <span class="text-xs text-(--btn-content)">{overlayBlur.toFixed(1)}px</span>
                            </div>
                            <input
                                aria-label={i18n(I18nKey.overlayBlur)}
                                type="range"
                                min="0"
                                max="20"
                                step="0.5"
                                value={overlayBlur}
                                oninput={(e) => { overlayBlur = Number((e.currentTarget as HTMLInputElement).value); setOverlayBlur(overlayBlur); }}
                                class="slider w-full overlay-slider"
                            />
                        </div>
                        <div class="rounded-md bg-(--btn-regular-bg) p-2">
                            <div class="flex items-center justify-between mb-1">
                                <span class="text-sm font-medium text-(--btn-content) opacity-80">{i18n(I18nKey.overlayCardOpacity)}</span>
                                <span class="text-xs text-(--btn-content)">{Math.round(overlayCardOpacity)}%</span>
                            </div>
                            <input
                                aria-label={i18n(I18nKey.overlayCardOpacity)}
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={Math.round(overlayCardOpacity)}
                                oninput={(e) => { overlayCardOpacity = Number((e.currentTarget as HTMLInputElement).value); setOverlayCardOpacity(overlayCardOpacity); }}
                                class="slider w-full overlay-slider"
                            />
                        </div>
                    </div>
                </div>
            </div>
            {/if}

            <!-- Banner Settings Section -->
            {#if (wallpaperMode === WALLPAPER_BANNER || wallpaperMode === WALLPAPER_FULLSCREEN) && (isBannerTitleSwitchable || isCarouselSwitchable || isWavesSwitchable)}
            <div class="display-section">
                <div
                    class="display-section-header"
                    role="button"
                    tabindex="0"
                    onclick={(e) => { if ((e.target as HTMLElement).tagName !== 'BUTTON') toggleSection('banner'); }}
                    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSection('banner'); } }}
                >
                    <div class="flex gap-1.5 font-bold text-[0.9rem] items-center text-neutral-900 dark:text-neutral-100 transition relative ml-2.5
                        before:w-1 before:h-3.5 before:rounded-md before:bg-(--primary)
                        before:absolute before:-left-2.5 before:top-1/2 before:-translate-y-1/2"
                    >
                        {i18n(I18nKey.wallpaperSettings)}
                        <button aria-label="Reset to Default" class="btn-regular w-5 h-5 rounded-md active:scale-90"
                                class:opacity-0={bannerSettingsIsDefault} class:pointer-events-none={bannerSettingsIsDefault}
                                onclick={(e) => { e.stopPropagation(); resetBannerSettings(); }}>
                            <div class="text-(--btn-content)">
                                <Icon icon="fa7-solid:arrow-rotate-left" class="text-[0.7rem]"></Icon>
                            </div>
                        </button>
                    </div>
                    <Icon icon="material-symbols:expand-more-rounded"
                          class={`display-caret text-[1.1rem] text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${!bannerCollapsed ? 'rotated' : ''}`}></Icon>
                </div>
                <div class="display-section-body" class:collapsed={bannerCollapsed}>
                    <div class="space-y-1">
                        {#if isBannerTitleSwitchable}
                        <button
                            class="w-full btn-regular rounded-md py-2 px-3 flex items-center gap-3 text-left active:scale-95 transition-all relative overflow-hidden"
                            class:bg-(--btn-regular-bg-hover)={bannerTitleEnabled}
                            onclick={toggleBannerTitleEnabled}
                        >
                            <Icon icon="material-symbols:titlecase-rounded" class="text-[1.25rem] shrink-0"></Icon>
                            <span class="text-sm flex-1">{i18n(I18nKey.wallpaperTitle)}</span>
                            <div class="w-10 h-5 rounded-full transition-all duration-200 relative"
                                 class:bg-(--primary)={bannerTitleEnabled}
                                 class:bg-(--btn-regular-bg-active)={!bannerTitleEnabled}>
                                <div class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
                                     class:left-0.5={!bannerTitleEnabled}
                                     class:left-5={bannerTitleEnabled}></div>
                            </div>
                        </button>
                        {/if}
                        {#if isCarouselSwitchable}
                        <button
                            class="w-full btn-regular rounded-md py-2 px-3 flex items-center gap-3 text-left active:scale-95 transition-all relative overflow-hidden"
                            class:bg-(--btn-regular-bg-hover)={wallpaperCarouselEnabled}
                            onclick={toggleWallpaperCarouselEnabled}
                        >
                            <Icon icon="material-symbols:view-carousel-outline" class="text-[1.25rem] shrink-0"></Icon>
                            <span class="text-sm flex-1">{i18n(I18nKey.wallpaperCarousel)}</span>
                            <div class="w-10 h-5 rounded-full transition-all duration-200 relative"
                                 class:bg-(--primary)={wallpaperCarouselEnabled}
                                 class:bg-(--btn-regular-bg-active)={!wallpaperCarouselEnabled}>
                                <div class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
                                     class:left-0.5={!wallpaperCarouselEnabled}
                                     class:left-5={wallpaperCarouselEnabled}></div>
                            </div>
                        </button>
                        {/if}
                        {#if isWavesSwitchable}
                        <button
                            class="w-full btn-regular rounded-md py-2 px-3 flex items-center gap-3 text-left active:scale-95 transition-all relative overflow-hidden"
                            class:bg-(--btn-regular-bg-hover)={wavesEnabled}
                            onclick={toggleWavesEnabled}
                        >
                            <Icon icon="material-symbols:airwave-rounded" class="text-[1.25rem] shrink-0"></Icon>
                            <span class="text-sm flex-1">{i18n(I18nKey.wavesAnimation)}</span>
                            <div class="w-10 h-5 rounded-full transition-all duration-200 relative"
                                 class:bg-(--primary)={wavesEnabled}
                                 class:bg-(--btn-regular-bg-active)={!wavesEnabled}>
                                <div class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
                                     class:left-0.5={!wavesEnabled}
                                     class:left-5={wavesEnabled}></div>
                            </div>
                        </button>
                        {/if}
                        <button
                            class="w-full btn-regular rounded-md py-2 px-3 flex items-center gap-3 text-left active:scale-95 transition-all relative overflow-hidden"
                            class:bg-(--btn-regular-bg-hover)={gradientEnabled}
                            onclick={toggleGradientEnabled}
                        >
                            <Icon icon="material-symbols:gradient" class="text-[1.25rem] shrink-0"></Icon>
                            <span class="text-sm flex-1">{i18n(I18nKey.gradientTransition)}</span>
                            <div class="w-10 h-5 rounded-full transition-all duration-200 relative"
                                 class:bg-(--primary)={gradientEnabled}
                                 class:bg-(--btn-regular-bg-active)={!gradientEnabled}>
                                <div class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
                                     class:left-0.5={!gradientEnabled}
                                     class:left-5={gradientEnabled}></div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
            {/if}
        </div>
        {/if}

        <!-- ====== (布局 Tab 已整合到主题 Tab，此处保留空块) ====== -->
    </div>
</div>
{/if}

<style lang="stylus">
    #display-setting
        input[type="range"]
            -webkit-appearance none
            height 1.5rem
            border-radius 999px
            background-image unquote("linear-gradient(90deg, var(--primary) 0 var(--range-progress, 50%), hsla(var(--hue), 22%, 28%, 0.18) var(--range-progress, 50%) 100%)")
            transition background-image 0.15s ease-in-out

        input[type="range"].overlay-slider
            height 0.85rem

            /* Input Thumb */
            &::-webkit-slider-thumb
                -webkit-appearance none
                height 0
                width 0
                border 0
                border-radius 0
                background transparent
                box-shadow none

            &::-moz-range-thumb
                height 0
                width 0
                border 0
                border-radius 0
                background transparent
                box-shadow none

            &::-ms-thumb
                -webkit-appearance none
                height 0
                width 0
                border 0
                border-radius 0
                background transparent
                box-shadow none

        #colorSlider
            background-image var(--color-selection-bar)
            transition background-image 0.15s ease-in-out

            &::-webkit-slider-thumb
                -webkit-appearance none
                height 1rem
                width 0.5rem
                border-radius 0.125rem
                background rgba(255, 255, 255, 0.7)
                box-shadow none

                &:hover
                    background rgba(255, 255, 255, 0.8)

                &:active
                    background rgba(255, 255, 255, 0.6)

            &::-moz-range-thumb
                -webkit-appearance none
                height 1rem
                width 0.5rem
                border-radius 0.125rem
                border-width 0
                background rgba(255, 255, 255, 0.7)
                box-shadow none

                &:hover
                    background rgba(255, 255, 255, 0.8)

                &:active
                    background rgba(255, 255, 255, 0.6)

            &::-ms-thumb
                -webkit-appearance none
                height 1rem
                width 0.5rem
                border-radius 0.125rem
                background rgba(255, 255, 255, 0.7)
                box-shadow none

                &:hover
                    background rgba(255, 255, 255, 0.8)

                &:active
                    background rgba(255, 255, 255, 0.6)

        /* ========== 折叠 / Tab 层级样式 ========== */
        .display-tabs
            display flex
            gap 0.25rem
            padding 0.25rem
            margin 0 -0.25rem 0.625rem
            background var(--btn-regular-bg)
            border-radius 0.5rem
            overflow hidden

        .display-tab
            flex 1
            padding 0.4rem 0.6rem
            border-radius 0.4rem
            font-size 0.8rem
            font-weight 600
            color rgba(0, 0, 0, 0.6)
            background transparent
            border 0
            cursor pointer
            transition all 0.18s ease
            user-select none
            -webkit-tap-highlight-color transparent

            :global(.dark) &
                color rgba(255, 255, 255, 0.6)

            &:not(.active):hover
                background var(--btn-regular-bg-hover)
                color var(--deep-text)

            &.active
                background var(--primary)
                color #fff
                box-shadow 0 2px 6px rgba(0, 0, 0, 0.1)

            &:focus-visible
                outline 2px solid var(--primary)
                outline-offset 2px

        .display-content
            max-height unquote("min(82vh, 720px)")
            overflow-y auto
            overflow-x hidden
            scrollbar-width thin
            padding-right 2px

        .display-tab-panel
            animation display-tab-fade 0.18s ease both

        @keyframes display-tab-fade
            from
                opacity 0
                transform translateY(2px)
            to
                opacity 1
                transform translateY(0)

        .display-section
            margin-bottom 0.4rem

            &:last-child
                margin-bottom 0

        .display-section-header
            display flex
            align-items center
            justify-content space-between
            padding 0.4rem 0.5rem
            border-radius 0.5rem
            cursor pointer
            user-select none
            transition background 0.15s ease
            gap 0.5rem

            &:hover
                background var(--btn-regular-bg)

            &:focus-visible
                outline 2px solid var(--primary)
                outline-offset -2px

        .display-section-body
            max-height 1200px
            overflow hidden
            opacity 1
            padding 0.4rem 0.5rem 0
            transition unquote("max-height 0.28s ease, opacity 0.22s ease, padding 0.28s ease")

            &.collapsed
                max-height 0
                opacity 0
                padding 0
                pointer-events none

        .display-caret
            display inline-block
            transform rotate(0deg)
            transition transform 0.2s ease

            &.rotated
                transform rotate(180deg)

        @media (prefers-reduced-motion: reduce)
            .display-section-body
                transition none
            .display-caret
                transition none
            .display-tab
                transition none
            .display-tab-panel
                animation none

</style>
