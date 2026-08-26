import { execSync } from "node:child_process";

// Vercel 默认 git clone --depth=10（浅克隆），构建期 git log 只能取到 10 条。
// 构建前先加深历史，保证时间线完整。本地开发无需此步，失败静默忽略。
try {
	execSync("git fetch --unshallow", { stdio: "inherit" });
	console.log("[ensure-git-history] 已获取完整 git 历史");
} catch (e) {
	console.warn("[ensure-git-history] 无需加深或历史已完整：", e.message);
}
