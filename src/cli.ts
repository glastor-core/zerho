#!/usr/bin/env -S deno run -A
/**
 * @module cli
 * Command line interface runner for the Zerho documentation engine.
 *
 * @example
 * ```ts
 * import { runCli } from "@glastor/zerho/cli";
 *
 * await runCli(["build"]);
 * ```
 */

import { isAbsolute, join } from "@std/path";
import { buildSite } from "./core/builder.ts";
import { VERSION } from "./version.ts";

const HELP = `
⚡ \x1b[35mZerho CLI\x1b[0m - El motor de documentación Pro para Deno

\x1b[1mUSO:\x1b[0m
  deno run -A jsr:@zerho/core <comando> [opciones]

\x1b[1mCOMANDOS:\x1b[0m
  \x1b[36mdev\x1b[0m       Inicia el servidor de desarrollo local con recarga en vivo (HMR)
  \x1b[32mbuild\x1b[0m     Compila el sitio estático para producción en la carpeta dist/
              Opciones: -o, --out-dir <dir>    Directorio de salida (por defecto: dist)
                        -d, --docs-dir <dir>   Directorio markdown fuente (por defecto: docs)
                        --strict-links         Falla la compilación si detecta enlaces rotos
                        --skip-docgen          Omite la auto-generación de API reference
                        --site-url <url>       URL canónica de producción
  \x1b[33mserve\x1b[0m     Sirve el sitio compilado en modo producción para Deno Deploy
  \x1b[35minit\x1b[0m      Crea una estructura inicial de documentación lista para usar
  \x1b[34mstats\x1b[0m     Consulta las métricas y feedback almacenadas en Deno KV

\x1b[1mOPCIONES GLOBALES:\x1b[0m
  -p, --port <puerto>   Puerto para el servidor HTTP (por defecto: 3000 o 8000)
  -h, --help            Muestra este mensaje de ayuda
  -v, --version         Muestra la versión de Zerho
`;

interface ParsedBuildArgs {
  outDir?: string;
  docsDir?: string;
  skipDocgen?: boolean;
  strictLinks?: boolean;
  siteUrl?: string;
}

function parseBuildArgs(args: string[]): ParsedBuildArgs {
  const result: ParsedBuildArgs = {};
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if ((arg === "-o" || arg === "--out-dir" || arg === "--outDir") && args[i + 1]) {
      result.outDir = isAbsolute(args[i + 1]) ? args[i + 1] : join(Deno.cwd(), args[i + 1]);
      i++;
    } else if (arg.startsWith("--out-dir=")) {
      const val = arg.split("=")[1];
      result.outDir = isAbsolute(val) ? val : join(Deno.cwd(), val);
    } else if ((arg === "-d" || arg === "--docs-dir" || arg === "--docsDir") && args[i + 1]) {
      result.docsDir = isAbsolute(args[i + 1]) ? args[i + 1] : join(Deno.cwd(), args[i + 1]);
      i++;
    } else if (arg.startsWith("--docs-dir=")) {
      const val = arg.split("=")[1];
      result.docsDir = isAbsolute(val) ? val : join(Deno.cwd(), val);
    } else if (arg === "--skip-docgen" || arg === "--no-docgen") {
      result.skipDocgen = true;
    } else if (arg === "--strict" || arg === "--strict-links") {
      result.strictLinks = true;
    } else if (arg === "--site-url" && args[i + 1]) {
      result.siteUrl = args[i + 1];
      i++;
    } else if (arg.startsWith("--site-url=")) {
      result.siteUrl = arg.split("=")[1];
    }
  }
  return result;
}

function parsePortArg(args: string[]): string | undefined {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if ((arg === "-p" || arg === "--port") && args[i + 1]) {
      return args[i + 1];
    }
    if (arg.startsWith("--port=")) {
      return arg.split("=")[1];
    }
  }
  return undefined;
}

/**
 * Runs the Zerho CLI command pipeline.
 * @param args Array of CLI arguments (defaults to Deno.args).
 */
