import { execSync } from "node:child_process";

export interface GitCommit {
	hash: string;
	date: string;
	subject: string;
	/** 提交正文（可能为空字符串） */
	body: string;
	/** 本次提交改动的文件路径 */
	files: string[];
}

/**
 * Conventional Commits 类型识别。
 * 例：`fix(auth): ...` → "fix"；无前缀 → "other"。
 */
export function commitType(subject: string): string {
	const m = subject.match(/^([a-z]+)(\(.+?\))?!?:/);
	return m?.[1] ?? "other";
}

/**
 * 构建期读取 git 提交历史（参考 Dusklight timeline 实现）。
 * 使用 `-z` + `\x1f` 分隔，稳健解析多行正文与 `--name-only` 文件名。
 * 失败时返回空数组，由调用方渲染空态提示。
 */
export function getGitLog(limit = 300): GitCommit[] {
	try {
		const raw = execSync(
			`git log --format="%h%x1f%ad%x1f%s%x1f%b%x1f" --name-only -z --date=format:"%Y-%m-%d" -n ${limit}`,
			{ encoding: "utf-8", cwd: process.cwd() }
		);
		// token 流：提交记录(\x1f 分隔) 与文件名交替出现
		const commits: GitCommit[] = [];
		let pending: GitCommit | null = null;
		for (const token of raw.split("\0")) {
			if (!token) continue;
			if (token.includes("\x1f")) {
				if (pending) commits.push(pending);
				const fields = token.split("\x1f");
				const [hash, date, subject] = fields;
				pending = {
					hash,
					date,
					subject,
					// 剔除格式串末尾分隔符产生的空字段
					body: fields.slice(3).join("\x1f").replace(/\x1f+$/, "").trim(),
					files: [],
				};
			} else {
				const file = token.trim().replace(/^"|"$/g, "");
				if (file) pending?.files.push(file);
			}
		}
		if (pending) commits.push(pending);
		return commits;
	} catch {
		return [];
	}
}

/** 最近 N 天内的提交（供首页"最近日志"统计） */
export function getRecentCommits(days: number): GitCommit[] {
	const cutoff = new Date(Date.now() - days * 86400000);
	return getGitLog().filter((c) => new Date(c.date) >= cutoff);
}
