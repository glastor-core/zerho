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
  assertStringIncludes(output, "Zerho CLI");
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
  assertStringIncludes(output, "Zerho v");
});

Deno.test("CLI: Run with unknown command outputs helpful error", async () => {
  const command = new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", "--unstable-kv", "src/cli.ts", "invalid-cmd"],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout } = await command.output();
  const output = new TextDecoder().decode(stdout);

  assertEquals(code, 0);
  assertStringIncludes(output, 'Comando desconocido: "invalid-cmd"');
});

Deno.test("CLI: Run init creates scaffolding in target directory", async () => {
  const tmpDir = await Deno.makeTempDir({ prefix: "zerho_init_test_" });
  try {
    const command = new Deno.Command(Deno.execPath(), {
      args: ["run", "-A", "--unstable-kv", "src/cli.ts", "init", tmpDir],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout } = await command.output();
    const output = new TextDecoder().decode(stdout);

    assertEquals(code, 0);
    assertStringIncludes(output, "Inicializando nuevo proyecto Zerho");
    assertStringIncludes(output, "Estructura creada con éxito");

    const indexPath = `${tmpDir}/docs/index.md`;
    const indexContent = await Deno.readTextFile(indexPath);
    assertStringIncludes(indexContent, "layout: home");
  } finally {
    await Deno.remove(tmpDir, { recursive: true }).catch(() => {});
  }
});

Deno.test("CLI: Run stats queries Deno KV telemetry", async () => {
  const command = new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", "--unstable-kv", "src/cli.ts", "stats"],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout } = await command.output();
  const output = new TextDecoder().decode(stdout);

  assertEquals(code, 0);
  assertStringIncludes(output, "Zerho Edge Analytics (Deno KV)");
});
