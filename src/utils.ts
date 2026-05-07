import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

export function run(
	cmd: string,
	opts?: { cwd?: string; stdio?: "inherit" | "pipe" },
): string {
	return execSync(cmd, {
		cwd: opts?.cwd,
		stdio: opts?.stdio ?? "pipe",
		encoding: "utf-8",
		shell: "/bin/bash",
	}) as string;
}

export function readJson(path: string): Record<string, unknown> {
	return JSON.parse(readFileSync(path, "utf-8"));
}

export function writeJson(path: string, data: Record<string, unknown>): void {
	writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

export function isOtpError(err: unknown): boolean {
	const check = (s: string) =>
		s.includes("EOTP") || s.includes("one-time pass");
	if (err instanceof Error) {
		if (check(err.message)) return true;
		if ("stderr" in err && typeof err.stderr === "string" && check(err.stderr))
			return true;
		if ("stdout" in err && typeof err.stdout === "string" && check(err.stdout))
			return true;
	}
	return check(String(err));
}

export function errorText(err: unknown): string {
	if (err instanceof Error) {
		if ("stderr" in err && typeof err.stderr === "string" && err.stderr.trim())
			return err.stderr.trim();
		return err.message;
	}
	return String(err);
}
