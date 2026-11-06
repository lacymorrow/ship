# ship

Interactive release CLI — version bump, changelog, git tag, GitHub release, npm publish, Homebrew formula update.

Config-driven. Every step is individually toggleable. Usable from any project via `npx`.

## Install

```bash
npm install -g @lacymorrow/ship
# or run directly
npx @lacymorrow/ship
```

## Usage

```bash
# Interactive — prompts for version bump type
ship

# Specify bump type directly
ship patch
ship minor
ship major

# Explicit version
ship 2.0.0

# Beta release
ship --beta
```

## Configuration

Ship looks for config in this order:

1. `ship.config.ts` or `ship.config.js`
2. `.shiprc.json` or `.shiprc`
3. `"ship"` key in `package.json`

If no config is found, ship auto-detects `package.json` and runs all steps.

### Example `ship.config.ts`

```ts
import type { ShipConfig } from "@lacymorrow/ship";

export default {
  packageJsonPaths: ["package.json", "packages/core/package.json"],
  bumpFiles: [
    {
      path: "bin/cli",
      pattern: /^VERSION="[^"]*"/m,
      replacement: (v) => `VERSION="${v}"`,
    },
  ],
  steps: {
    npm: true,
    homebrew: true,
    githubRelease: true,
  },
  git: {
    releaseBranch: "main",
    tagPrefix: "v",
    commitMessage: "release: {tag}",
  },
  npm: {
    access: "public",
  },
  homebrew: {
    tapPath: "../homebrew-tap",
    formulaFile: "Formula/mytool.rb",
    repoSlug: "user/repo",
  },
} satisfies ShipConfig;
```

### Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `packageJsonPaths` | `string[]` | Auto-detected | Paths to package.json files to bump |
| `bumpFiles` | `BumpFileConfig[]` | `[]` | Additional files with regex-based version bumping |
| `steps.*` | `boolean` | All `true` | Toggle individual steps |
| `git.releaseBranch` | `string` | `"main"` | Branch required for stable releases |
| `git.tagPrefix` | `string` | `"v"` | Tag prefix (e.g. `v1.0.0`) |
| `git.commitMessage` | `string` | `"release: {tag}"` | Commit message template (`{tag}` is replaced) |
| `npm.access` | `"public" \| "restricted"` | `"public"` | npm publish access level |
| `npm.cwd` | `string` | Project root | Working directory for npm publish |
| `homebrew.tapPath` | `string` | Auto-detected | Path to Homebrew tap repo |
| `homebrew.formulaFile` | `string` | Auto-detected | Formula file relative to tap |
| `homebrew.repoSlug` | `string` | Auto-detected | GitHub `owner/repo` for tarball URL |

### Steps

All steps are enabled by default. Disable any via `steps`:

| Step | What it does |
|------|-------------|
| `preflight` | Checks clean git tree, correct branch |
| `bumpVersion` | Updates package.json + custom bump files |
| `changelog` | Generates changelog from git log |
| `commit` | Creates release commit |
| `tag` | Creates git tag |
| `push` | Pushes commit + tag to origin |
| `githubRelease` | Creates GitHub release via `gh` CLI |
| `npm` | Publishes to npm (with OTP retry) |
| `homebrew` | Updates Homebrew formula SHA + URL |

## License

MIT
