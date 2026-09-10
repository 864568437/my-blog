/**
 * Footer 签名资产生成：playwright 驱动 Chrome 对 sig-gen.html 逐帧截图，
 * 输出透明 PNG 帧序列（frames-light / frames-dark）与两张写完定格图。
 * 用法：NODE_PATH=<项目node_modules的绝对路径> node scripts/footer-signature/capture.mjs
 * 帧序列再用 encode.bat 编码为 webm / mov 资产（见 README.md）。
 *
 * 签名内容来自 public/assets/images/yishuzi.png（白色艺术字，
 * 在 sig-gen.html 中作为 CSS mask 使用），按从左到右渐变揭示生成动画。
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FPS = 30;
const DURATION = 3.2; // 与 sig-gen.html 的揭示时间轴尾部对齐
const VIEWPORT = { width: 1188, height: 443 }; // yishuzi.png 的 1/2 精确尺寸
const HERE = path.dirname(fileURLToPath(import.meta.url));

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
	viewport: VIEWPORT,
	deviceScaleFactor: 1,
});

for (const theme of ["light", "dark"]) {
	const dir = path.join(HERE, `frames-${theme}`);
	fs.mkdirSync(dir, { recursive: true });
	const htmlUrl = `file:///${path.join(HERE, "sig-gen.html").replace(/\\/g, "/")}?ink=${theme}`;
	await page.goto(htmlUrl);
	await page.waitForTimeout(200);

	const total = Math.ceil(FPS * DURATION);
	for (let i = 0; i < total; i++) {
		await page.evaluate((t) => window.renderAt(t), i / FPS);
		await page.screenshot({
			path: path.join(dir, `frame_${String(i).padStart(4, "0")}.png`),
			omitBackground: true,
		});
	}

	await page.evaluate(() => window.renderAt(999));
	await page.screenshot({
		path: path.join(HERE, `xiaozhu-sig-${theme}-still.png`),
		omitBackground: true,
	});
	console.log(`${theme}: ${total} frames + still`);
}

await browser.close();
