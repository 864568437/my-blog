/**
 * KV 种子导入脚本 —— 把冻结的 TS 配置写入 Cloudflare KV
 * --------------------------------------------------------------
 * 用法：
 *   npx tsx scripts/seed-kv.mjs           # 写入远程 KV（需 wrangler login）
 *   npx tsx scripts/seed-kv.mjs --local   # 写入本地 wrangler dev 的 KV 模拟
 *
 * 只在首次迁移 / 需要重置基线时运行。此后 KV 是唯一活跃数据源
 * （在线编辑直接写 KV），TS 配置文件冻结不再更新。
 */

import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SEED_DIR = resolve(ROOT, "scripts/.seed");
const local = process.argv.includes("--local");

// 读取 wrangler.jsonc 中的 namespace id（jsonc 有注释，简单提取）
import { readFileSync } from "node:fs";
const wranglerText = readFileSync(resolve(ROOT, "wrangler.jsonc"), "utf-8");
const idMatch = wranglerText.match(/"binding":\s*"BLOG_KV",\s*"id":\s*"([^"]+)"/);
const namespaceId = idMatch?.[1];
if (!namespaceId || namespaceId === "PLACEHOLDER_CREATE_KV_NAMESPACE") {
	console.error(
		"❌ wrangler.jsonc 里 BLOG_KV 的 id 还是占位符。\n" +
			"   先运行: npx wrangler kv namespace create BLOG_KV\n" +
			"   再把输出的 id 填进 wrangler.jsonc",
	);
	process.exit(1);
}

// 直接 import TS 配置（tsx 原生支持，无需正则解析）
const { friendsConfig } = await import("../src/config/friendsConfig.ts");
const { notebookFolders, notebookNotes } = await import(
	"../src/config/notebooksConfig.ts"
);
const { routinesConfig } = await import("../src/config/routinesConfig.ts");

const seeds = {
	"data:friends": {
		items: friendsConfig,
		updatedAt: new Date().toISOString(),
		updatedBy: "seed-script",
	},
	"data:notebooks": {
		folders: notebookFolders,
		notes: notebookNotes,
		updatedAt: new Date().toISOString(),
		updatedBy: "seed-script",
	},
	"data:routines": {
		items: routinesConfig,
		updatedAt: new Date().toISOString(),
		updatedBy: "seed-script",
	},
};

mkdirSync(SEED_DIR, { recursive: true });
const flag = local ? "--local" : "--remote";

for (const [key, value] of Object.entries(seeds)) {
	const file = resolve(SEED_DIR, `${key.replace(":", "-")}.json`);
	writeFileSync(file, JSON.stringify(value, null, 2));
	const fileName = key.replace(":", "-");
	console.log(`写入 ${key}（${value.items?.length ?? value.folders.length} 项）...`);
	execSync(
		`npx wrangler kv key put "${key}" --${local ? "local" : "remote"} --path "scripts/.seed/${fileName}.json" --namespace-id ${namespaceId}`,
		{ cwd: ROOT, stdio: "inherit" },
	);
}

rmSync(SEED_DIR, { recursive: true, force: true });
console.log(`\n✅ 种子写入完成（${local ? "本地" : "远程"} KV）`);
