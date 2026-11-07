#!/usr/bin/env -S deno run -A
/**
 * One-step Zerho Project Initializer entrypoint (`jsr:@zerho/core/init`).
 * Scaffolds a complete, batteries-included Deno 2 documentation workspace.
 */

import { runCli } from "./cli.ts";

if (import.meta.main) {
  await runCli(["init", ...Deno.args]);
}
