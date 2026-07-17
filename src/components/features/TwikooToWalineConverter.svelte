<script lang="ts">
	let inputEl: HTMLTextAreaElement;
	let outputEl: HTMLTextAreaElement;
	let msgEl: HTMLParagraphElement;
	let uploadBtn: HTMLButtonElement;
	let convertBtn: HTMLButtonElement;
	let downloadBtn: HTMLButtonElement;
	let clearBtn: HTMLButtonElement;
	let fixUrlBtn: HTMLButtonElement;
	let oldUrlInput: HTMLInputElement;
	let newUrlInput: HTMLInputElement;
	let fileInput: HTMLInputElement;
	let walineJson: any = null;

	function setMsg(text: string, type: string = "info") {
		if (!msgEl) return;
		msgEl.textContent = text;
		msgEl.className = "converter-tip " + type;
	}

	function handleUpload() {
		fileInput?.click();
	}

	async function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const f = target.files?.[0];
		if (!f || !inputEl) return;
		inputEl.value = await f.text();
		setMsg(`已加载文件：${f.name}`, "success");
	}

	function handleClear() {
		if (inputEl) inputEl.value = "";
		if (outputEl) outputEl.value = "";
		walineJson = null;
		if (downloadBtn) downloadBtn.disabled = true;
		setMsg("");
		if (oldUrlInput) oldUrlInput.value = "";
		if (newUrlInput) newUrlInput.value = "";
	}

	function formatISO(ts: any): string {
		if (!ts || isNaN(Number(ts))) return new Date().toISOString();
		const date = new Date(Number(ts));
		if (isNaN(date.getTime())) return new Date().toISOString();
		return date.toISOString();
	}

	function normalizeUrl(path: string): string {
		let url = path?.trim() || "/";
		if (url === "/") return url;
		if (!url.endsWith("/")) {
			url += "/";
		}
		return url;
	}

	function handleFixUrl() {
		if (!walineJson) {
			setMsg("请先转换数据再替换路径", "error");
			return;
		}
		const oldPre = oldUrlInput?.value.trim() || "";
		const newPre = newUrlInput?.value.trim() || "";
		if (!oldPre || !newPre) {
			setMsg("请填写原路径和新路径前缀", "error");
			return;
		}
		let count = 0;
		walineJson.data.Comment.forEach((item: any) => {
			if (item.url.includes(oldPre)) {
				item.url = item.url.replace(oldPre, newPre);
				item.url = normalizeUrl(item.url);
				count++;
			}
		});
		if (outputEl) outputEl.value = JSON.stringify(walineJson, null, 2);
		setMsg(`路径替换完成，共修改 ${count} 条评论 URL`, "success");
	}

	function handleConvert() {
		try {
			const raw = inputEl?.value.trim() || "";
			if (!raw) throw "输入内容不能为空";
			const twikooList = JSON.parse(raw);
			if (!Array.isArray(twikooList)) throw "Twikoo 导出数据必须是数组格式";

			let idSeq = 1;
			const commentArr = twikooList.map((tk: any) => {
				let status = "approved";
				if (tk.isSpam === 1) status = "spam";
				const comment = tk.comment?.trim() || "无评论内容";
				const pid = tk.pid || null;
				const rid = tk.rid || null;
				const url = normalizeUrl(tk.url);
				const insertedAt = formatISO(tk.created);
				const updatedAt = formatISO(tk.updated);
				const createdAt = insertedAt;
				const sticky = tk.top ? 1 : null;

				return {
					user_id: 1,
					objectId: idSeq++,
					nick: tk.nick || "访客",
					mail: tk.mail || "",
					link: tk.link || "",
					ua: tk.ua || "",
					ip: tk.ip || "",
					url,
					comment,
					pid,
					rid,
					sticky,
					status,
					like: null,
					insertedAt,
					createdAt,
					updatedAt,
				};
			});

			walineJson = {
				type: "waline",
				version: 1,
				time: Date.now(),
				tables: ["Comment", "Counter", "Users"],
				data: {
					Comment: commentArr,
					Counter: [],
					Users: [],
				},
			};

			if (outputEl) outputEl.value = JSON.stringify(walineJson, null, 2);
			if (downloadBtn) downloadBtn.disabled = false;
			setMsg(
				`转换成功，共 ${commentArr.length} 条评论，已自动给所有 URL 末尾补斜杠`,
				"success"
			);
		} catch (err: any) {
			if (outputEl) outputEl.value = "";
			walineJson = null;
			if (downloadBtn) downloadBtn.disabled = true;
			setMsg("转换失败：" + err, "error");
		}
	}

	function handleDownload() {
		if (!walineJson) {
			setMsg("请先执行转换！", "error");
			return;
		}
		const jsonStr = JSON.stringify(walineJson, null, 2);
		const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "waline-import.json";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		setMsg("文件下载完成", "success");
	}
</script>

