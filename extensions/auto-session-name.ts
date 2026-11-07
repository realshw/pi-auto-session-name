/**
 * Auto-names new sessions.
 *
 * After the first turn of a fresh session finishes, asks the current model for a
 * short title and stores it with pi.setSessionName(), so /resume, the footer and
 * the terminal title show a label instead of the first message. Sessions that are
 * already named, carry history, or receive a manual /name are left alone.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const MAX_LENGTH = 48;

const titlePrompt = (request: string): string =>
	`Name this coding session in at most 6 words.
Reply with the title only: no quotes, no filler, no trailing period.

First request:
${request}`;

function textOf(content: unknown): string {
	if (typeof content === "string") return content;
	if (!Array.isArray(content)) return "";
	return content.map((block) => (block?.type === "text" ? block.text : "")).join(" ");
}

function shorten(raw: string): string {
	const line = raw
		.replace(/^#+\s*/, "")
		.replace(/["'`]/g, "")
		.replace(/\s+/g, " ")
		.trim()
		.replace(/[.,;:!]+$/, "");
	return line.length > MAX_LENGTH ? `${line.slice(0, MAX_LENGTH - 1)}…` : line;
}

export default function (pi: ExtensionAPI) {
	let request = "";
	let skip = true;
	let pending: Promise<void> | null = null;

	pi.on("session_start", async (_event, ctx) => {
		request = "";
		pending = null;
		const hasPrompt = ctx.sessionManager
			.getEntries()
			.some((entry) => entry.type === "message" && entry.message.role === "user");
		skip = Boolean(pi.getSessionName()) || hasPrompt;
	});

	pi.on("message_end", async (event) => {
		if (!skip && !request && event.message.role === "user") request = textOf(event.message.content);
	});

	pi.on("turn_end", async (_event, ctx) => {
		if (skip || !request || pending) return;
		const first = request;
		const { model, modelRegistry } = ctx;

		pending = (async () => {
			let title = "";
			try {
				const reply =
					model &&
					(await modelRegistry.complete(model, {
						messages: [{ role: "user", timestamp: Date.now(), content: titlePrompt(first) }],
					}));
				if (reply) title = shorten(textOf(reply.content));
			} catch {
				// Naming is cosmetic: provider trouble must not disturb the session.
			}
			if (!pi.getSessionName()) pi.setSessionName(title || shorten(first) || "Untitled session");
		})();
	});

	const flush = async () => {
		try {
			await pending;
		} catch {
			// Naming is cosmetic: provider trouble must not disturb the session.
		}
	};

	pi.on("agent_settled", flush);
	pi.on("session_shutdown", flush);
}
