/**
 * Worker 共用 HTTP 工具 —— corsHeaders / jsonResponse
 * github-proxy、ai-proxy、kv-data 三个 handler 共用，避免各处复制。
 */

export function corsHeaders(extra = {}) {
	return {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
		"Access-Control-Allow-Headers":
			"Content-Type, Authorization, Accept, X-GitHub-Api-Version, User-Agent",
		"Access-Control-Max-Age": "86400",
		...extra,
	};
}

export function jsonResponse(data, status = 200, extraHeaders = {}) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			"Content-Type": "application/json",
			...corsHeaders(),
			...extraHeaders,
		},
	});
}
