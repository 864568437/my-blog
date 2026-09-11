import { handleAiProxy } from "../src/workers/ai-proxy.js";

export const config = {
	runtime: "edge",
};

export default async function handler(request) {
	const env = {
		AI_BASE_URL: process.env.AI_BASE_URL || "",
		AI_API_KEY: process.env.AI_API_KEY || "",
		AI_MODEL: process.env.AI_MODEL || "",
		AI_API_FORMAT: process.env.AI_API_FORMAT || "",
		AI_AUTH_STYLE: process.env.AI_AUTH_STYLE || "",
		AI_MAX_TOKENS: process.env.AI_MAX_TOKENS || "",
		AI_SYSTEM_PROMPT: process.env.AI_SYSTEM_PROMPT || "",
		AI_THINKING: process.env.AI_THINKING || "",
	};
	return handleAiProxy(request, env);
}
