import { describe, expect, it } from "bun:test";
import { bumpBeta, bumpVersion } from "./version.ts";

describe("bumpVersion", () => {
	it("bumps patch, minor and major", () => {
		expect(bumpVersion("1.2.3", "patch")).toBe("1.2.4");
		expect(bumpVersion("1.2.3", "minor")).toBe("1.3.0");
		expect(bumpVersion("1.2.3", "major")).toBe("2.0.0");
	});

	it("strips a prerelease suffix before bumping", () => {
		expect(bumpVersion("1.2.3-beta.4", "patch")).toBe("1.2.4");
	});

	// Regression: a version string without all three semver parts used to produce
	// "1.0.NaN" instead of failing, which would tag and publish a broken release.
	it("rejects a version that is not major.minor.patch", () => {
		expect(() => bumpVersion("1.0", "patch")).toThrow(/not valid semver/);
		expect(() => bumpVersion("", "patch")).toThrow(/not valid semver/);
		expect(() => bumpVersion("1.x.3", "patch")).toThrow(/not valid semver/);
	});
});

describe("bumpBeta", () => {
	it("advances an existing beta", () => {
		expect(bumpBeta("1.2.3-beta.4", "patch")).toBe("1.2.3-beta.5");
	});

	it("starts a beta from a stable version", () => {
		expect(bumpBeta("1.2.3", "minor")).toBe("1.3.0-beta.0");
	});

	it("rejects a non-semver base version", () => {
		expect(() => bumpBeta("1.0", "patch")).toThrow(/not valid semver/);
	});
});
