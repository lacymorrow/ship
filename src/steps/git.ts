import * as p from "@clack/prompts";
import pc from "picocolors";
import type { ResolvedConfig } from "../types.ts";
import { run } from "../utils.ts";

export function commitAndTag(
	config: ResolvedConfig,
	tag: string,
	stagedFiles: string[],
): void {
	const spinner = p.spinner();
	spinner.start("Committing and tagging");

	if (stagedFiles.length > 0) {
		run(`git add ${stagedFiles.join(" ")}`, { cwd: config.root });
	}

	const message = config.git.commitMessage.replace(/\{tag\}/g, tag);
	run(
		`git commit -m "${message}" ${config.git.commitFlags}`,
		{ cwd: config.root },
	);
	run(`git tag ${tag}`, { cwd: config.root });

	spinner.stop(`Committed and tagged ${pc.green(tag)}`);
}

export function pushChanges(
	config: ResolvedConfig,
	branch: string,
	tag: string,
): void {
	const spinner = p.spinner();
	spinner.start("Pushing to GitHub");

	run(
		`git push origin ${branch} ${config.git.pushFlags}`,
		{ cwd: config.root },
	);
	run(`git push origin ${tag}`, { cwd: config.root });

	spinner.stop("Pushed to GitHub");
}