<div class="twikoo-converter">
	<div class="converter-box">
		<h3 class="converter-title">
			<span class="converter-title-icon">📥</span>
			输入 Twikoo 数据
		</h3>
		<p class="converter-desc">
			粘贴 Twikoo 完整导出 JSON 数组，或上传本地 JSON 文件
		</p>
		<textarea
			bind:this={inputEl}
			class="converter-textarea"
			placeholder="粘贴 Twikoo 完整导出 JSON 数组..."
		></textarea>

		<div class="converter-url-fix">
			<span class="url-fix-label">批量替换 URL 前缀：</span>
			<input
				bind:this={oldUrlInput}
				class="url-input"
				placeholder="原路径前缀，如 /post/"
			/>
			<span class="url-arrow">→</span>
			<input
				bind:this={newUrlInput}
				class="url-input"
				placeholder="新路径前缀，如 /archives/"
			/>
			<button
				bind:this={fixUrlBtn}
				class="btn btn-warning"
				onclick={handleFixUrl}
			>
				🔄 替换全部 URL
			</button>
		</div>

		<div class="converter-btns">
			<button
				bind:this={uploadBtn}
				class="btn btn-primary"
				onclick={handleUpload}
			>
				📤 上传本地 JSON
			</button>
			<button
				bind:this={convertBtn}
				class="btn btn-success"
				onclick={handleConvert}
			>
				▶️ 开始转换
			</button>
			<button
				bind:this={downloadBtn}
				class="btn btn-purple"
				disabled={!walineJson}
				onclick={handleDownload}
			>
				💾 下载 waline-import.json
			</button>
			<button
				bind:this={clearBtn}
				class="btn btn-danger"
				onclick={handleClear}
			>
				🗑️ 清空全部
			</button>
		</div>
		<p bind:this={msgEl} class="converter-tip"></p>
	</div>

	<div class="converter-box">
		<h3 class="converter-title">
			<span class="converter-title-icon">📤</span>
			转换结果预览
		</h3>
		<p class="converter-desc">
			转换后的标准 Waline 导入格式（自动补全 URL 尾斜杠）
		</p>
		<textarea
			bind:this={outputEl}
			class="converter-textarea"
			readonly
			placeholder="转换后的 Waline JSON 将显示在这里..."
		></textarea>
	</div>

	<input
		bind:this={fileInput}
		type="file"
		accept=".json"
		onchange={handleFileChange}
		style="display:none"
	/>
</div>

<style>
	.twikoo-converter {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin: 1.5rem 0;
	}

	.converter-box {
		background: var(--card-bg);
		border: 1px solid var(--line-divider);
		border-radius: var(--radius-medium);
		padding: 1.25rem;
		transition: border-color 0.2s;
	}

	.converter-box:hover {
		border-color: var(--primary) / 30;
	}

	.converter-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--deep-text);
		margin: 0 0 0.5rem 0;
	}

	.converter-title-icon {
		font-size: 1.15rem;
	}

	.converter-desc {
		color: var(--content-meta);
		font-size: 0.85rem;
		margin: 0 0 1rem 0;
		line-height: 1.6;
	}

	.converter-textarea {
		width: 100%;
		min-height: 180px;
		padding: 0.75rem 0.875rem;
		border: 1px solid var(--line-divider);
		border-radius: var(--radius-small);
		font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
		font-size: 0.8rem;
		line-height: 1.6;
		resize: vertical;
		background: var(--bg-color);
		color: var(--deep-text);
		transition: border-color 0.2s;
		box-sizing: border-box;
	}

	.converter-textarea:focus {
		outline: none;
		border-color: var(--primary);
	}

	.converter-textarea::placeholder {
		color: var(--content-meta);
	}

	.converter-url-fix {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin: 0.875rem 0;
		flex-wrap: wrap;
	}

	.url-fix-label {
		color: var(--content-meta);
		font-size: 0.85rem;
		white-space: nowrap;
	}

	.url-input {
		flex: 1;
		min-width: 100px;
		padding: 0.45rem 0.65rem;
		border: 1px solid var(--line-divider);
		border-radius: var(--radius-small);
		font-size: 0.85rem;
		background: var(--bg-color);
		color: var(--deep-text);
		transition: border-color 0.2s;
		box-sizing: border-box;
	}

	.url-input:focus {
		outline: none;
		border-color: var(--primary);
	}

	.url-arrow {
		color: var(--content-meta);
		font-size: 0.9rem;
		flex-shrink: 0;
	}

	.converter-btns {
		display: flex;
		gap: 0.6rem;
		margin: 0.875rem 0;
		flex-wrap: wrap;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: var(--radius-small);
		cursor: pointer;
		font-size: 0.85rem;
		font-weight: 500;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background: var(--primary);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		filter: brightness(1.08);
		transform: translateY(-1px);
	}

	.btn-success {
		background: #10b981;
		color: white;
	}

	.btn-success:hover:not(:disabled) {
		filter: brightness(1.08);
		transform: translateY(-1px);
	}

	.btn-purple {
		background: #8b5cf6;
		color: white;
	}

	.btn-purple:hover:not(:disabled) {
		filter: brightness(1.08);
		transform: translateY(-1px);
	}

	.btn-danger {
		background: #ef4444;
		color: white;
	}

	.btn-danger:hover:not(:disabled) {
		filter: brightness(1.08);
		transform: translateY(-1px);
	}

	.btn-warning {
		background: #f59e0b;
		color: white;
	}

	.btn-warning:hover:not(:disabled) {
		filter: brightness(1.08);
		transform: translateY(-1px);
	}

	.converter-tip {
		margin: 0.5rem 0 0 0;
		font-size: 0.8rem;
		color: var(--content-meta);
	}

	.converter-tip.success {
		color: #059669;
		font-weight: 500;
	}

	.converter-tip.error {
		color: #dc2626;
		font-weight: 500;
	}

	@media (max-width: 640px) {
		.converter-box {
			padding: 1rem;
		}

		.converter-btns {
			gap: 0.5rem;
		}

		.btn {
			padding: 0.45rem 0.75rem;
			font-size: 0.8rem;
		}

		.converter-url-fix {
			flex-direction: column;
			align-items: stretch;
		}

		.url-arrow {
			display: none;
		}
	}
</style>
