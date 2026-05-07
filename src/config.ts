import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ResolvedConfig, ShipConfig } from "./types.ts";
import { readJson } from "./utils.ts";

const DEFAULTS: Omit<ResolvedConfig, "root"> = {
	packageJsonPaths: [],
	bumpFiles: [],
	steps: {
		preflight: true,
		changelog: true,
		bumpVersion: true,
		commit: true,
		tag: true,
		push: true,
		githubRelease: true,
		npm: true,
		homebrew: true,
	},
	git: {
		releaseBranch: "main",
		tagPrefix: "v",
		commitMessage: "release: {tag}",
		commitFlags: "--no-verify",
		pushFlags: "--no-verify",
	},
	npm: {
		cwd: "",
		access: "public",
	},
	homebrew: {
		tapPath: "",
		formulaFile: "",
		repoSlug: "",
		commitMessage: "{formula}: update to {tag}",
	},
};

function mergeConfig(base: Omit<ResolvedConfig, "root">, user: ShipConfig): Omit<ResolvedConfig, "root"> {
	return {
		packageJsonPaths: user.packageJsonPaths ?? base.packageJsonPaths,
		bumpFiles: user.bumpFiles ?? base.bumpFiles,
		steps: { ...base.steps, ...user.steps },
		git: { ...base.git, ...user.git },
		npm: { ...base.npm, ...user.npm },
		homebrew: { ...base.homebrew, ...user.homebrew },
	};
}

export async function loadConfig(root: string): Promise<ResolvedConfig> {
	let userConfig: ShipConfig = {};

	// Try ship.config.ts / ship.config.js / .shiprc.json
	const candidates = [
		resolve(root, "ship.config.ts"),
		resolve(root, "ship.config.js"),
		resolve(root, ".shiprc.json"),
		resolve(root, ".shiprc"),
	];

	for (const candidate of candidates) {
		if (existsSync(candidate)) {
			if (candidate.endsWith(".ts") || candidate.endsWith(".js")) {
				const mod = await import(candidate);
				userConfig = mod.default ?? mod;
			} else {
				userConfig = JSON.parse(readFileSync(candidate, "utf-8"));
			}
			break;
		}
	}

	// Also check package.json "ship" key
	const pkgPath = resolve(root, "package.json");
	if (!Object.keys(userConfig).length && existsSync(pkgPath)) {
		const pkg = readJson(pkgPath);
		if (pkg.ship && typeof pkg.ship === "object") {
			userConfig = pkg.ship as ShipConfig;
		}
	}

	// Auto-detect packageJsonPaths if not specified
	const merged = mergeConfig(DEFAULTS, userConfig);
	if (!merged.packageJsonPaths.length && existsSync(pkgPath)) {
		merged.packageJsonPaths = ["package.json"];
	}

	// Auto-detect npm.cwd
	if (!merged.npm.cwd) {
		merged.npm.cwd = root;
	}

	// Auto-detect homebrew tap path from sibling directory convention
	if (!merged.homebrew.tapPath) {
		const siblingTap = resolve(root, "../homebrew-tap");
		if (existsSync(siblingTap)) {
			merged.homebrew.tapPath = siblingTap;
		}
	}

	// Auto-detect homebrew formulaFile from repo slug
	if (merged.homebrew.tapPath && !merged.homebrew.formulaFile && !merged.homebrew.repoSlug) {
		try {
			const remote = (
				require("node:child_process").execSync(
					"git remote get-url origin 2>/dev/null",
					{ cwd: root, encoding: "utf-8" },
				) as string
			).trim();
			const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
			if (match) {
				merged.homebrew.repoSlug = `${match[1]}/${match[2]}`;
				merged.homebrew.formulaFile = `Formula/${match[2]}.rb`;
			}
		} catch {
			// no remote
		}
	}

	return { ...merged, root };
}
