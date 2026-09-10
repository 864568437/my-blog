<img src="./_backup/original-docs/docs/images/1131.png" width = "350" height = "500" alt="Firefly" align=right />

<div align="center">

# Fqzlr 的博客
> 基于 Firefly 主题的个人博客网站，构建于 Astro 框架之上
>
> ![Node.js >= 22](https://img.shields.io/badge/node.js-%3E%3D22-brightgreen)
![pnpm >= 9](https://img.shields.io/badge/pnpm-%3E%3D9-blue)
![Astro](https://img.shields.io/badge/Astro-7.1.6-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)
>
> ![GitHub License](https://img.shields.io/github/license/fqzlr/fqzlr-bk)

</div>


---
📖 README：
**[简体中文](README.md)** | **[English](_backup/README.en.md)**

🚀 在线站点：
[**🌐 Fqzlr的博客**](https://blog.fqzlr.top/)

>[!TIP]
>
>这是 Fqzlr 的个人技术博客，基于 Firefly 主题模板二次开发。专注 NAS 分享、AI 实践、学习笔记与技术总结，以及个人成长分享。

## ✨ 功能特性

### 核心功能

- [x] **Astro 7 + Tailwind CSS 4** - 基于现代技术栈的超快静态站点生成
- [x] **流畅动画** - Swup 页面过渡动画 + GSAP 滚动动效，提供丝滑的浏览体验
- [x] **响应式设计** - 完美适配桌面端、平板和移动设备
- [x] **多语言支持** - i18n 国际化，支持简体中文和英文
- [x] **全文搜索** - 基于 Pagefind 的客户端搜索，支持文章内容索引
- [x] **在线编辑** - 基于 GitHub App 的浏览器端在线编辑（文章、说说、相册、友链、页面配置等），无需本地环境即可发布内容
- [x] **PagesCMS 可视化编辑** - 通过 `.pages.yml` 配置的内容管理工作台

### 个性化

- [x] **动态侧边栏** - 支持单侧边栏 / 双侧边栏，组件自由编排（Profile、站点统计、日历、音乐、hitokoto、最近更新等）
- [x] **文章布局** - 支持配置(单列)列表、网格(多列/瀑布流)布局
- [x] **亮暗色模式** - 支持亮色/暗色/跟随系统三种模式
- [x] **壁纸模式切换** - 横幅壁纸、全屏透明壁纸、纯色背景
- [x] **主题色自定义** - 360° 色相调节
- [x] **字体管理 / 页脚配置 / 导航栏自定义** - 全面可配置

### 页面与组件

- [x] **首页** - 动态门户、最新文章、说说、站点统计
- [x] **博客文章** - 分类、标签、归档、搜索
- [x] **说说 / 动态** - 微信朋友圈风格的短内容发布（`/moments/`、`/dynamic/`），置顶说说独立页 `/moments/pinned/`
- [x] **友情链接** - 双视图切换（截图视图 / 简洁视图）、鼠标悬浮主页截图预览、失效友链分区与墓碑、GitHub Issue 申请
- [x] **神奇按钮 · 友链漫游舱** - Three.js 全屏 3D 隧道，隧道墙壁展示各友链主页截图，长按 1.2 秒随机跳转
- [x] **留言板** - 支持弹幕效果的留言页面（`/guestbook/`）
- [x] **朋友圈 RSS（pengyou）** - 聚合好友站点 RSS 动态
- [x] **番组计划** - 展示动漫、游戏、书籍和音乐收藏（`/bangumi/`）
- [x] **相册** - 图片相册展示，支持标签分类（PhotoSwipe 预览）
- [x] **项目导航 / 网址导航** - 实用导航页面
- [x] **时间线 / 日历 / 足迹 / 日常规划 / 笔记本** - 生活记录类页面
- [x] **音乐播放器** - Material Design 3 设计风格的音乐播放器
- [x] **看板娘** - 支持 Spine 和 Live2D 两种动画引擎
- [x] **赞助页面 / 公告栏 / 樱花特效 / 分享海报**

### 评论与统计

- [x] **Waline 评论系统** - 自托管后端（waline.fqzlr.com），支持表情、图片上传（图床接入）、OAuth 登录
- [x] **评论角色徽章** - 自动识别「推荐友链」（金色徽章 + 星光特效）与「本站主理人」（紫色徽章 + 极光特效）
- [x] **Umami 访问统计** - 自托管（umami.fqzlr.com），通过公开分享链接在前端读取全站访问量，无需暴露 API Key
- [x] **友链自动巡检** - GitHub Actions 每日定时检测友链可达性与响应延迟，结果驱动卡片状态徽章与主页截图

### 内容增强

- [x] **图片灯箱** - Fancyapps / PhotoSwipe 图片预览
- [x] **浮动目录 / 侧边栏目录** - 动态显示文章目录，支持锚点跳转
- [x] **增强代码块** - 基于 Expressive Code，支持语言徽标、代码折叠、行号、复制按钮
- [x] **数学公式支持** - KaTeX 渲染引擎（含 mhchem 化学扩展）
- [x] **Mermaid 图表** - 流程图 / 时序图直接写在 Markdown 中
- [x] **Wiki Links** - `[[文章标题]]` 站内文章互链
- [x] **GitHub 卡片** - 文章内嵌入 GitHub 仓库卡片
- [x] **提醒块** - GitHub 风格 `> [!TIP]` 等 Callout 语法
- [x] **文章随机封面图** - 支持通过 API 获取随机封面
- [x] **邮箱保护 / 外链自动标记 / 阅读时长统计**

### SEO 与订阅

- [x] **SEO 优化** - 完整的 meta 标签和结构化数据
- [x] **RSS 订阅** - 自动生成 RSS Feed（`/rss.xml`）
- [x] **站点地图** - 自动生成 XML Sitemap，支持按页面开关过滤

## 🛠 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Astro 7.1.6（Islands 架构） |
| UI 组件 | Svelte 5（编辑器、控制面板等交互组件） |
| 样式 | Tailwind CSS 4 + CSS 变量主题系统 |
| 页面过渡 | Swup（@swup/astro） |
| 动画 | GSAP + ScrollTrigger、@vfx-js/core |
| 3D | Three.js（友链漫游舱隧道） |
| 评论 | Waline 3.x（自托管） |
| 统计 | Umami（自托管，分享链接前端读取） |
| 搜索 | Pagefind（构建后静态索引） |
| 代码高亮 | Expressive Code（语言徽标 / 折叠 / 行号插件） |
| 数学公式 | KaTeX + mhchem |
| 图标 | Iconify（material-symbols / fa7 / mdi / simple-icons） |
| 图片 | Sharp（构建优化）、PhotoSwipe / Fancybox |
| 代码质量 | Biome（格式化 + Lint）、TypeScript |
| 部署 | Vercel（Edge Function 作 GitHub API 代理） |

## 📁 项目结构

```
fqzlr-bk/
├── .pages.yml                # PagesCMS 可视化内容管理配置
├── .github/workflows/        # GitHub Actions
│   ├── ci.yml                # CI：astro check + Biome lint
│   ├── cron-check.yml        # 每日 08:00 友链可达性巡检（Playwright）
│   └── friend-link-checker.yml # 友链截图抓取与结果发布
├── api/
│   └── github.js             # Vercel Edge Function：GitHub API 代理
├── public/                   # 静态资源（不经过构建优化）
│   ├── assets/               # 图片、JS 等资源
│   ├── favicon/              # 网站图标
│   ├── gallery/              # 相册图片
│   └── pio/                  # 看板娘模型
├── scripts/                  # 构建/工具脚本
│   ├── fetch-media/          # 媒体资源抓取脚本
│   ├── fetch-music/          # 音乐下载脚本
│   ├── generate-icons/       # 图标生成脚本（build 前置步骤）
│   ├── new-post/             # 新建文章脚本
│   ├── sync/                 # 笔记同步脚本（Obsidian 集成）
│   └── ensure-git-history.mjs # Vercel 构建前补全 git 历史
├── src/
│   ├── assets/               # 资源文件（会被构建优化）
│   ├── components/           # Astro/Svelte 组件
│   │   ├── comment/          # 评论组件（Waline 封装、角色徽章）
│   │   ├── common/           # 通用组件
│   │   ├── controls/         # 控制组件（显示设置、搜索、留言板快捷窗口等）
│   │   ├── edit/             # 在线编辑器（Svelte：WriteEditor、FriendsEditor 等）
│   │   ├── features/         # 特色功能组件（友链卡片、神奇按钮、漫游舱、音乐播放器等）
│   │   ├── guestbook/        # 留言板组件
│   │   ├── layout/           # 布局组件（SideBar、NavBar 等）
│   │   ├── life/             # 生活相关组件
│   │   ├── moments/          # 说说组件
│   │   ├── pages/            # 页面专用组件（dynamic/gallery/anime/bangumi/music）
│   │   └── widget/           # 侧边栏组件（统计、日历、访问量等）
│   ├── config/               # 配置文件（核心！40+ 个模块，见下方配置说明）
│   ├── constants/            # 常量定义
│   ├── content/              # 内容集合（Markdown/MDX 文件）
│   │   ├── posts/            # 博客文章（按分类目录组织）
│   │   ├── dynamic/          # 动态内容
│   │   ├── bangumi/          # 番组计划
│   │   ├── life/             # 生活记录（notebooks 笔记本等）
│   │   ├── routines/         # 日常规划
│   │   ├── spec/             # 特殊页面内容（friends.md 等）
│   │   ├── ziyuan/           # 资源（公告、名言等）
│   │   └── danmu/            # 弹幕
│   ├── content.config.ts     # 内容集合 schema 定义
│   ├── i18n/                 # 国际化语言包
│   ├── layouts/              # 页面布局（MainGridLayout 等）
│   ├── pages/                # 页面路由（见下方页面清单）
│   ├── plugins/              # 自定义 remark/rehype 插件
│   ├── scripts/              # 客户端特效脚本（漫游舱、星光/极光流动）
│   ├── styles/               # 全局样式（features/、vendor/ 子目录）
│   ├── types/                # TypeScript 类型定义
│   ├── utils/                # 工具函数（editMode、url-utils、content-utils 等）
│   └── workers/              # GitHub 代理核心逻辑（github-proxy.js）
├── astro.config.mjs          # Astro 配置（集成 + Markdown 插件链）
├── vercel.json               # Vercel 部署配置（安全响应头 + 缓存策略）
├── package.json              # 项目依赖与脚本
└── README.md                 # 项目说明
```

## 🗺 页面清单

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 动态门户、最新文章、说说预览、站点统计 |
| `/posts/`、`/posts/<slug>/` | 文章列表 / 详情 | 支持密码文章、置顶、系列 |
| `/archive/` | 归档 | 按年份归档 |
| `/categories/`、`/categories/<category>/` | 分类 | 分类页内含该分类下的标签云，支持 `categoryLinks.ts` 自定义 |
| `/search/` | 搜索 | Pagefind 全文搜索 |
| `/friends/` | 友情链接 | 双视图切换、悬浮截图、神奇按钮漫游舱、失效分区/墓碑 |
| `/moments/`、`/moments/pinned/` | 说说 / 置顶说说 | 朋友圈风格短内容 |
| `/dynamic/` | 动态 | 说说 + 文章聚合时间线 |
| `/pengyou/` | 朋友圈 | 好友站点 RSS 聚合（`pengyouConfig.ts` 管理订阅源） |
| `/guestbook/` | 留言板 | 弹幕效果 |
| `/gallery/`、`/gallery/<album>/` | 相册 | 标签分类、EXIF 信息 |
| `/bangumi/`、`/bangumi/<id>/` | 番组计划 | 动漫/游戏/书籍/音乐收藏 |
| `/projects/` | 项目导航 | 项目卡片展示 |
| `/timeline/` | 时间线 | 站点更新历程（关联 git commit） |
| `/calendar/` | 日历 | 独立布局，当月发布记录 |
| `/music/` | 音乐页 | 播放器与歌单 |
| `/life/notebooks/`、`/life/places/`、`/life/routines/` | 笔记本 / 足迹 / 日常 | 生活记录 |
| `/sponsor/`、`/about/`、`/anime/`、`/rss.xml` | 赞助 / 关于 / 动画 / RSS | 辅助页面 |
| `/write/` | 在线写作 | GitHub App 在线编辑器入口 |

## ⚙️ 配置说明

所有配置文件位于 `src/config/`，通过 `src/config/index.ts` 统一导出：

| 配置文件 | 说明 |
|---------|------|
| `siteConfig.ts` | 站点基础配置（标题、URL、主题色、`pages.*` 页面开关、文章布局等） |
| `profileConfig.ts` | 用户资料（头像、名字、签名、社交链接） |
| `navBarConfig.ts` | 导航栏配置（菜单项、Logo、搜索） |
| `sidebarConfig.ts` | 侧边栏布局配置（左右侧栏组件编排，仅按 `enable` 过滤） |
| `friendsConfig.ts` | 友链数据 + 页面配置（本站信息、申请说明、失效分区阈值、`recommended` 推荐标记、`siteshot` 主页截图） |
| `momentsConfig.ts` / `dynamicConfig.ts` | 说说 / 动态配置 |
| `pengyouConfig.ts` | 朋友圈 RSS 订阅源列表 |
| `commentConfig.ts` | 评论系统（Waline serverURL、表情、登录模式、图床上传） |
| `editConfig.ts` | 在线编辑（GitHub 仓库 owner/repo 从环境变量读取） |
| `galleryConfig.ts` / `bangumiConfig.ts` / `projectsConfig.ts` / `daohangConfig.ts` | 相册 / 番剧 / 项目 / 导航数据 |
| `musicConfig.ts` / `pioConfig.ts` / `sakuraConfig.ts` | 音乐 / 看板娘 / 樱花特效 |
| `calendarConfig.ts` / `footerConfig.ts` / `fontConfig.ts` / `backgroundWallpaper.ts` | 日历 / 页脚 / 字体 / 壁纸 |
| `sponsorConfig.ts` / `announcementConfig.ts` / `adConfig.ts` | 赞助 / 公告 / 广告 |
| `coverImageConfig.ts` / `expressiveCodeConfig.ts` / `licenseConfig.ts` | 封面图 / 代码块主题 / 版权协议 |
| `aiSearchConfig.ts` / `circleConfig.ts` / `skillsConfig.ts` 等 | 其他功能开关 |

### 环境变量

本地开发在项目根目录创建 `.env`（已被 git 忽略）；生产环境在 Cloudflare Workers → Settings → Variables（运行时）及构建配置的 Build Variables（构建时）配置：

| 变量 | 用途 | 必需 |
|------|------|------|
| `PUBLIC_GITHUB_OWNER` | 在线编辑目标仓库 owner | 在线编辑必需 |
| `PUBLIC_GITHUB_REPO` | 在线编辑目标仓库 repo | 在线编辑必需 |
| `PUBLIC_GITHUB_APP_ID` | GitHub App ID（浏览器端 JWT 签名） | 在线编辑必需 |
| `GH_PRIVATE_KEY` | GitHub App 私钥（服务端代理签名，可选） | 可选 |
| `PUBLIC_IMG_UPLOAD_TOKEN` | 评论图床上传 Token（tu.fqzlr.com） | 可选 |

> GitHub 仓库配置必须通过环境变量设置，代码中无硬编码默认值。

## ✏️ 内容编辑方式

### 方式一：直接编辑文件

在 `src/content/` 对应目录下创建/编辑 Markdown 文件；页面配置类数据在 `src/config/` 对应文件中维护。

### 方式二：在线编辑（GitHub App）

站点内置浏览器端编辑器，通过 `/api/github` Edge 代理直接读写仓库文件：

1. 打开对应页面（文章、友链、说说、相册、番剧、导航等均有编辑入口）
2. 在侧边栏进入编辑模式，导入 GitHub App 私钥（`.pem`）并填写 App ID
3. 私钥仅保存在浏览器本地，编辑内容以草稿 → 提交 PR/直推的方式写回仓库

支持在线编辑的内容：博客文章、说说动态、友情链接、相册、笔记本、日常规划、足迹、赞助、网址导航、番组计划、页面配置。

### 方式三：PagesCMS

`.pages.yml` 配置了 PagesCMS 工作台与媒体库（文章配图、站点资源、头图等），适合非技术场景的可视化编辑。

### 方式四：命令行创建文章

```bash
pnpm new-post 文章标题
```

## 🧞 常用命令

下列指令均需要在项目根目录执行：

| Command | 说明 |
|:--------|:-----|
| `pnpm install` | 安装依赖 |
| `pnpm dev` | 在 `localhost:4321` 启动本地开发服务器 |
| `pnpm build` | 生成图标 → 构建网站至 `./dist/` → 生成 Pagefind 搜索索引 |
| `pnpm preview` | 本地预览已构建的网站 |
| `pnpm check` | Astro 类型与内容检查 |
| `pnpm type-check` | TypeScript 严格检查 |
| `pnpm format` | 使用 Biome 格式化代码 |
| `pnpm lint` | 使用 Biome 检查并修复代码规范 |
| `pnpm new-post <filename>` | 创建新文章 |
| `pnpm sync` | 同步笔记（Obsidian 集成） |
| `pnpm icons` | 生成图标资源 |
| `pnpm cli` | 项目内置 CLI 工具 |

## 🚀 开发与部署

### 环境要求

- Node.js ≥ 22
- pnpm ≥ 9（项目通过 `preinstall` 强制使用 pnpm）

### 本地开发

```bash
git clone https://github.com/fqzlr/fqzlr-bk.git
cd fqzlr-bk
pnpm install
pnpm dev   # http://localhost:4321
```

### Cloudflare Workers 部署（主）

站点为纯静态构建（`dist/`），`/api/github` 在线编辑代理由 Cloudflare Worker 处理（`src/workers/index.js`），认证逻辑复用 `src/workers/github-proxy.js`。

**一次性配置：**

1. Cloudflare Dashboard → Workers & Pages → Create → 导入本仓库（或本地 `wrangler login` 后执行 `pnpm deploy`）
2. 构建配置（连接仓库时）：
   - 构建命令：`node scripts/ensure-git-history.mjs && pnpm build`（保留完整 git 历史供时间线页面使用）
   - 部署命令：`npx wrangler deploy`
3. Build Variables（构建时注入客户端 bundle，三个 `PUBLIC_*` 变量都要配）
4. 运行时变量（`wrangler.jsonc` 的 `vars` 或控制台）：`PUBLIC_GITHUB_APP_ID`
5. 运行时机密：`wrangler secret put GH_PRIVATE_KEY < 私钥.pem`，配置后浏览器端无需导入 `.pem`（服务端代理认证）

`public/_headers` 已配置安全响应头与 `/_astro/*` 一年强缓存（等价原 `vercel.json`）。

**本地验证：**

```bash
cp .dev.vars.example .dev.vars   # 填入 App ID 等
pnpm cf:preview                  # 构建产物 + Worker 本地运行（默认 :8787）
```

### Vercel 部署（备）

仓库保留 `vercel.json` 与 `api/github.js`（Edge Function 代理），仍可按原方式部署，与 Cloudflare 配置互不影响。

### GitHub Actions

| Workflow | 触发 | 作用 |
|----------|------|------|
| `ci.yml` | PR / push | `astro check` + Biome lint |
| `cron-check.yml` | 每日 08:00 | Playwright 巡检全部友链可达性与延迟，发布 `result.json` 至 check.fqzlr.com |
| `friend-link-checker.yml` | Issue 触发 | 处理友链申请 Issue |

## 🔧 维护指南

### 添加 / 管理友链

编辑 `src/config/friendsConfig.ts` 的 `friendsConfig` 数组：

```typescript
{
  title: "站点名称",
  imgurl: "头像 URL",
  desc: "一句话描述",
  siteurl: "https://example.com/",
  linkpage: "https://example.com/friends/", // 反链检测目标页
  tags: ["Blog"],
  weight: 10,
  enabled: true,        // false 则不在页面展示
  recommended: true,    // 推荐友链：卡片星光特效 + 评论「推荐友链」金色徽章
  siteshot: "https://example.com/index.png", // 可选：主页截图（缺省由巡检任务自动注入）
}
```

- 卡片上的延迟/状态徽章与主页截图由 `check.fqzlr.com/result.json` 在运行时注入（`Layout.astro` 的 `renderLinkStatus()`），无需手动维护
- 失效友链按 `failZones` 配置自动进入「失效暂留」或「友链墓碑」分区
- 神奇按钮（友链漫游舱）的隧道墙壁同样使用上述主页截图，打开时自动同步

### 评论角色徽章

`src/components/features/WalineRoleBadge.astro` 在运行时识别评论者身份：

- **本站主理人**（紫色极光）：URL 匹配 `site_url`、昵称在 `ownerNicknames` 列表（含「Fqzlr」「🍅番茄」等）
- **推荐友链**（金色星光）：昵称/站点匹配 `friendsConfig.ts` 中 `recommended: true` 的友链

修改昵称或新增推荐友链后徽章自动生效，无需改动本组件。

### 访问统计

- 全站访问量（侧边栏「访问统计」「小破站访问量」）来自 **Umami** 分享接口：`https://umami.fqzlr.com/share/<shareId>`，前端两步请求（取 share token → 查 stats），不暴露 API Key
- 更换 Umami 站点时，同步修改 `astro.config.mjs` 的 `oddmisc({ umami: { shareUrl } })`、`SiteVisitCounter.astro` 与 `PortalStats.astro` 中的 `UMAMI_SHARE` 常量
- 文章页浏览量仍由 Waline `visitorCount` 提供

### 非博客内容

工具类、实验性代码与样式文件放在 `.trae/` 目录，避免污染站点源码；旧版文档与备份在 `_backup/`。

## 🙏 致谢

本博客基于以下开源项目二次开发：

- [Firefly](https://github.com/CuteLeaf/Firefly) - 博客主题模板
- [Astro](https://astro.build) - 静态站点生成框架
- [Tailwind CSS](https://tailwindcss.com) - CSS 框架
- [Svelte](https://svelte.dev) - 组件框架
- [Iconify](https://iconify.design) - 图标库
- [Waline](https://waline.js.org/) - 评论系统
- [Umami](https://umami.is/) - 网站统计
- [Three.js](https://threejs.org/) - 友链漫游舱 3D 隧道

最初基于 [CuteLeaf/Firefly](https://github.com/CuteLeaf/Firefly)，该项目是从 [saicaca/fuwari](https://github.com/saicaca/fuwari) fork 而来。感谢所有原始贡献者的宝贵工作。

## 📝 许可协议

本项目遵循 [MIT license](https://mit-license.org/) 开源协议，详细查看 [LICENSE](./LICENSE) 文件。

**版权声明：**
- Copyright (c) 2024 [saicaca](https://github.com/saicaca) - [fuwari](https://github.com/saicaca/fuwari)
- Copyright (c) 2025 [CuteLeaf](https://github.com/CuteLeaf) - [Firefly](https://github.com/CuteLeaf/Firefly)
- Copyright (c) 2026 [Fqzlr](https://blog.fqzlr.top/) - 个人博客二次开发

根据 MIT 开源协议，你可以自由使用、修改、分发代码，但需保留上述版权声明。
