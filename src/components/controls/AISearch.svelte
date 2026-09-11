<script lang="ts">
import { onMount, tick } from "svelte";
import Icon from "@/components/common/Icon.svelte";
import { aiSearchConfig } from "@/config";

interface Message {
	role: "user" | "assistant";
	content: string;
	refs?: { title: string; path: string; published?: string; excerpt: string }[];
	streaming?: boolean;
}

interface SessionMeta {
	id: string;
	title: string;
	updatedAt: number;
}

const STORAGE_SESSIONS_KEY = "ai-chat:sessions";
const STORAGE_SESSION_PREFIX = "ai-chat:session:";
const MAX_SESSIONS = 20;

const SUGGESTIONS = aiSearchConfig.suggestions || [
	"博客的技术栈是什么？",
	"介绍一下自己",
];
const FOLLOW_UP_SUGGESTIONS = aiSearchConfig.followUpSuggestions || [
	"说说最近的文章",
	"有什么推荐的项目？",
];

let isOpen = $state(false);
let inputVal = $state("");
let messages = $state<Message[]>([]);
let isLoading = $state(false);
let messagesEl: HTMLDivElement;
let inputEl: HTMLTextAreaElement;
let abortCtrl: AbortController | null = null;
let sessionId = $state("");
let sessionList = $state<SessionMeta[]>([]);
let showSessionList = $state(false);

const TEXTAREA_MIN_HEIGHT = 128;
const TEXTAREA_MAX_HEIGHT = 256;

function startResize(e: MouseEvent | TouchEvent) {
	e.preventDefault();
	const startY = "touches" in e ? e.touches[0].clientY : e.clientY;
	const startHeight = inputEl.offsetHeight;

	function onMove(ev: MouseEvent | TouchEvent) {
		const currentY = "touches" in ev ? ev.touches[0].clientY : ev.clientY;
		const newHeight = Math.max(
			TEXTAREA_MIN_HEIGHT,
			Math.min(TEXTAREA_MAX_HEIGHT, startHeight - (currentY - startY)),
		);
		inputEl.style.height = `${newHeight}px`;
	}

	function onEnd() {
		document.removeEventListener("mousemove", onMove);
		document.removeEventListener("mouseup", onEnd);
		document.removeEventListener("touchmove", onMove);
		document.removeEventListener("touchend", onEnd);
	}

	document.addEventListener("mousemove", onMove);
	document.addEventListener("mouseup", onEnd);
	document.addEventListener("touchmove", onMove);
	document.addEventListener("touchend", onEnd);
}

