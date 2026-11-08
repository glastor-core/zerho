#!/usr/bin/env -S deno run -A
/**
 * @module init
 * One-step Zerho Project Initializer entrypoint.
 * Scaffolds a complete, batteries-included Deno 2 documentation workspace.
 *
 * @example
 * ```bash
 * deno run -A jsr:@glastor/zerho/init
 * ```
 */

import { runCli } from "./cli.ts";

if (import.meta.main) {
  await runCli(["init", ...Deno.args]);
}
