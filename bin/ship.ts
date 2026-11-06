#!/usr/bin/env bun
import { run } from "../src/cli.ts";

run(process.argv.slice(2)).catch((err) => {
	console.error(err?.message ?? err);
	process.exit(1);
});