function generateSessionId(): string {
	return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getSessionTitle(msgs: Message[]): string {
	const firstUser = msgs.find((m) => m.role === "user");
	if (!firstUser) return "新对话";
	return firstUser.content.length > 20
		? `${firstUser.content.slice(0, 20)}...`
		: firstUser.content;
}

function loadSessionListFromStorage(): SessionMeta[] {
	try {
		const raw = localStorage.getItem(STORAGE_SESSIONS_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function saveSessionListToStorage(list: SessionMeta[]) {
	try {
		localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(list));
	} catch {}
}

function saveCurrentSession() {
	if (!sessionId || messages.length === 0) return;
	if (messages.some((m) => m.streaming)) return;
	try {
		localStorage.setItem(
			STORAGE_SESSION_PREFIX + sessionId,
			JSON.stringify(messages),
		);
		const existing = sessionList.find((s) => s.id === sessionId);
		if (existing) {
			existing.title = getSessionTitle(messages);
			existing.updatedAt = Date.now();
		} else {
			sessionList.unshift({
				id: sessionId,
				title: getSessionTitle(messages),
				updatedAt: Date.now(),
			});
		}
		if (sessionList.length > MAX_SESSIONS) {
			const removed = sessionList.splice(MAX_SESSIONS);
			for (const s of removed) {
				try {
					localStorage.removeItem(STORAGE_SESSION_PREFIX + s.id);
				} catch {}
			}
		}
		sessionList = [...sessionList];
		saveSessionListToStorage(sessionList);
	} catch {}
}

function loadSessionMessages(id: string): Message[] {
	try {
		const raw = localStorage.getItem(STORAGE_SESSION_PREFIX + id);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function deleteSession(id: string) {
	try {
		localStorage.removeItem(STORAGE_SESSION_PREFIX + id);
	} catch {}
	sessionList = sessionList.filter((s) => s.id !== id);
	saveSessionListToStorage(sessionList);
	if (id === sessionId) {
		sessionId = generateSessionId();
		messages = [];
		showSessionList = false;
		scrollToBottom();
	}
}

function startNewSession() {
	saveCurrentSession();
	sessionId = generateSessionId();
	messages = [];
	showSessionList = false;
}

function switchSession(id: string) {
	if (id === sessionId) {
		showSessionList = false;
		return;
	}
	saveCurrentSession();
	sessionId = id;
	messages = loadSessionMessages(id);
	showSessionList = false;
	scrollToBottom();
}

function formatTime(ts: number): string {
	const diff = Date.now() - ts;
	if (diff < 60000) return "刚刚";
	if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
	if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
	return `${Math.floor(diff / 86400000)} 天前`;
}

export function toggle() {
	isOpen = !isOpen;
	(window as any).__aiSearchOpen = isOpen;
	if (isOpen) {
		tick().then(() => {
			inputEl?.focus();
		});
	}
}

function close() {
	isOpen = false;
	(window as any).__aiSearchOpen = false;
}

function scrollToBottom() {
	tick().then(() => {
		if (messagesEl) {
			requestAnimationFrame(() => {
				messagesEl.scrollTo({
					top: messagesEl.scrollHeight,
					left: 0,
					behavior: "auto",
				});
			});
		}
	});
}

function isSafeUrl(value: string): boolean {
	return /^(https?:|mailto:|tel:|\/|#|\.\/|\.\.\/|\?)/i.test(value.trim());
}

function renderSimpleMd(text: string): string {
	let html = text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");

	html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
	html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
	html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
	html = html.replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, "<em>$1</em>");
	html = html.replace(/~~([^~]+)~~/g, "<del>$1</del>");
	html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
		if (!isSafeUrl(url)) return `[${label}](${url})`;
		return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
	});
	html = html.replace(/\n/g, "<br>");

	return html;
}

/**
 * 把代理返回的错误响应翻译成给访客看的可读提示。
 * 503 = 服务端没配环境变量；403 = 同源校验失败；502 = 上游报错（多为密钥无效）。
 */
async function describeError(resp: Response): Promise<string> {
	let detail = "";
	try {
		const data = await resp.json();
		detail = data?.detail || data?.message || data?.error || "";
	} catch {
		detail = "";
	}
	if (resp.status === 503) {
		return (
			"AI 对话还没配置好~\n\n" +
			"需要在部署环境配置 `AI_BASE_URL` / `AI_API_KEY` / `AI_MODEL` 三个环境变量" +
			"（对应 CC Switch 里那份 Claude 自定义配置）。" +
			(detail ? `\n\n> ${detail}` : "")
		);
	}
	if (resp.status === 403) {
		return "请求被拒绝了：请从站内页面发起对话~";
	}
	if (resp.status === 400) {
		return `请求有点问题：${detail || "内容格式不正确"}`;
	}
	if (resp.status === 502) {
		return `上游 AI 服务报错了${detail ? `：${detail}` : "，请检查 AI_API_KEY 是否有效~"}`;
	}
	return `抱歉，请求出错了（HTTP ${resp.status}）${detail ? `：${detail}` : ""}`;
}

async function send(text?: string) {
	const q = (text || inputVal).trim();
	if (!q || isLoading) return;

	const MAX_INPUT_LEN = 2000;
	if (q.length > MAX_INPUT_LEN) {
		messages = [
			...messages,
			{
				role: "assistant",
				content: `输入太长了，最多支持 ${MAX_INPUT_LEN} 个字符~`,
			},
		];
		scrollToBottom();
		return;
	}

	inputVal = "";
	messages = [...messages, { role: "user", content: q }];
	scrollToBottom();

	isLoading = true;
	abortCtrl = new AbortController();

	const aiIdx = messages.length;
	messages = [
		...messages,
		{ role: "assistant", content: "", streaming: true, refs: [] },
	];
	scrollToBottom();

	try {
		// 携带最近若干轮历史：剔除 refs / streaming 等内部字段，
		// 并排除刚插入的流式占位（它还没有内容）
		const history = messages
			.slice(0, aiIdx)
			.slice(-(aiSearchConfig.maxHistory || 10))
			.map((m) => ({ role: m.role, content: m.content }));

		const resp = await fetch(aiSearchConfig.apiPath || "/api/ai-chat/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ messages: history }),
			signal: abortCtrl.signal,
		});

		if (!resp.ok || !resp.body) {
			messages[aiIdx].content = await describeError(resp);
			messages = [...messages];
			scrollToBottom();
			return;
		}

		// 解析代理归一化后的 SSE：data: {"text":"..."} / {"error":"..."} / [DONE]
		const reader = resp.body.getReader();
		const decoder = new TextDecoder();
		let buffer = "";
		let streamErr = "";

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");
			buffer = lines.pop() || "";
			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed.startsWith("data:")) continue;
				const data = trimmed.slice(5).trim();
				if (!data || data === "[DONE]") continue;
				try {
					const json = JSON.parse(data);
					if (json.error) {
						streamErr = json.error;
					} else if (json.text) {
						messages[aiIdx].content += json.text;
						messages = [...messages];
						scrollToBottom();
					}
				} catch {
					// 忽略无法解析的行
				}
			}
		}

		if (streamErr && !messages[aiIdx].content.trim()) {
			messages[aiIdx].content = `抱歉，生成失败了：${streamErr}`;
			messages = [...messages];
		} else if (streamErr) {
			messages[aiIdx].content += `\n\n> *(中断：${streamErr})*`;
			messages = [...messages];
		}
	} catch (err: unknown) {
		const e = err instanceof Error ? err : new Error(String(err));
		if (e.name === "AbortError") {
			messages[aiIdx].content += "\n\n> *(已取消)*";
		} else {
			messages[aiIdx].content = "抱歉，请求出错了，请稍后再试~";
		}
		messages = [...messages];
	} finally {
		messages[aiIdx].streaming = false;
		messages = [...messages];
		isLoading = false;
		abortCtrl = null;
		scrollToBottom();
		saveCurrentSession();
	}
}

