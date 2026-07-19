export const TWIKOO_TO_WALINE_HTML_CODE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Twikoo ↔ Waline 评论数据双向转换工具</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f6fa; color: #2c3e50; min-height: 100vh; }
.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 24px 32px; }
.header h1 { font-size: 22px; font-weight: 600; }
.header p { font-size: 13px; opacity: 0.85; margin-top: 4px; }
.container { max-width: 1100px; margin: 0 auto; padding: 24px; }
.card { background: #fff; border-radius: 10px; padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.step-label { display: inline-block; background: #667eea; color: #fff; font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 10px; margin-right: 8px; }
.card h3 { font-size: 16px; margin-bottom: 16px; display: flex; align-items: center; }
.mode-switch { display: flex; gap: 0; margin-bottom: 20px; border-radius: 8px; overflow: hidden; border: 2px solid #667eea; }
.mode-btn { flex: 1; padding: 10px 16px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; background: #fff; color: #667eea; transition: all 0.2s; }
.mode-btn.active { background: #667eea; color: #fff; }
.mode-btn:hover:not(.active) { background: #f0f2ff; }
.drop-zone { border: 2px dashed #d0d5dd; border-radius: 8px; padding: 40px; text-align: center; cursor: pointer; transition: all 0.2s; margin-bottom: 8px; }
.drop-zone:hover, .drop-zone.dragover { border-color: #667eea; background: #f0f2ff; }
.drop-zone p { color: #888; font-size: 14px; }
.drop-zone p strong { color: #667eea; }
.file-hint { font-size: 12px; color: #aaa; margin-top: 4px; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
.stat-box { background: #f8f9fc; border-radius: 8px; padding: 12px; text-align: center; }
.stat-box .num { font-size: 26px; font-weight: 700; color: #667eea; }
.stat-box .label { font-size: 11px; color: #888; margin-top: 3px; }
.toolbar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.btn { padding: 8px 18px; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; font-weight: 500; transition: all 0.2s; }
.btn-primary { background: #667eea; color: #fff; }
.btn-primary:hover { background: #5a6fd6; }
.btn-secondary { background: #e8eaed; color: #333; }
.btn-secondary:hover { background: #d8dbe0; }
.btn-success { background: #27ae60; color: #fff; }
.btn-success:hover { background: #219a52; }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }
.comment-list { max-height: 500px; overflow-y: auto; border: 1px solid #eee; border-radius: 8px; }
.comment-item { padding: 10px 16px; border-bottom: 1px solid #f0f0f0; display: flex; gap: 10px; align-items: flex-start; }
.comment-item:last-child { border-bottom: none; }
.comment-item .oid { background: #667eea; color: #fff; font-size: 10px; min-width: 24px; height: 20px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.comment-item .indent { color: #aaa; font-size: 12px; margin-right: 4px; }
.comment-item.level-1 { padding-left: 44px; }
.comment-item.level-2 { padding-left: 66px; }
.comment-item.level-3 { padding-left: 88px; }
.comment-info { flex: 1; min-width: 0; }
.comment-info .author { font-weight: 600; font-size: 13px; }
.comment-info .meta { font-size: 11px; color: #999; margin-top: 2px; }
.comment-info .text { font-size: 13px; margin-top: 3px; color: #444; word-break: break-all; }
.log { background: #1e1e1e; color: #d4d4d4; padding: 12px 16px; border-radius: 8px; font-family: "SF Mono", "Cascadia Code", Consolas, monospace; font-size: 12px; max-height: 200px; overflow-y: auto; white-space: pre-wrap; }
.log .ok { color: #6a9955; }
.log .warn { color: #dcdcaa; }
.log .err { color: #f44747; }
.note { font-size: 12px; color: #999; background: #fffbe6; border: 1px solid #ffe58f; border-radius: 6px; padding: 10px 14px; margin-top: 12px; line-height: 1.6; }
</style>
</head>
<body>

<div class="header">
  <h1>Twikoo ↔ Waline 评论数据双向转换工具</h1>
  <p>保留留言回复层级关系 · 支持双向互转 · 纯浏览器端运行，数据不上传</p>
</div>

<div class="container">

  <!-- 方向选择 -->
  <div class="card">
    <h3><span class="step-label">1</span> 选择转换方向</h3>
    <div class="mode-switch">
      <button class="mode-btn active" id="modeTW" onclick="setMode('tw2wl')">Twikoo → Waline</button>
      <button class="mode-btn" id="modeWT" onclick="setMode('wl2tw')">Waline → Twikoo</button>
    </div>
    <div id="modeDesc" style="font-size:13px;color:#666;">将 Twikoo 导出的 JSON 数组转换为 Waline 导入格式（含 Comment / Users / Counter 三表）</div>
  </div>

  <!-- 加载 -->
  <div class="card">
    <h3><span class="step-label">2</span> 加载源文件</h3>
    <div class="drop-zone" id="dropZone">
      <p id="dropText">拖拽 <strong>twikoo-comment.json</strong> 到此处<br>或 <strong>点击选择文件</strong></p>
      <input type="file" id="fileInput" accept=".json" style="display:none">
    </div>
    <div class="file-hint" id="fileHint">Twikoo 导出文件通常是一个 JSON 数组，Waline 导出文件是一个含 data.Comment 的对象</div>
    <div id="fileInfo" style="margin-top:8px;font-size:13px;color:#888;"></div>
  </div>

  <!-- 统计 -->
  <div class="card" id="statsCard" style="display:none">
    <h3>数据概览</h3>
    <div class="stats" id="statsGrid"></div>
  </div>

  <!-- 转换 -->
  <div class="card" id="convertCard" style="display:none">
    <h3><span class="step-label">3</span> 转换 & 预览</h3>
    <div class="toolbar">
      <button class="btn btn-primary" id="btnConvert">执行转换</button>
      <button class="btn btn-success" id="btnDownload" disabled>下载结果 JSON</button>
      <button class="btn btn-secondary" id="btnPreview" disabled>预览评论列表</button>
    </div>
    <div class="log" id="logArea" style="display:none;"></div>
    <div class="comment-list" id="previewList" style="display:none;margin-top:12px;"></div>
    <div class="note" id="noteArea" style="display:none;"></div>
  </div>

</div>

<script>
// ==================== 状态 ====================
let currentMode = 'tw2wl'; // 'tw2wl' | 'wl2tw'
let sourceData = null;
let outputData = null;
let convertLog = [];
let convertStats = null;

// ==================== UUID 生成 ====================
function generateUUID() {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// ==================== 工具函数 ====================
function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function tsToISO(ms) {
  return new Date(ms).toISOString();
}

function isoToTs(iso) {
  return new Date(iso).getTime();
}

function normalizeUrl(url) {
  if (!url) return '/';
  return url.endsWith('/') ? url : url + '/';
}

function wrapHtml(text) {
  if (!text || text.trim() === '') return '';
  return '<p>' + text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\n/g, '</p>\\n<p>') + '</p>\\n';
}

function parseIPRegion(ipRegion) {
  if (!ipRegion) return '';
  const parts = ipRegion.split('|');
  return [parts[0], parts[2], parts[3]].filter(Boolean).join(' ');
}

// ==================== 核心：Twikoo → Waline ====================
function convertTW2WL(data) {
  const comments = Array.isArray(data) ? data : (data.data || data.comments || data);
  if (!Array.isArray(comments) || comments.length === 0) {
    throw new Error('未识别到评论数组');
  }

  const log = [];
  log.push('[Twikoo → Waline] 开始转换...');
  log.push(\`源评论数: \${comments.length}\`);

  // 分配数字 objectId
  let nextId = 1;
  const idMap = {}; // twikoo _id → waline objectId
  for (const c of comments) {
    idMap[c._id] = nextId++;
  }

  // Users 按邮箱去重
  const userMap = {};
  const users = [];
  let uidCounter = 0;
  const usedEmails = new Set();

  for (const c of comments) {
    const email = (c.mail || '').trim().toLowerCase();
    if (email && !usedEmails.has(email)) {
      usedEmails.add(email);
      uidCounter++;
      userMap[email] = uidCounter;
      users.push({
        objectId: uidCounter,
        display_name: c.nick || '',
        email: email,
        password: '',
        type: c.master === 1 ? 'administrator' : 'guest',
        label: c.master === 1 ? '主理人' : null,
        url: c.link || null,
        avatar: c.avatar || null,
        github: null, twitter: null, facebook: null, google: null,
        weibo: null, qq: null, oidc: null, huawei: null, "2fa": null,
        createdAt: tsToISO(c.created),
        updatedAt: tsToISO(c.updated || c.created)
      });
    }
  }
  log.push(\`去重用户: \${users.length}\`);

  // Counter 按 url 去重
  const urlCountMap = {};
  for (const c of comments) {
    const url = normalizeUrl(c.url);
    urlCountMap[url] = (urlCountMap[url] || 0) + 1;
  }
  const counters = [];
  let cidCounter = 0;
  for (const [url, count] of Object.entries(urlCountMap)) {
    cidCounter++;
    counters.push({
      objectId: cidCounter, url, time: count,
      reaction0: null, reaction1: null, reaction2: null,
      reaction3: null, reaction4: null, reaction5: null,
      reaction6: null, reaction7: null, reaction8: null,
      createdAt: tsToISO(Date.now()),
      updatedAt: tsToISO(Date.now())
    });
  }

  // 转换 Comment
  const walineComments = [];
  let topCount = 0, replyCount = 0, orphanCount = 0;

  for (const c of comments) {
    const email = (c.mail || '').trim().toLowerCase();
    const userId = userMap[email] || 0;
    let pid = null, rid = null;

    if (c.pid && c.pid.trim() !== '') {
      pid = idMap[c.pid] || null;
      if (pid === null) { orphanCount++; log.push(\`⚠ 孤儿回复: \${c._id} → 父 \${c.pid} 不存在\`); }
    }
    if (c.rid && c.rid.trim() !== '') {
      rid = idMap[c.rid] || null;
    }
    if (pid !== null && rid === null) rid = pid;

    pid === null ? topCount++ : replyCount++;

    walineComments.push({
      objectId: idMap[c._id],
      user_id: userId,
      comment: stripHtml(c.comment || ''),
      ip: c.ip || '',
      link: c.link || null,
      mail: c.mail || '',
      nick: c.nick || '',
      pid, rid,
      sticky: c.top === 1 ? 1 : null,
      status: c.isSpam ? 'spam' : 'approved',
      like: null,
      ua: c.ua || '',
      url: normalizeUrl(c.url),
      insertedAt: tsToISO(c.created),
      createdAt: tsToISO(c.created),
      updatedAt: tsToISO(c.updated || c.created)
    });
  }

  log.push(\`顶级: \${topCount} · 回复: \${replyCount} · 孤儿: \${orphanCount}\`);

  return {
    result: {
      __version: '1.41.3', type: 'waline', version: 1, time: Date.now(),
      tables: ['Comment', 'Counter', 'Users'],
      data: { Comment: walineComments, Counter: counters, Users: users }
    },
    log, stats: { total: comments.length, top: topCount, reply: replyCount, users: users.length, urls: counters.length, orphan: orphanCount }
  };
}

// ==================== 核心：Waline → Twikoo ====================
function convertWL2TW(data) {
  const log = [];
  log.push('[Waline → Twikoo] 开始转换...');

  // 提取数据
  let walineObj = data;
  if (Array.isArray(data)) {
    // 可能是单纯的 Comment 数组
    walineObj = { data: { Comment: data, Users: [], Counter: [] } };
  }

  const wlComments = walineObj?.data?.Comment || walineObj?.Comment || walineObj?.comments || [];
  const wlUsers = walineObj?.data?.Users || walineObj?.Users || [];
  const wlCounters = walineObj?.data?.Counter || walineObj?.Counter || [];

  if (!Array.isArray(wlComments) || wlComments.length === 0) {
    throw new Error('未识别到 Waline Comment 数据');
  }

  log.push(\`源评论数: \${wlComments.length}\`);
  log.push(\`源用户数: \${wlUsers.length}\`);
  log.push(\`源计数器: \${wlCounters.length}\`);

  // 构建 user_id → 用户信息 的映射
  const userInfoMap = {};
  for (const u of wlUsers) {
    userInfoMap[u.objectId] = u;
  }

  // 分配 Twikoo 的 _id（UUID）
  const idMap = {}; // waline objectId → twikoo _id
  for (const c of wlComments) {
    idMap[c.objectId] = generateUUID();
  }
  log.push(\`生成 UUID _id: \${Object.keys(idMap).length} 个\`);

  // 构建 url → 页面信息映射（用于补充 href）
  const urlInfoMap = {};
  for (const ct of wlCounters) {
    if (ct.url) urlInfoMap[ct.url] = ct;
  }

  // 转换
  const twikooComments = [];
  let topCount = 0, replyCount = 0, orphanCount = 0;

  for (const c of wlComments) {
    const userInfo = userInfoMap[c.user_id] || {};
    const email = c.mail || userInfo.email || '';
    const nick = c.nick || userInfo.display_name || '';

    let pid = '';
    let rid = '';

    if (c.pid != null) {
      pid = idMap[c.pid] || '';
      if (pid === '') { orphanCount++; log.push(\`⚠ 孤儿回复: objectId=\${c.objectId} → 父 \${c.pid} 不存在\`); }
    }
    if (c.rid != null) {
      rid = idMap[c.rid] || '';
    }

    pid ? replyCount++ : topCount++;

    const created = typeof c.createdAt === 'number' ? c.createdAt : isoToTs(c.createdAt || c.insertedAt || new Date().toISOString());
    const updated = typeof c.updatedAt === 'number' ? c.updatedAt : isoToTs(c.updatedAt || c.createdAt || new Date().toISOString());

    // 构建 ipRegion（近似还原）
    // Waline 没有 ipRegion 字段，只能留空或尝试从其他字段推断
    const ipRegion = '';

    twikooComments.push({
      _id: idMap[c.objectId],
      uid: '',
      nick: nick,
      mail: email,
      mailMd5: '',
      link: c.link || userInfo.url || '',
      ua: c.ua || '',
      ip: c.ip || '',
      ipRegion: ipRegion,
      master: (userInfo.type === 'administrator') ? 1 : 0,
      url: c.url || '/',
      href: c.url ? ('https://fqzlr.com' + c.url + '/') : '',
      comment: wrapHtml(c.comment || ''),
      pid: pid,
      rid: rid,
      isSpam: c.status === 'spam' ? 1 : 0,
      created: created,
      updated: updated,
      like: c.like ? JSON.stringify(c.like) : '[]',
      top: c.sticky ? 1 : 0,
      avatar: userInfo.avatar || ''
    });
  }

  log.push(\`顶级: \${topCount} · 回复: \${replyCount} · 孤儿: \${orphanCount}\`);

  return {
    result: twikooComments,
    log, stats: { total: twikooComments.length, top: topCount, reply: replyCount, users: wlUsers.length, orphan: orphanCount }
  };
}

// ==================== UI ====================
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const statsCard = document.getElementById('statsCard');
const statsGrid = document.getElementById('statsGrid');
const convertCard = document.getElementById('convertCard');
const btnConvert = document.getElementById('btnConvert');
const btnDownload = document.getElementById('btnDownload');
const btnPreview = document.getElementById('btnPreview');
const logArea = document.getElementById('logArea');
const previewList = document.getElementById('previewList');
const noteArea = document.getElementById('noteArea');
const dropText = document.getElementById('dropText');
const fileHint = document.getElementById('fileHint');
const modeDesc = document.getElementById('modeDesc');

function setMode(mode) {
  currentMode = mode;
  document.getElementById('modeTW').classList.toggle('active', mode === 'tw2wl');
  document.getElementById('modeWT').classList.toggle('active', mode === 'wl2tw');

  if (mode === 'tw2wl') {
    modeDesc.textContent = '将 Twikoo 导出的 JSON 数组转换为 Waline 导入格式（含 Comment / Users / Counter 三表）';
    dropText.innerHTML = '拖拽 <strong>twikoo-comment.json</strong> 到此处<br>或 <strong>点击选择文件</strong>';
    fileHint.textContent = 'Twikoo 导出文件通常是一个 JSON 数组，每个元素是一条评论';
  } else {
    modeDesc.textContent = '将 Waline 导出的 JSON 对象转换为 Twikoo 评论数组格式（含层级关系）';
    dropText.innerHTML = '拖拽 <strong>waline-export.json</strong> 到此处<br>或 <strong>点击选择文件</strong>';
    fileHint.textContent = 'Waline 导出文件是一个含 data.Comment / data.Users / data.Counter 的 JSON 对象';
  }

  // 重置
  sourceData = null;
  outputData = null;
  convertLog = [];
  convertStats = null;
  fileInfo.textContent = '';
  statsCard.style.display = 'none';
  convertCard.style.display = 'none';
  logArea.style.display = 'none';
  previewList.style.display = 'none';
  noteArea.style.display = 'none';
  btnDownload.disabled = true;
  btnPreview.disabled = true;
}

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) loadFile(file);
});
fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) loadFile(file);
});

function loadFile(file) {
  fileInfo.textContent = \`已选择: \${file.name} (\${(file.size / 1024).toFixed(1)} KB)\`;
  const reader = new FileReader();
  reader.onload = function() {
    try {
      sourceData = JSON.parse(reader.result);

      let arr;
      if (currentMode === 'tw2wl') {
        arr = Array.isArray(sourceData) ? sourceData : (sourceData.data || sourceData.comments || []);
      } else {
        arr = sourceData?.data?.Comment || sourceData?.Comment || sourceData?.comments || [];
      }

      statsCard.style.display = 'block';
      convertCard.style.display = 'block';

      const topArr = currentMode === 'tw2wl'
        ? arr.filter(c => !c.pid || c.pid === '')
        : arr.filter(c => c.pid == null);
      const replyArr = currentMode === 'tw2wl'
        ? arr.filter(c => c.pid && c.pid !== '')
        : arr.filter(c => c.pid != null);
      const userCount = currentMode === 'tw2wl'
        ? new Set(arr.map(c => c.mail?.trim().toLowerCase()).filter(Boolean)).size
        : (sourceData?.data?.Users || sourceData?.Users || []).length || '未知';

      statsGrid.innerHTML = \`
        <div class="stat-box"><div class="num">\${arr.length}</div><div class="label">评论总数</div></div>
        <div class="stat-box"><div class="num">\${topArr.length}</div><div class="label">顶级评论</div></div>
        <div class="stat-box"><div class="num">\${replyArr.length}</div><div class="label">回复评论</div></div>
        <div class="stat-box"><div class="num">\${userCount}</div><div class="label">关联用户</div></div>
      \`;

      logArea.style.display = 'none';
      previewList.style.display = 'none';
      noteArea.style.display = 'none';
      btnDownload.disabled = true;
      btnPreview.disabled = true;
    } catch (err) {
      fileInfo.innerHTML = \`<span style="color:#e74c3c">JSON 解析失败: \${err.message}</span>\`;
    }
  };
  reader.readAsText(file);
}

btnConvert.addEventListener('click', () => {
  if (!sourceData) return alert('请先加载源 JSON 文件');
  try {
    let result;
    if (currentMode === 'tw2wl') {
      result = convertTW2WL(sourceData);
    } else {
      result = convertWL2TW(sourceData);
    }
    outputData = result.result;
    convertLog = result.log;
    convertStats = result.stats;

    logArea.style.display = 'block';
    logArea.innerHTML = convertLog.map(l => {
      if (l.startsWith('⚠')) return \`<span class="warn">\${l}</span>\`;
      if (l.startsWith('❌')) return \`<span class="err">\${l}</span>\`;
      return \`<span class="ok">\${l}</span>\`;
    }).join('\\n');

    btnDownload.disabled = false;
    btnPreview.disabled = false;
    previewList.style.display = 'none';

    // 显示注意事项
    if (currentMode === 'wl2tw') {
      noteArea.style.display = 'block';
      noteArea.innerHTML = \`
        <strong>注意：</strong>Waline 原始数据不包含 <code>uid</code>、<code>mailMd5</code>、<code>ipRegion</code>、<code>href</code> 等字段，转换后这些字段将为空或使用默认值。<br>
        建议导入 Twikoo 后手动补充站点域名等配置。
      \`;
    } else {
      noteArea.style.display = 'block';
      noteArea.innerHTML = \`
        <strong>注意：</strong>转换后的 Waline JSON 可直接通过 Waline 管理后台"导入数据"功能导入。<br>
        评论中的 HTML 标签已去除，纯文本保留。回复层级关系通过 <code>pid</code>/<code>rid</code> 数字 ID 保留。
      \`;
    }
  } catch (err) {
    alert('转换失败: ' + err.message);
  }
});

btnDownload.addEventListener('click', () => {
  if (!outputData) return;
  const filename = currentMode === 'tw2wl' ? 'waline-import.json' : 'twikoo-export.json';
  const blob = new Blob([JSON.stringify(outputData, null, '\\t')], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
});

btnPreview.addEventListener('click', () => {
  if (!outputData) return;

  let comments;
  if (currentMode === 'tw2wl') {
    comments = outputData.data.Comment;
  } else {
    comments = outputData;
  }

  previewList.style.display = 'block';

  // 构建映射 + 计算层级
  const commentMap = {};
  for (const c of comments) {
    const id = currentMode === 'tw2wl' ? c.objectId : c._id;
    commentMap[id] = c;
  }

  function getPid(c) {
    if (currentMode === 'tw2wl') return c.pid;
    return c.pid || null;
  }

  function getId(c) {
    if (currentMode === 'tw2wl') return c.objectId;
    return c._id;
  }

  function getLevel(comment) {
    let level = 0;
    let current = comment;
    const pid = getPid(current);
    if (pid && commentMap[pid]) {
      level++;
      current = commentMap[pid];
      let safety = 0;
      while (safety < 50) {
        const p = getPid(current);
        if (p && commentMap[p]) {
          level++;
          current = commentMap[p];
        } else break;
        safety++;
      }
    }
    return level;
  }

  function getNick(c) { return c.nick || '匿名'; }
  function getText(c) { const t = c.comment || ''; return t.length > 100 ? t.slice(0, 100) + '...' : (t || '(空)'); }
  function getUrl(c) { return c.url || '/'; }
  function getTime(c) {
    const t = c.createdAt || c.created || '';
    if (typeof t === 'number') return new Date(t).toISOString().slice(0, 10);
    return String(t).slice(0, 10);
  }
  function getStatus(c) { return currentMode === 'tw2wl' ? c.status : (c.isSpam ? 'spam' : 'approved'); }
  function getDisplayId(c) { return currentMode === 'tw2wl' ? c.objectId : c._id.slice(0, 8); }
  function getPidDisplay(c) {
    if (currentMode === 'tw2wl') return c.pid ? ' → 回复 #' + c.pid : '';
    return c.pid ? ' → 回复 ' + c.pid.slice(0, 8) : '';
  }

  // 保持原始顺序
  previewList.innerHTML = comments.map(c => {
    const level = getLevel(c);
    const indent = '└ '.repeat(Math.min(level, 10));
    return \`
      <div class="comment-item level-\${Math.min(level, 3)}">
        <div class="oid">\${getDisplayId(c)}</div>
        <div class="comment-info">
          <div class="author">\${indent}\${getNick(c)}\${getPidDisplay(c)}</div>
          <div class="meta">\${getUrl(c)} · \${getTime(c)} · \${getStatus(c)}</div>
          <div class="text">\${getText(c)}</div>
        </div>
      </div>
    \`;
  }).join('');
});
<\/script>
</body>
</html>
`;
