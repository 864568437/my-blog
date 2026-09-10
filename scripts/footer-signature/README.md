# Footer 签名资产生成

`public/assets/images/xiaozhu-sig-*` 的手写签名视频/定格图由此目录的工具生成。
签名内容来自 `public/assets/images/yishuzi.png`（白色艺术字，透明底），
在 `sig-gen.html` 中作为 CSS mask 使用，墨色由背景色承担，
按从左到右的软边渐变揭示生成"书写"动画。
要改签名图案直接替换 yishuzi.png，要改揭示节奏改 `sig-gen.html` 的时间轴常量。

1. 编辑 `sig-gen.html`：改揭示时间轴（`DELAY` / `DURATION` / `HOLD`）、软边宽度、`?ink` 墨色。
   （画布为 yishuzi.png 原生尺寸 2376x886，1:1 无缩放，`capture.mjs` 的 `VIEWPORT` 需同步。）
2. 截帧（需要项目的 playwright + 本机 Chrome）：
   ```
   NODE_PATH=<项目node_modules绝对路径> node capture.mjs
   ```
   输出全分辨率母版：`frames-light|dark/`（2376x886 帧序列）与 `xiaozhu-sig-*-still.png`。
3. 编码（需要 ffmpeg；alpha webm 的两个关键参数缺一不可）：
   ```
   encode.bat <ffmpeg.exe路径>
   ```
   视频从全分辨率帧序列编码（显示端单次缩放），定格图由 `optimize-stills.mjs`
   做 lanczos 缩放到 1188x443 + 调色板量化（~40KB）后写入 public。

要点：
- **不要把画布改回 1188 截帧**：浏览器 CSS mask 缩放会先软化一次边缘，
  显示端再缩一次 → 发糊。全分辨率 1:1 截帧是清晰度的关键（各 DPR 实测边缘锐度 +54~59%）。
- alpha webm 必须带 `-auto-alt-ref 0` 和 `-metadata:s:v:0 alpha_mode=1`，
  否则 Chrome 中透明通道丢失（部分 ffmpeg 构建读不回自己编码的 alpha，
  以 Chrome 实际播放为准验证）。
- mov 用 qtrle 编码（QuickTime Animation，带 alpha），作为 Safari 的兜底源。
- 定格图必须与视频末帧完全一致（renderAt(999) 与最后一帧同状态）。
