#!/usr/bin/env -S deno run -A
import { join } from "@std/path";
import { buildSite } from "./core/builder.ts";

const HELP = `
⚡ \x1b[35mZerhoPress CLI\x1b[0m - El motor de documentación Pro para Deno

\x1b[1mUSO:\x1b[0m
  deno run -A jsr:@zerhopress/core <comando> [opciones]

\x1b[1mCOMANDOS:\x1b[0m
  \x1b[36mdev\x1b[0m       Inicia el servidor de desarrollo local con recarga en vivo (HMR)
  \x1b[32mbuild\x1b[0m     Compila el sitio estático para producción en la carpeta dist/
  \x1b[33mserve\x1b[0m     Sirve el sitio compilado en modo producción para Deno Deploy
  \x1b[35minit\x1b[0m      Crea una estructura inicial de documentación lista para usar
  \x1b[34mstats\x1b[0m     Consulta las métricas y feedback almacenadas en Deno KV

\x1b[1mOPCIONES:\x1b[0m
  -p, --port <puerto>   Puerto para el servidor HTTP (por defecto: 3000 o 8000)
  -h, --help            Muestra este mensaje de ayuda
  -v, --version         Muestra la versión de ZerhoPress
`;

const VERSION = "1.1.0";

export async function runCli(args: string[] = Deno.args) {
  const command = args[0] || "--help";

  if (command === "--help" || command === "-h" || command === "help") {
    console.log(HELP);
    return;
  }

  if (command === "--version" || command === "-v" || command === "version") {
    console.log(`ZerhoPress v${VERSION} (Deno ${Deno.version.deno})`);
    return;
  }

  if (command === "build") {
    console.log("⚡ Iniciando compilación de ZerhoPress...");
    await buildSite({ devMode: false });
    return;
  }

  if (command === "dev") {
    const devPath = join(import.meta.dirname || Deno.cwd(), "core", "dev.ts");
    const p = new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "--allow-net",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "--unstable-kv",
        "--watch",
        devPath,
      ],
      stdout: "inherit",
      stderr: "inherit",
    }).spawn();
    await p.status;
    return;
  }

  if (command === "serve") {
    const mainPath = join(import.meta.dirname || Deno.cwd(), "..", "main.ts");
    const p = new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "--allow-net",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "--unstable-kv",
        mainPath,
      ],
      stdout: "inherit",
      stderr: "inherit",
    }).spawn();
    await p.status;
    return;
  }

  if (command === "init") {
    const targetDir = args[1] || ".";
    console.log(`\n✨ Inicializando nuevo proyecto ZerhoPress en "${targetDir}"...`);
    const docsDir = join(Deno.cwd(), targetDir, "docs");
    await Deno.mkdir(docsDir, { recursive: true });

    // Sample index.md
    await Deno.writeTextFile(
      join(docsDir, "index.md"),
      `---
layout: home
title: Mi Documentación
description: Creado con ZerhoPress en Deno
---
`,
    );
    console.log("✅ Estructura creada con éxito. Ejecuta 'deno task dev' para comenzar.");
    return;
  }

  if (command === "stats") {
    try {
      const kv = await Deno.openKv();
      console.log("\n📊 \x1b[36m[ZerhoPress Edge Analytics (Deno KV)]\x1b[0m");
      const iter = kv.list({ prefix: ["feedback"] });
      let found = false;
      for await (const entry of iter) {
        found = true;
        console.log(`- ${entry.key.join(" > ")}: \x1b[32m${entry.value}\x1b[0m`);
      }
      if (!found) {
        console.log(
          "No hay métricas registradas aún. Interactúa con el widget de feedback en las páginas de la documentación.",
        );
      }
    } catch (e) {
      console.error("Error al abrir Deno KV:", e);
    }
    return;
  }

  console.log(
    `Comando desconocido: "${command}". Ejecuta "deno task cli --help" para ver los comandos disponibles.`,
  );
}

if (import.meta.main) {
  await runCli();
}
