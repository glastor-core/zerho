import { assertEquals, assertStringIncludes } from "@std/assert";

Deno.test("CLI: Run with --help outputs usage manual", async () => {
  const command = new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", "--unstable-kv", "src/cli.ts", "--help"],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout } = await command.output();
  const output = new TextDecoder().decode(stdout);

  assertEquals(code, 0);
  assertStringIncludes(output, "ZerhoPress CLI");
  assertStringIncludes(output, "COMANDOS:");
  assertStringIncludes(output, "dev");
  assertStringIncludes(output, "build");
  assertStringIncludes(output, "serve");
  assertStringIncludes(output, "init");
  assertStringIncludes(output, "stats");
});

Deno.test("CLI: Run with -v outputs version string", async () => {
  const command = new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", "--unstable-kv", "src/cli.ts", "-v"],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout } = await command.output();
  const output = new TextDecoder().decode(stdout);

  assertEquals(code, 0);
  assertStringIncludes(output, "ZerhoPress v");
});