export async function runCli(args: string[] = Deno.args): Promise<void> {
  const command = args[0] || "--help";
  const customPort = parsePortArg(args);

  if (command === "--help" || command === "-h" || command === "help") {
    console.log(HELP);
    return;
  }

  if (command === "--version" || command === "-v" || command === "version") {
    console.log(`Zerho v${VERSION} (Deno ${Deno.version.deno})`);
    return;
  }

  if (command === "build") {
    const buildOpts = parseBuildArgs(args);
    console.log("⚡ Iniciando compilación de Zerho...");
    if (buildOpts.outDir) {
      console.log(`📁 Directorio de salida: ${buildOpts.outDir}`);
    }
    if (buildOpts.docsDir) {
      console.log(`📖 Directorio markdown: ${buildOpts.docsDir}`);
    }
    await buildSite({
      devMode: false,
      outDir: buildOpts.outDir,
      docsDir: buildOpts.docsDir,
      skipDocgen: buildOpts.skipDocgen,
      strictLinks: buildOpts.strictLinks,
      siteUrl: buildOpts.siteUrl,
    });
    return;
  }

  if (command === "dev") {
    const devPath = join(import.meta.dirname || Deno.cwd(), "core", "dev.ts");
    const env = customPort ? { PORT: customPort } : undefined;
    const p = new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "--allow-net",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "--allow-run",
        "--unstable-kv",
        "--watch",
        devPath,
      ],
      env,
      stdout: "inherit",
      stderr: "inherit",
    }).spawn();
    await p.status;
    return;
  }

  if (command === "serve") {
    const mainPath = join(import.meta.dirname || Deno.cwd(), "..", "main.ts");
    const env = customPort ? { PORT: customPort } : undefined;
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
      env,
      stdout: "inherit",
      stderr: "inherit",
    }).spawn();
    await p.status;
    return;
  }

  if (command === "init") {
    const targetDir = args[1] && !args[1].startsWith("-") ? args[1] : ".";
    console.log(`\n✨ Inicializando nuevo proyecto Zerho en "${targetDir}"...`);
    const baseDir = isAbsolute(targetDir) ? targetDir : join(Deno.cwd(), targetDir);
    const docsDir = join(baseDir, "docs");
    const guideDir = join(docsDir, "guide");
    const publicDir = join(docsDir, "public");
    await Deno.mkdir(guideDir, { recursive: true });
    await Deno.mkdir(publicDir, { recursive: true });

    // 1. Sample docs/index.md with customizable Hero & Features
    await Deno.writeTextFile(
      join(docsDir, "index.md"),
      `---
layout: home
title: Mi Documentación
description: Creado con Zerho en Deno
hero:
  title: Documentación Técnica Moderna
  tagline: Guía oficial, referencia de API y ejemplos interactivos para tu proyecto.
  actions:
    - theme: brand
      text: Comenzar Ahora
      link: /guide/getting-started
features:
  - icon: ⚡
    title: Rápido y Ligero
    details: Compilación instantánea con búsqueda semántica Cmd+K integrada.
  - icon: 🧩
    title: Ejemplos Ejecutables
    details: Bloques de código verificados automáticamente y listos para el Playground.
---
`,
    );

    // 2. Sample docs/guide/getting-started.md (Batteries-included showcase)
    const guidePath = join(guideDir, "getting-started.md");
    try {
      await Deno.stat(guidePath);
    } catch {
      await Deno.writeTextFile(
        guidePath,
        `---
title: Guía de Inicio Rápido
description: Primeros pasos con Zerho (Mermaid, Callouts, Playground y OpenAPI incluidos de serie).
---

## Bienvenido a Zerho

::: tip TODO INCLUIDO DE SERIE
Tu proyecto ya cuenta con soporte nativo para bloques ejecutables TypeScript, diagramas Mermaid y explorador OpenAPI sin configurar plugins externos.
:::

\`\`\`ts run [hola.ts]
const saludo: string = "¡Hola desde el Sandbox de Zerho en Deno 2!";
console.log(saludo);
\`\`\`
`,
      );
    }

    // 3. Starter zerho.config.ts if not already present
    const configPath = join(baseDir, "zerho.config.ts");
    try {
      await Deno.stat(configPath);
    } catch {
      await Deno.writeTextFile(
        configPath,
        `export default {
  title: "Mi Documentación",
  tagline: "Documentación técnica impulsada por Zerho y Deno 2",
  description: "Sitio estático ultrarrápido con búsqueda instantánea y playground interactivo.",
  lang: "es",
  siteUrl: "https://example.com",
  themeConfig: {
    nav: [
      { text: "Inicio", link: "/" },
      { text: "Guía", link: "/guide/getting-started", activeMatch: "/guide/" },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Introducción",
          items: [
            { text: "Primeros Pasos", link: "/guide/getting-started" },
          ],
        },
      ],
    },
    socialLinks: [],
    footer: {
      message: "Impulsado por Zerho y Deno 2.",
      copyright: "Copyright © ${new Date().getFullYear()}",
    },
  },
};\n`,
      );
    }

    // 4. Starter deno.json if not already present
    const denoJsonPath = join(baseDir, "deno.json");
    try {
      await Deno.stat(denoJsonPath);
    } catch {
      await Deno.writeTextFile(
        denoJsonPath,
        JSON.stringify(
          {
            tasks: {
              dev: "deno run -A --unstable-kv jsr:@zerho/core/cli dev",
              build: "deno run -A jsr:@zerho/core/cli build",
              serve: "deno run -A --unstable-kv jsr:@zerho/core/cli serve",
            },
          },
          null,
          2,
        ) + "\n",
      );
    }

    console.log("✅ Estructura creada con éxito. Ejecuta 'deno task dev' para comenzar.");
    return;
  }

  if (command === "stats") {
    try {
      const kv = await Deno.openKv();
      console.log("\n📊 \x1b[36m[Zerho Edge Analytics (Deno KV)]\x1b[0m");
      const iter = kv.list({ prefix: ["feedback"] }, { limit: 100 });
      let found = false;
      for await (const entry of iter) {
        found = true;
        console.log(`- ${entry.key.join(" > ")}: \x1b[32m${entry.value}\x1b[0m`);
      }

      const searchesTotal = await kv.get<Deno.KvU64>(["analytics", "searches_total"]);
      if (searchesTotal?.value) {
        found = true;
        console.log(`- Búsquedas totales: \x1b[33m${Number(searchesTotal.value.value)}\x1b[0m`);
      }

      const queryIter = kv.list<Deno.KvU64>({ prefix: ["analytics", "query"] }, { limit: 20 });
      for await (const entry of queryIter) {
        found = true;
        console.log(
          `- Query "${String(entry.key[2])}": \x1b[36m${Number(entry.value.value)}\x1b[0m`,
        );
      }

      if (!found) {
        console.log(
          "No hay métricas registradas aún. Interactúa con el widget de feedback en las páginas de la documentación.",
        );
      }
      kv.close();
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
