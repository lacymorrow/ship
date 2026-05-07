# ship

Interactive release CLI — version bump, git tag, GitHub release, npm publish, Homebrew formula update.

Like [np](https://github.com/sindresorhus/np) but fully config-driven and built for projects with multiple packages, binary files, and Homebrew taps.

## Usage

```bash
npx @lacymorrow/ship              # interactive — prompts for bump type
npx @lacymorrow/ship patch        # patch bump  (1.5.3 → 1.5.4)
npx @lacymorrow/ship minor        # minor bump  (1.5.3 → 1.6.0)
npx @lacymorrow/ship major        # major bump  (1.5.3 → 2.0.0)
npx @lacymorrow/ship 1.6.0        # explicit version
npx @lacymorrow/ship --beta       # beta release (1.5.3 → 1.5.4-beta.0)
```

Or add it to your `package.json`:

```json
{
  "scripts": {
    "release": "ship",
    "release:beta": "ship --beta"
  }
}
```

## What it does

1. **Preflight** — checks for a clean git working tree and correct branch
2. **Version bump** — interactive semver picker or explicit version/type
3. **Changelog** — generates from `git log` since last tag
4. **Commit + tag** — commits bumped files and creates a git tag
5. **Push** — pushes the branch and tag to GitHub
6. **GitHub release** — creates a release via `gh` CLI
7. **npm publish** — publishes with OTP retry flow
8. **Homebrew** — updates the formula in your tap

All steps are individually toggleable.

## Configuration

Create a `ship.config.ts` (or `.shiprc.json`, or `"ship"` key in `package.json`):

```ts
// ship.config.ts
import type { ShipConfig } from "@lacymorrow/ship";

export default {
  // package.json files to version-bump (relative to project root)
  packageJsonPaths: ["package.json", "packages/myapp/package.json"],

  // Additional files to bump via regex
  bumpFiles: [
    {
      path: "bin/myapp",
      pattern: /^VERSION_FALLBACK="[^"]*"/m,
      replacement: (v) => `VERSION_FALLBACK="${v}"`,
    },
  ],

  // Toggle steps
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

  // Git options
  git: {
    releaseBranch: "main",   // branch required for stable releases
    tagPrefix: "v",
    commitMessage: "release: {tag}",
    commitFlags: "--no-verify",
    pushFlags: "--no-verify",
  },

  // npm publish options
  npm: {
    cwd: "packages/myapp",   // directory to run npm publish in
    access: "public",
  },

  // Homebrew tap options
  homebrew: {
    tapPath: "/path/to/homebrew-tap",
    formulaFile: "Formula/myapp.rb",
    repoSlug: "owner/repo",
    commitMessage: "{formula}: update to {tag}",
  },
} satisfies ShipConfig;
```

### Auto-detection

When no config is provided, ship will:
- Use the `package.json` in the current directory
- Look for a sibling `homebrew-tap` directory
- Detect the GitHub repo slug from the git remote

## Requirements

- [Bun](https://bun.sh) or Node.js ≥ 18
- [gh](https://cli.github.com) CLI (for GitHub releases)
- npm account (for npm publish)

## License

MIT
