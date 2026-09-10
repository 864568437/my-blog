/**
 * 定格图后处理：capture.mjs 输出的全分辨率母版（2376x886）
 * 缩放到 1188x443 并量化为调色板 PNG，写入 public/assets/images/。
 *
 * 为什么不是直接用 1188 截帧：浏览器 CSS mask 缩放会先软化一次边缘，
 * 再被显示端二次缩放 → 发糊。全分辨率 1:1 截帧 + lanczos 一次缩放，
 * 边缘锐度比双重缩放高 ~55%（各 DPR 实测）。
 * 调色板量化（单色墨 + 抗锯齿 alpha）体积从 ~365KB 压到 ~40KB，质量无损。
 *
 * 用法：node optimize-stills.mjs（在 scripts/footer-signature 目录下）
 */
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "..", "..", "public", "assets", "images");

for (const theme of ["light", "dark"]) {
	const src = path.join(HERE, `xiaozhu-sig-${theme}-still.png`);
	const dest = path.join(OUT, `xiaozhu-sig-${theme}-still.png`);
	await sharp(src)
		.resize({ width: 1188, kernel: "lanczos3" })
		.png({ palette: true, quality: 95, effort: 10, compressionLevel: 9 })
		.toFile(dest);
	console.log(`${theme}: -> ${dest}`);
}
