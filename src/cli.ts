import * as p from "@clack/prompts";
import pc from "picocolors";
import { resolve } from "node:path";
import { loadConfig } from "./config.ts";
import { bumpVersionFiles, getStagedFiles } from "./steps/bump.ts";
import { generateChangelog } from "./steps/changelog.ts";
import { createGithubRelease } from "./steps/github.ts";
import { commitAndTag, pushChanges } from "./steps/git.ts";
import { publishHomebrew } from "./steps/homebrew.ts";
import { publishNpm } from "./steps/npm.ts";
import { runPreflight } from "./steps/preflight.ts";
import { pickVersion } from "./steps/version.ts";
import { readJson } from "./utils.ts";

export async function run(argv: string[] = process.argv.slice(2)): Promise<void> {
	const isBeta = argv.includes("--beta");
	const args = argv.filter((a) => a !== "--beta");

	// Resolve project root (cwd of caller, not this package)
	const root = process.env.SHIP_ROOT ?? process.cwd();
	const config = await loadConfig(root);

	console.clear();
	p.intro(
		pc.magenta(
			pc.bold(isBeta ? "  ship — Beta Release  " : "  ship — Release  "),
		),
	);

	// Step: preflight
	let branch = "main";
	if (config.steps.preflight) {
		branch = runPreflight(config, isBeta);
	}

	// Read current version from first package.json
	const pkgJsonPaths = config.packageJsonPaths.map((rel) =>
		resolve(root, rel),
	);
	if (!pkgJsonPaths.length) {
		p.log.error("No packageJsonPaths configured. Add them to ship.config.ts or package.json.");
		process.exit(1);
	}

	const rootPkg = readJson(pkgJsonPaths[0]);
	const currentVersion = rootPkg.version as string;

	// Step: pick version
	const newVersion = await pickVersion(currentVersion, args[0], isBeta);
	const tag = `${config.git.tagPrefix}${newVersion}`;

	const proceed = await p.confirm({
		message: `Release ${pc.cyan(currentVersion)} → ${pc.green(newVersion)} (${tag})?`,
	});
	if (p.isCancel(proceed) || !proceed) {
		p.cancel("Release cancelled.");
		process.exit(0);
	}

	// Step: bump version files
	if (config.steps.bumpVersion) {
		bumpVersionFiles(config, newVersion);
	}

	// Step: changelog
	let changelog = `- Release ${tag}`;
	if (config.steps.changelog) {
		changelog = generateChangelog(config, tag);
	}

	// Step: git commit + tag
	if (config.steps.commit || config.steps.tag) {
		const stagedFiles = getStagedFiles(config);
		commitAndTag(config, tag, stagedFiles);
	}

	// Step: push
	if (config.steps.push) {
		pushChanges(config, branch, tag);
	}

	// Step: GitHub release
	if (config.steps.githubRelease) {
		createGithubRelease(config, tag, changelog, isBeta);
	}

	// Step: npm publish
	if (config.steps.npm) {
		await publishNpm(config, isBeta);
	}

	// Step: Homebrew (skip for beta)
	if (config.steps.homebrew && !isBeta) {
		await publishHomebrew(config, tag);
	} else if (isBeta && config.steps.homebrew) {
		p.log.info("Skipping Homebrew for beta release");
	}

	// Detect GitHub remote for outro link
	let releaseUrl = `${tag}`;
	try {
		const remote = (
			require("node:child_process").execSync(
				"git remote get-url origin 2>/dev/null",
				{ cwd: root, encoding: "utf-8" },
			) as string
		).trim();
		const match = remote.match(/github\.com[:/]([^/]+\/[^/.]+)/);
		if (match) {
			const slug = match[1].replace(/\.git$/, "");
			releaseUrl = `https://github.com/${slug}/releases/tag/${tag}`;
		}
	} catch {
		// no remote
	}

	p.outro(
		`${pc.green("✓")} Released ${pc.green(tag)} — ${pc.cyan(releaseUrl)}`,
	);
}
