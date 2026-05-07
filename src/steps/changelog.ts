import * as p from "@clack/prompts";
import type { ResolvedConfig } from "../types.ts";
import { run } from "../utils.ts";

export function generateChangelog(config: ResolvedConfig, tag: string): string {
	const lastTag = run(
		"git describe --tags --abbrev=0 2>/dev/null || echo ''",
		{ cwd: config.root },
	).trim();

	let changelog = "";
	if (lastTag) {
		changelog = run(
			`git log ${lastTag}..HEAD --pretty=format:"- %s (%h)" --no-merges`,
			{ cwd: config.root },
		).trim();
	}

	if (!changelog) changelog = `- Release ${tag}`;
	p.note(changelog, "Changelog");
	return changelog;
}
