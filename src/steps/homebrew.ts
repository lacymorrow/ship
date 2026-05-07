import * as p from "@clack/prompts";
import pc from "picocolors";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ResolvedConfig } from "../types.ts";
import { errorText, run } from "../utils.ts";

export async function publishHomebrew(
	config: ResolvedConfig,
	tag: string,
): Promise<void> {
	const { tapPath, formulaFile, repoSlug, commitMessage } = config.homebrew;

	if (!tapPath || !formulaFile || !repoSlug) {
		p.log.warn("Homebrew config incomplete (tapPath, formulaFile, repoSlug required). Skipping.");
		return;
	}

	const formulaPath = resolve(tapPath, formulaFile);
	if (!existsSync(formulaPath)) {
		p.log.warn(`Homebrew formula not found at ${pc.dim(formulaPath)}. Skipping.`);
		return;
	}

	const doHomebrew = await p.confirm({
		message: "Update Homebrew formula?",
		initialValue: true,
	});
	if (p.isCancel(doHomebrew) || !doHomebrew) {
		p.log.info("Skipping Homebrew");
		return;
	}

	const spinner = p.spinner();
	spinner.start("Updating Homebrew formula");

	try {
		run("git checkout main", { cwd: tapPath });
		run("git pull --rebase origin main", { cwd: tapPath });

		const tarballUrl = `https://github.com/${repoSlug}/archive/refs/tags/${tag}.tar.gz`;
		const sha256 = run(
			`curl -sL "${tarballUrl}" | shasum -a 256 | cut -d' ' -f1`,
			{ cwd: tapPath },
		).trim();

		if (!sha256 || sha256.length !== 64) {
			spinner.stop(pc.red("Failed to compute SHA256"));
			p.log.error(`Got: ${sha256}`);
			return;
		}

		let formula = readFileSync(formulaPath, "utf-8");
		formula = formula.replace(
			/url "https:\/\/github\.com\/[^/]+\/[^/]+\/archive\/refs\/tags\/[^"]+\.tar\.gz"/,
			`url "${tarballUrl}"`,
		);
		formula = formula.replace(/sha256 "[a-f0-9]+"/, `sha256 "${sha256}"`);
		writeFileSync(formulaPath, formula);

		const formulaName = formulaFile.replace(/^Formula\//, "").replace(/\.rb$/, "");
		run(`git add ${formulaFile}`, { cwd: tapPath });

		const msg = commitMessage
			.replace(/\{tag\}/g, tag)
			.replace(/\{formula\}/g, formulaName);
		run(`git commit -m "${msg}"`, { cwd: tapPath });
		run("git push", { cwd: tapPath });

		spinner.stop(`Homebrew formula updated to ${pc.green(tag)}`);
	} catch (err) {
		spinner.stop(pc.red("Homebrew update failed"));
		p.log.error(errorText(err));
		p.log.info(`Update manually: ${pc.cyan(`edit ${formulaPath}`)}`);
	}
}
