export const TWIKOO_TO_WALINE_HTML_CODE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>Twikoo转Waline 修复路径尾斜杠版</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;font-family:system-ui}
    body{max-width:1200px;margin:30px auto;padding:0 20px;background:#f7f8fa}
    .box{background:#fff;border-radius:12px;padding:24px;margin-bottom:20px;box-shadow:0 2px 12px #00000008}
    h1{font-size:22px;margin-bottom:10px;color:#222}
    .desc{color:#666;margin-bottom:20px;line-height:1.6}
    textarea{width:100%;min-height:240px;padding:14px;border:1px solid #ddd;border-radius:8px;font-family:monospace;font-size:13px;resize:vertical}
    .btns{margin:16px 0;display:flex;gap:12px;flex-wrap:wrap}
    .url-fix{margin:12px 0;display:flex;gap:10px;align-items:center}
    input{padding:8px 10px;border:1px solid #ddd;border-radius:6px}
    button{padding:10px 22px;border:none;border-radius:8px;cursor:pointer;font-size:14px}
    #uploadBtn{background:#3b82f6;color:#fff}
    #convertBtn{background:#10b981;color:#fff}
    #downloadBtn{background:#8b5cf6;color:#fff}
    #clearBtn{background:#ef4444;color:#fff}
    #fixUrlBtn{background:#f59e0b;color:#fff}
    button:disabled{opacity:0.5;cursor:not-allowed}
    .tip{margin-top:8px;font-size:13px;color:#888}
    .success{color:#059669;font-weight:500}
    .error{color:#dc2626}
  </style>
</head>
<body>
<div class="box">
  <h1>Twikoo → Waline 转换器（自动补路径尾斜杠）</h1>
  <p class="desc">1.粘贴Twikoo导出JSON数组 / 上传json文件<br>2.转换自动给所有url末尾加/，匹配前台带斜杠路径<br>3.页面路径变动可批量替换url前缀</p>
  <textarea id="input" placeholder="粘贴Twikoo完整导出JSON数组..."></textarea>
  <div class="url-fix">
    <span>批量替换url前缀：</span>
    <input id="oldUrl" placeholder="原路径前缀，如 /post/">
    <input id="newUrl" placeholder="新路径前缀，如 /archives/">
    <button id="fixUrlBtn">一键替换全部url</button>
  </div>
  <div class="btns">
    <button id="uploadBtn">上传本地JSON</button>
    <button id="convertBtn">开始转换</button>
    <button id="downloadBtn" disabled>下载waline-import.json</button>
    <button id="clearBtn">清空全部</button>
  </div>
  <p id="msg" class="tip"></p>
</div>

<div class="box">
  <h2>转换结果预览（自动补尾斜杠，匹配前台测试评论格式）</h2>
  <textarea id="output" readonly placeholder="转换后标准JSON"></textarea>
</div>

<input type="file" id="fileInput" accept=".json" style="display:none">

<script>
const $ = s => document.querySelector(s)
const inputEl = $('#input')
const outputEl = $('#output')
const msgEl = $('#msg')
const uploadBtn = $('#uploadBtn')
const convertBtn = $('#convertBtn')
const downloadBtn = $('#downloadBtn')
const clearBtn = $('#clearBtn')
const fixUrlBtn = $('#fixUrlBtn')
const oldUrlInput = $('#oldUrl')
const newUrlInput = $('#newUrl')
const fileInput = $('#fileInput')
let walineJson = null

// 文件上传
uploadBtn.onclick = () => fileInput.click()
fileInput.onchange = async e => {
  const f = e.target.files[0]
  if(!f) return
  inputEl.value = await f.text()
  msgEl.textContent = \`已加载文件：\${f.name}\`
  msgEl.className = 'tip success'
}

// 清空
clearBtn.onclick = () => {
  inputEl.value = outputEl.value = ''
  walineJson = null
  downloadBtn.disabled = true
  msgEl.textContent = ''
  oldUrlInput.value = newUrlInput.value = ''
}

// 标准时间格式化：保留末尾Z，完全匹配你的样本格式
function formatISO(ts) {
  if (!ts || isNaN(Number(ts))) return new Date().toISOString()
  const date = new Date(Number(ts))
  if (isNaN(date.getTime())) return new Date().toISOString()
  return date.toISOString()
}

// 自动标准化url：末尾强制加斜杠，根路径/不重复
function normalizeUrl(path) {
  let url = path?.trim() || '/'
  if (url === '/') return url
  if (!url.endsWith('/')) {
    url += '/'
  }
  return url
}

// 批量替换url路径（解决前台看不到评论）
fixUrlBtn.onclick = () => {
  if (!walineJson) {
    msgEl.textContent = '请先转换数据再替换路径'
    msgEl.className = 'tip error'
    return
  }
  const oldPre = oldUrlInput.value.trim()
  const newPre = newUrlInput.value.trim()
  if (!oldPre || !newPre) {
    msgEl.textContent = '请填写原路径和新路径前缀'
    msgEl.className = 'tip error'
    return
  }
  let count = 0
  walineJson.data.Comment.forEach(item => {
    if (item.url.includes(oldPre)) {
      item.url = item.url.replace(oldPre, newPre)
      // 替换后再次标准化补斜杠
      item.url = normalizeUrl(item.url)
      count++
    }
  })
  outputEl.value = JSON.stringify(walineJson, null, 2)
  msgEl.textContent = \`路径替换完成，共修改\${count}条评论url\`
  msgEl.className = 'tip success'
}

// 核心转换逻辑（严格对齐你提供的真实单条评论结构 + 自动补尾斜杠）
convertBtn.onclick = () => {
  try {
    const raw = inputEl.value.trim()
    if (!raw) throw '输入内容不能为空'
    const twikooList = JSON.parse(raw)
    if (!Array.isArray(twikooList)) throw 'Twikoo导出数据必须是数组格式'

    // 自增objectId，统一数字类型，和你样本一致
    let idSeq = 1
    const commentArr = twikooList.map(tk => {
      // 状态映射
      let status = 'approved'
      if (tk.isSpam === 1) status = 'spam'
      // 评论内容兜底，禁止空值
      const comment = tk.comment?.trim() || '无评论内容'
      // 空回复ID统一为null
      const pid = tk.pid || null
      const rid = tk.rid || null
      // 关键修改：调用标准化函数自动补末尾斜杠
      const url = normalizeUrl(tk.url)
      const insertedAt = formatISO(tk.created)
      const updatedAt = formatISO(tk.updated)
      const createdAt = insertedAt // 同步createdAt字段，缺失会导入丢失
      // 置顶处理：无置顶为null，匹配样本
      const sticky = tk.top ? 1 : null

      const item = {
        user_id: 1,
        objectId: idSeq++,
        nick: tk.nick || '访客',
        mail: tk.mail || '',
        link: tk.link || '',
        ua: tk.ua || '',
        ip: tk.ip || '',
        url,
        comment,
        pid,
        rid,
        sticky,
        status,
        like: null,
        insertedAt,
        createdAt,
        updatedAt
      }
      return item
    })

    // Waline标准外层导出结构
    walineJson = {
      "type": "waline",
      "version": 1,
      "time": Date.now(),
      "tables": ["Comment", "Counter", "Users"],
      "data": {
        "Comment": commentArr,
        "Counter": [],
        "Users": []
      }
    }

    outputEl.value = JSON.stringify(walineJson, null, 2)
    downloadBtn.disabled = false
    msgEl.textContent = \`转换成功，共\${commentArr.length}条评论，已自动给所有url末尾补斜杠\`
    msgEl.className = 'tip success'
  } catch (err) {
    outputEl.value = ''
    walineJson = null
    downloadBtn.disabled = true
    msgEl.textContent = '转换失败：' + err
    msgEl.className = 'tip error'
  }
}

// 修复下载无响应逻辑
downloadBtn.onclick = () => {
  if (!walineJson) {
    msgEl.textContent = '请先执行转换！'
    msgEl.className = 'tip error'
    return
  }
  const jsonStr = JSON.stringify(walineJson, null, 2)
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'waline-import.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  msgEl.textContent = '文件下载完成，所有url已自动补尾斜杠，和前台测试评论格式统一'
  msgEl.className = 'tip success'
}
<\/script>
</body>
</html>`;
