/**
 * parseFriendsConfig.ts — 解析 friendsConfig.ts 内容，提取 friendsConfig 数组
 *
 * 移植自 check-flink/friends_watcher.py 的 Layer2 正则修复逻辑。
 * 用于 friends.json.ts 端点运行时从 GitHub raw 拉取最新 TS 文件后解析。
 */

export interface ParsedFriend {
	title: string;
	siteurl: string;
	imgurl: string;
	desc: string;
	linkpage?: string;
	tags?: string[];
	weight?: number;
	enabled?: boolean;
}

/**
 * 从 TypeScript 源码中提取 friendsConfig 数组并解析为对象数组。
 * 支持含类型标注 `friendsConfig: FriendLink[]` 和不含类型标注两种格式。
 */
export function parseFriendsConfigFromTS(tsContent: string): ParsedFriend[] {
	// 1) 找到数组起点
	const startMarker = 'export const friendsConfig: FriendLink[] = [';
	const altMarker = 'export const friendsConfig = [';

	let startIdx = tsContent.indexOf(startMarker);
	if (startIdx === -1) {
		startIdx = tsContent.indexOf(altMarker);
		if (startIdx === -1) return [];
		// altMarker 长度 = 29，定位到 '[' 位置
		startIdx = startIdx + altMarker.length - 1;
	} else {
		// startMarker 长度 = 41，定位到 '[' 位置
		startIdx = startIdx + startMarker.length - 1;
	}

	// 2) 提取数组内容（处理注释、字符串、模板字面量，匹配括号平衡）
	let i = startIdx;
	const n = tsContent.length;
	let depth = 0;
	let inStr: string | null = null;
	let inTpl = false;
	let inLineComment = false;
	let inBlockComment = false;

	while (i < n) {
		const ch = tsContent[i];
		const nxt = tsContent[i + 1] || '';

		if (inLineComment) {
			if (ch === '\n') inLineComment = false;
			i++;
			continue;
		}
		if (inBlockComment) {
			if (ch === '*' && nxt === '/') {
				inBlockComment = false;
				i += 2;
			} else {
				i++;
			}
			continue;
		}
		if (inStr || inTpl) {
			const quote = inStr || (inTpl ? '`' : null);
			if (ch === '\\' && quote) {
				i += 2;
				continue;
			}
			if (quote && ch === quote) {
				inStr = null;
				inTpl = false;
			}
			i++;
			continue;
		}

		// 不在字符串中
		if (ch === '/' && nxt === '/') {
			inLineComment = true;
			i += 2;
			continue;
		}
		if (ch === '/' && nxt === '*') {
			inBlockComment = true;
			i += 2;
			continue;
		}
		if (ch === '"' || ch === "'") {
			inStr = ch;
			i++;
			continue;
		}
		if (ch === '`') {
			inTpl = true;
			i++;
			continue;
		}
		if (ch === '[' || ch === '{') {
			depth++;
		} else if (ch === ']' || ch === '}') {
			depth--;
			if (depth === 0) {
				// 截取到整个数组（含括号）
				const arrSrc = tsContent.slice(startIdx, i + 1);
				return parseRepairedArray(arrSrc);
			}
		}
		i++;
	}

	return [];
}

/**
 * 对抽取出来的数组源码执行 TS→JSON 修复并 JSON.parse。
 */
function parseRepairedArray(arrSrc: string): ParsedFriend[] {
	// 1) 保护字符串内容：提取字符串并替换为占位符
	const placeholderMap = new Map<string, string>();
	const PREFIX = '@@@_STRPLACEHOLDER_';
	const SUFFIX = '_@@@';

	function protectStrings(s: string): string {
		const out: string[] = [];
		let i = 0;
		const n = s.length;
		let inStr: string | null = null;
		let inTpl = false;
		const buf: string[] = [];
		let pid = 0;

		while (i < n) {
			const ch = s[i];
			const nxt = s[i + 1] || '';

			if (inStr || inTpl) {
				const q = inStr || (inTpl ? '`' : null);
				if (ch === '\\' && q) {
					buf.push(ch);
					if (i + 1 < n) buf.push(s[i + 1]);
					i += 2;
					continue;
				}
				if (q && ch === q) {
					buf.push(ch);
					const key = `${PREFIX}${pid}${SUFFIX}`;
					pid++;
					placeholderMap.set(key, buf.join(''));
					out.push(key);
					buf.length = 0;
					inStr = null;
					inTpl = false;
					i++;
					continue;
				}
				buf.push(ch);
				i++;
				continue;
			}

			if (ch === '"' || ch === "'") {
				inStr = ch;
				buf.push(ch);
				i++;
				continue;
			}
			if (ch === '`') {
				inTpl = true;
				buf.push(ch);
				i++;
				continue;
			}

			// 不在字符串中：处理注释
			if (ch === '/' && nxt === '/') {
				while (i < n && s[i] !== '\n') i++;
				continue;
			}
			if (ch === '/' && nxt === '*') {
				i += 2;
				while (i + 1 < n && !(s[i] === '*' && s[i + 1] === '/')) i++;
				i += 2;
				continue;
			}

			out.push(ch);
			i++;
		}
		return out.join('');
	}

	let protected_s = protectStrings(arrSrc);

	// 2) 去掉尾逗号：`,\s*]` → `]`, `,\s*}` → `}`
	protected_s = protected_s.replace(/,\s*([\]}])/g, '$1');

	// 3) 给没有引号的对象键加双引号
	protected_s = protected_s.replace(
		/(?<=[\{\[,])\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*:/g,
		(_m, key: string) => `"${key}":`,
	);
	protected_s = protected_s.replace(
		/([\[\{])\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*:/g,
		(_m, bracket: string, key: string) => `${bracket}"${key}":`,
	);

	// 4) 去除类型标注：`as const` / `as string[]` 等
	protected_s = protected_s.replace(/\s+as\s+(?:const|[\w\[\]]+)/g, '');

	// 5) 恢复字符串占位
	for (const [key, val] of placeholderMap) {
		protected_s = protected_s.replaceAll(key, val);
	}

	// 6) JSON.parse
	try {
		const data = JSON.parse(protected_s);
		if (Array.isArray(data)) {
			return data as ParsedFriend[];
		}
		return [];
	} catch {
		return [];
	}
}