const DEFAULT_HIDE_DELAY = 0;
const DEFAULT_MAX_WAIT = 2000;
export const LOADER_READY_EVENT = "firefly:page-loader-ready";
export const LOADER_HIDDEN_EVENT = "firefly:page-loader-hidden";

function delay(ms) {
	if (ms <= 0) return Promise.resolve();
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(promise, timeout) {
	return new Promise((resolve, reject) => {
		const timeoutId = setTimeout(resolve, timeout);
		promise.then(
			(value) => {
				clearTimeout(timeoutId);
				resolve(value);
			},
			(error) => {
				clearTimeout(timeoutId);
				reject(error);
			},
		);
	});
}

function dispatchDomEvent(documentRef, type, detail) {
	const CustomEventCtor = globalThis.CustomEvent;
	const event =
		typeof CustomEventCtor === "function"
			? new CustomEventCtor(type, { detail })
			: { type, detail };
	documentRef.dispatchEvent?.(event);
}

export function createPageLoaderController({
	hideDelay = DEFAULT_HIDE_DELAY,
	onStateChange,
	waitForPageReady = () => Promise.resolve(),
} = {}) {
	let visible = false;
	let token = 0;

	function emit(state) {
		onStateChange?.(state);
	}

	function show() {
		token += 1;
		if (!visible) {
			visible = true;
			emit("visible");
		}
		return token;
	}

	async function hideWhenReady(reason) {
		const currentToken = token;
		await waitForPageReady({ reason, token: currentToken });
		await delay(hideDelay);
		if (currentToken !== token || !visible) return false;
		visible = false;
		emit("hidden");
		return true;
	}

	function hideNow() {
		if (!visible) return false;
		token += 1;
		visible = false;
		emit("hidden");
		return true;
	}

	return {
		hideNow,
		hideWhenReady,
		isVisible: () => visible,
		show,
	};
}

function collectPendingImages(documentRef) {
	const containers = documentRef.querySelectorAll(
		"#swup-container, #left-sidebar-dynamic, #right-sidebar-dynamic",
	);
	const scope = containers.length > 0 ? [...containers] : [documentRef];
	const images = scope.flatMap((container) => [
		...container.querySelectorAll("img"),
	]);
	return images.filter((image) => {
		// 跳过尚未进入视口的懒加载图片，避免它们阻塞加载页隐藏
		if (image.loading === "lazy" && !image.complete) return false;
		return !image.complete;
	});
}

function waitForImage(image) {
	return new Promise((resolve) => {
		image.addEventListener("load", resolve, { once: true });
		image.addEventListener("error", resolve, { once: true });
	});
}

export function isPageLoaderVisible({ document: documentRef = document } = {}) {
	const loader = documentRef.getElementById("page-loader");
	return Boolean(
		loader &&
			!loader.hidden &&
			!loader.classList.contains("page-loader--hidden"),
	);
}

export function waitForPageLoaderHidden({
	document: documentRef = document,
} = {}) {
	if (!isPageLoaderVisible({ document: documentRef })) return Promise.resolve();
	return new Promise((resolve) => {
		documentRef.addEventListener(LOADER_HIDDEN_EVENT, resolve, { once: true });
	});
}

export function waitForBrowserPageReady({
	document: documentRef = document,
	maxWait = DEFAULT_MAX_WAIT,
} = {}) {
	const imageSettled = Promise.all(
		collectPendingImages(documentRef).map(waitForImage),
	);
	const fontsReady = documentRef.fonts?.ready ?? Promise.resolve();
	return withTimeout(Promise.all([imageSettled, fontsReady]), maxWait);
}

function applyDomState({ document: documentRef, loader }, state) {
	const root = documentRef.documentElement;
	const body = documentRef.body;
	if (state === "visible") {
		loader.hidden = false;
		loader.classList.remove("page-loader--hidden");
		loader.classList.add("page-loader--visible");
		root.classList.add("is-page-loading");
		body?.setAttribute("aria-busy", "true");
		return;
	}

	loader.classList.remove("page-loader--visible");
	loader.classList.add("page-loader--hidden");
	root.classList.remove("is-page-loading");
	body?.removeAttribute("aria-busy");
	window.setTimeout(() => {
		if (loader.classList.contains("page-loader--hidden")) {
			loader.hidden = true;
			dispatchDomEvent(documentRef, LOADER_HIDDEN_EVENT, {
				timestamp: Date.now(),
			});
		}
	}, DEFAULT_HIDE_DELAY);
}

function bindSwup({ controller, document: documentRef, window: windowRef }) {
	let isBound = false;

	function bind() {
		if (isBound || !windowRef.swup?.hooks) return;
		isBound = true;

		// Swup SPA 导航期间不显示 PageLoader：
		// Swup 自身已有 350ms 淡入淡出过渡（.transition-swup-fade / .transition-main），
		// 再叠加白色全屏 PageLoader 会造成"闪一下像刷新"的视觉问题。
		// PageLoader 仅用于首次硬加载（见 initPageLoader 中的 controller.show("initial")）。
		// 保留 hideWhenReady 作为安全兜底，确保即使其他地方误 show 了 loader 也能正确隐藏。
		windowRef.swup.hooks.on("page:view", () => {
			void controller.hideWhenReady("swup-page-view");
		});
		windowRef.swup.hooks.on("visit:end", () => {
			void controller.hideWhenReady("swup-visit-end");
		});
	}

	bind();
	documentRef.addEventListener("swup:enable", bind, { once: true });
}

function isMobile(windowRef) {
	return windowRef.matchMedia("(max-width: 768px)").matches;
}

export function initPageLoader({
	document: documentRef = document,
	window: windowRef = window,
} = {}) {
	if (windowRef.__fireflyPageLoader) return windowRef.__fireflyPageLoader;

	const loader = documentRef.getElementById("page-loader");
	if (!loader) return null;

	// Mobile: skip page loader entirely
	if (isMobile(windowRef)) {
		loader.hidden = true;
		loader.classList.add("page-loader--hidden");
		loader.classList.remove("page-loader--visible");
		documentRef.documentElement.classList.remove("is-page-loading");
		documentRef.body?.removeAttribute("aria-busy");
		// Dispatch hidden event so any waiting code can proceed
		dispatchDomEvent(documentRef, LOADER_HIDDEN_EVENT, {
			timestamp: Date.now(),
		});
		return null;
	}

	const controller = createPageLoaderController({
		onStateChange: (state) =>
			applyDomState({ document: documentRef, loader }, state),
		waitForPageReady: () => waitForBrowserPageReady({ document: documentRef }),
	});
	windowRef.__fireflyPageLoader = controller;

	documentRef.addEventListener("astro:page-load", () => {
		documentRef.dispatchEvent(new CustomEvent(LOADER_READY_EVENT));
		void controller.hideWhenReady("astro-page-load");
	});

	bindSwup({ controller, document: documentRef, window: windowRef });

	return controller;
}