function stop() {
	abortCtrl?.abort();
}

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "Enter" && !e.shiftKey) {
		e.preventDefault();
		send();
	}
	if (e.key === "Escape") {
		if (showSessionList) {
			showSessionList = false;
		} else {
			close();
		}
	}
}

onMount(() => {
	sessionList = loadSessionListFromStorage();
	if (sessionList.length > 0) {
		const latest = sessionList[0];
		sessionId = latest.id;
		messages = loadSessionMessages(latest.id);
	} else {
		sessionId = generateSessionId();
	}

	const toggleHandler = () => toggle();
	window.addEventListener("toggle-ai-search", toggleHandler);

	return () => {
		saveCurrentSession();
		window.removeEventListener("toggle-ai-search", toggleHandler);
	};
});
</script>

{#if isOpen}
	<div class="ai-overlay" onclick={close}>
		<div class="ai-panel" onclick={(e) => e.stopPropagation()}>
			<!-- 标题栏 -->
			<div class="ai-header">
				<div class="ai-header__left">
					<img
						src={aiSearchConfig.aiAvatar}
						alt={aiSearchConfig.aiName}
						class="ai-header__avatar"
					/>
					<span class="ai-header__name">{aiSearchConfig.aiName}</span>
					<span class="ai-header__model">{aiSearchConfig.modelName}</span>
				</div>
				<div class="ai-header__actions">
					{#if sessionList.length > 0}
						<button
							class="ai-icon-btn"
							class:ai-icon-btn--active={showSessionList}
							onclick={() => (showSessionList = !showSessionList)}
							title="历史会话"
						>
							<Icon icon="material-symbols:history" />
						</button>
					{/if}
					<button class="ai-icon-btn" onclick={startNewSession} title="新建会话">
						<Icon icon="material-symbols:add-circle-outline" />
					</button>
					<button class="ai-icon-btn" onclick={close} title="关闭">
						<Icon icon="material-symbols:close" />
					</button>
				</div>
			</div>

			<!-- 历史会话列表 -->
			{#if showSessionList}
				<div class="ai-session-list">
					{#each sessionList as sess}
						<button
							class="ai-session-item"
							class:ai-session-item--active={sess.id === sessionId}
							onclick={() => switchSession(sess.id)}
						>
							<div class="ai-session-info">
								<span class="ai-session-title">{sess.title}</span>
								<span class="ai-session-time">{formatTime(sess.updatedAt)}</span>
							</div>
							<span
								class="ai-session-delete"
								onclick={(e) => { e.stopPropagation(); deleteSession(sess.id); }}
								title="删除会话"
							>
								<Icon icon="material-symbols:close" size="sm" />
							</span>
						</button>
					{/each}
					{#if sessionList.length === 0}
						<div class="ai-session-empty">暂无历史会话</div>
					{/if}
				</div>
			{/if}

			<!-- 消息列表 -->
			<div class="ai-messages" bind:this={messagesEl}>
				{#if messages.length === 0}
					<div class="ai-empty">
						<div class="ai-empty__icon-wrapper">
							<img
								src={aiSearchConfig.aiAvatar}
								alt={aiSearchConfig.aiName}
								class="ai-empty__avatar"
							/>
						</div>
						<h2 class="ai-empty__title">有什么想问的？</h2>
						<div class="ai-empty__suggestions-box">
							{#each SUGGESTIONS as suggestion}
								<button class="ai-empty__suggestion" onclick={() => send(suggestion)}>
									{suggestion}
								</button>
							{/each}
						</div>
					</div>
				{/if}

				{#each messages as msg, i}
					<div
						class="ai-msg ai-msg--{msg.role}"
						class:ai-msg--turn-start={msg.role === "user" && i > 0}
					>
						{#if msg.role === "assistant"}
							<div class="ai-msg__avatar">
								<img src={aiSearchConfig.aiAvatar} alt={aiSearchConfig.aiName} class="ai-msg__avatar-img" />
							</div>
						{/if}
						<div class="ai-msg__body">
							<div class="ai-msg__content">
								{#if msg.role === "user"}
									<span class="ai-msg__text">{msg.content}</span>
									<span class="ai-msg__bubble"></span>
									<span class="ai-msg__bubble ai-msg__bubble--small"></span>
								{:else if msg.streaming && !msg.content.trim()}
									<svg class="ai-loader" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path class="ai-loader__line" d="m4.9 4.9 2.9 2.9" />
										<path class="ai-loader__line" d="M2 12h4" />
										<path class="ai-loader__line" d="m4.9 19.1 2.9-2.9" />
										<path class="ai-loader__line" d="M12 18v4" />
										<path class="ai-loader__line" d="m16.2 16.2 2.9 2.9" />
										<path class="ai-loader__line" d="M18 12h4" />
										<path class="ai-loader__line" d="m16.2 7.8 2.9-2.9" />
										<path class="ai-loader__line" d="M12 2v4" />
									</svg>
								{:else}
									<span class="ai-msg__text">{@html renderSimpleMd(msg.content)}</span>
									{#if msg.streaming}
										<span class="ai-cursor"></span>
									{/if}
								{/if}
								{#if msg.role === "assistant" && msg.refs && msg.refs.length > 0}
									<div class="ai-refs">
										<div class="ai-refs__title">参考文章</div>
										{#each msg.refs as ref}
											<a href={isSafeUrl(ref.path) ? ref.path : '#'} class="ai-refs__link" onclick={() => (isOpen = false)}>
												<Icon icon="material-symbols:article-outline" size="sm" />
												<span>{ref.title}</span>
												{#if ref.published}
													<span class="ai-refs__date">{ref.published}</span>
												{/if}
											</a>
										{/each}
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- 输入区域 -->
			<div class="ai-input-area">
				<div class="ai-input-area__box">
					<div
						class="ai-input-area__resize-handle"
						onmousedown={startResize}
						ontouchstart={startResize}
						title="拖拽调整高度"
					>
						<span class="ai-input-area__resize-grip"></span>
					</div>
					{#if messages.length > 0 && !isLoading}
						<div class="ai-input-area__tags">
							{#each FOLLOW_UP_SUGGESTIONS as suggestion}
								<button
									class="ai-input-area__tag"
									type="button"
									disabled={isLoading}
									onclick={() => send(suggestion)}
								>
									{suggestion}
								</button>
							{/each}
						</div>
					{/if}
					<label class="ai-input-area__label" for="ai-chat-input">Ask</label>
					<div class="ai-input-area__textarea-wrapper">
						<textarea
							id="ai-chat-input"
							bind:this={inputEl}
							bind:value={inputVal}
							onkeydown={handleKeydown}
							placeholder="输入你的问题..."
							disabled={isLoading}
							class="ai-input-area__textarea"
							rows="5"
							aria-label="AI 搜索问题"
						></textarea>
						{#if isLoading}
							<button
								type="button"
								class="ai-input-area__submit ai-input-area__submit--stop"
								onclick={stop}
								title="停止生成"
								aria-label="停止生成"
							>
								<Icon icon="material-symbols:stop-circle-outline" size="lg" />
							</button>
						{:else}
							<button
								type="button"
								class="ai-input-area__submit"
								onclick={() => send()}
								disabled={!inputVal.trim()}
								title="发送"
								aria-label="发送"
							>
								<Icon icon="material-symbols:arrow-outward-rounded" size="lg" />
							</button>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
