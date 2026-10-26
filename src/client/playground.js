// ZerhoPress Live Sandbox & Playground Engine
(function () {
  // Simulated Deno environment inside browser
  function createDenoEnvironment(logs) {
    return {
      version: {
        deno: "2.9.7",
        v8: "15.0.245.2",
        typescript: "6.0.3",
      },
      env: {
        get: (key) => {
          const mockEnv = {
            DENO_ENV: "production",
            REGION: "deno-deploy-sao-1",
            PORT: "8000",
          };
          return mockEnv[key] || undefined;
        },
      },
      readTextFile: (path) => {
        const vfs = {
          "deno.json": JSON.stringify({ name: "zerhopress", version: "1.0.0" }, null, 2),
          "README.md": "# Bienvenido a ZerhoPress\nEl motor pro de documentación para Deno.",
        };
        if (vfs[path]) return Promise.resolve(vfs[path]);
        return Promise.reject(new Error(`NotFound: No such file or directory: ${path}`));
      },
      serve: (handler) => {
        logs.push(`[Deno.serve] Servidor HTTP escuchando en http://localhost:8000/`);
        try {
          const dummyReq = new Request("http://localhost:8000/api/status");
          const res = handler(dummyReq);
          if (res instanceof Promise) {
            res.then((r) => logs.push(`[Deno.serve] Request respondido con status ${r.status}`));
          } else {
            logs.push(`[Deno.serve] Request respondido con status ${res.status}`);
          }
        } catch (e) {
          logs.push(`[Deno.serve] Error: ${e.message}`);
        }
      },
    };
  }

  // Lightweight TypeScript type-stripper for direct client execution
  function transpileTS(code) {
    // Strip type assertions and basic interfaces/type aliases
    return code
      .replace(/^import\s+.*?;?\s*$/gm, (m) => `// ${m}`) // comment imports for sandbox
      .replace(/^export\s+default\s+/gm, "")
      .replace(/^export\s+/gm, "")
      .replace(
        /:\s*(string|number|boolean|any|void|unknown|never|Record<[^>]+>|Array<[^>]+>|[\w]+\[\])\b/g,
        "",
      )
      .replace(/as\s+[A-Za-z0-9_<>[\]]+/g, "")
      .replace(/interface\s+\w+\s*\{[^}]*\}/g, "")
      .replace(/type\s+\w+\s*=\s*[^;]+;/g, "");
  }

  // Execution worker / eval sandbox
  async function runCodeInSandbox(code) {
    const logs = [];
    const customConsole = {
      log: (...args) => logs.push(args.map(formatArg).join(" ")),
      info: (...args) => logs.push("[INFO] " + args.map(formatArg).join(" ")),
      warn: (...args) => logs.push("[WARN] " + args.map(formatArg).join(" ")),
      error: (...args) => logs.push("[ERROR] " + args.map(formatArg).join(" ")),
    };

    function formatArg(arg) {
      if (typeof arg === "object" && arg !== null) {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }

    const Deno = createDenoEnvironment(logs);
    const cleanedCode = transpileTS(code);

    const startTime = performance.now();
    let result = undefined;
    let hasError = false;

    try {
      const asyncFn = new Function(
        "Deno",
        "console",
        `
        return (async () => {
          ${cleanedCode}
        })();
      `,
      );
      result = await asyncFn(Deno, customConsole);
    } catch (err) {
      hasError = true;
      logs.push(`RuntimeError: ${err.message}`);
    }

    const duration = (performance.now() - startTime).toFixed(1);

    if (result !== undefined && logs.length === 0) {
      logs.push(formatArg(result));
    }

    return {
      output: logs.join("\n"),
      durationMs: duration,
      success: !hasError,
    };
  }

  // Inline Snippet Execution (for docs)
  window.executeSnippet = async function (cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;

    const encodedCode = card.getAttribute("data-code");
    const code = decodeURIComponent(encodedCode);

    const consoleBox = document.getElementById(`${cardId}_console`);
    const outputEl = document.getElementById(`${cardId}_output`);
    const statusEl = document.getElementById(`${cardId}_status`);

    if (consoleBox) consoleBox.style.display = "block";
    if (statusEl) {
      statusEl.textContent = "Ejecutando...";
      statusEl.style.color = "var(--brand-primary)";
    }
    if (outputEl) outputEl.textContent = "Ejecutando en sandbox de Deno 2...";

    const res = await runCodeInSandbox(code);

    if (statusEl) {
      statusEl.textContent = res.success
        ? `Éxito (${res.durationMs}ms)`
        : `Error (${res.durationMs}ms)`;
      statusEl.style.color = res.success ? "var(--emerald-accent)" : "var(--rose-accent)";
    }
    if (outputEl) {
      outputEl.textContent = res.output || "(El código se ejecutó sin salida de consola)";
      outputEl.style.color = res.success ? "#38bdf8" : "#fb7185";
    }
  };

  // Copy Snippet Code
  window.copySnippet = function (cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    const code = decodeURIComponent(card.getAttribute("data-code"));
    navigator.clipboard.writeText(code).then(() => {
      alert("¡Código copiado al portapapeles!");
    });
  };

  // Dedicated Playground Page
  window.initPlaygroundPage = function () {
    const textarea = document.getElementById("pgCodeInput");
    const outputEl = document.getElementById("pgOutput");
    const statusEl = document.getElementById("pgStatus");
    const runBtn = document.getElementById("pgRunBtn");
    const presetSelect = document.getElementById("pgPresetSelect");

    if (!textarea || !outputEl || !runBtn) return;

    const PRESETS = {
      server: `// Simulación de Deno.serve en el Edge
Deno.serve((req) => {
  const url = new URL(req.url);
  console.log("Incoming request path:", url.pathname);

  return new Response(JSON.stringify({
    server: "ZerhoPress Deno Server",
    denoVersion: Deno.version.deno,
    timestamp: new Date().toISOString(),
    status: 200
  }), {
    headers: { "content-type": "application/json" }
  });
});`,

      crypto: `// Criptografía moderna con WebCrypto nativo en Deno
const message = "ZerhoPress Pro Docs Engine";
const encoder = new TextEncoder();
const data = encoder.encode(message);

const hashBuffer = await crypto.subtle.digest("SHA-256", data);
const hashArray = Array.from(new Uint8Array(hashBuffer));
const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

console.log("Texto original:", message);
console.log("SHA-256 Digest:", hashHex);`,

      streams: `// Procesamiento de Flujos (Streams) asíncronos
const words = ["Deno", "Deploy", "TypeScript", "ZerhoPress", "Ultra-Fast"];

const stream = new ReadableStream({
  start(controller) {
    for (const w of words) {
      controller.enqueue(w.toUpperCase());
    }
    controller.close();
  }
});

const reader = stream.getReader();
console.log("Iniciando lectura de stream...");

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log("Chunk recibido:", value);
}
console.log("Stream completado con éxito.");`,

      vfs: `// Lectura de archivos virtuales en Deno
try {
  const config = await Deno.readTextFile("deno.json");
  console.log("Contenido de deno.json:");
  console.log(config);

  const readme = await Deno.readTextFile("README.md");
  console.log("\\nContenido de README.md:");
  console.log(readme);
} catch (e) {
  console.error(e.message);
}`,
    };

    const monacoContainer = document.getElementById("pgMonacoEditor");
    const initialCode = PRESETS.server;

    // Load Monaco Editor dynamically
    if (monacoContainer) {
      if (window.monaco) {
        setupMonaco();
      } else {
        const script = document.createElement("script");
        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js";
        script.onload = () => {
          // @ts-ignore: Monaco AMD require loader
          if (window.require) {
            // @ts-ignore: Monaco AMD require config
            window.require.config({
              paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs" },
            });
            // @ts-ignore: Monaco AMD require load
            window.require(["vs/editor/editor.main"], () => {
              setupMonaco();
            });
          }
        };
        script.onerror = () => {
          if (textarea) textarea.style.display = "block";
          if (monacoContainer) monacoContainer.style.display = "none";
        };
        document.head.appendChild(script);
      }
    }

    function setupMonaco() {
      if (!monacoContainer) return;
      monacoContainer.innerHTML = "";
      const isDark = document.documentElement.getAttribute("data-theme") !== "light";
      // @ts-ignore: Monaco Editor global from CDN
      window.monacoEditor = monaco.editor.create(monacoContainer, {
        value: initialCode,
        language: "typescript",
        theme: isDark ? "vs-dark" : "vs",
        automaticLayout: true,
        fontSize: 13.5,
        fontFamily: "'JetBrains Mono', Consolas, monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        lineNumbers: "on",
        renderLineHighlight: "all",
        padding: { top: 12, bottom: 12 },
      });

      // @ts-ignore: Monaco KeyMod and KeyCode globals
      window.monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        execute();
      });

      // Observe theme changes to adjust Monaco theme
      const observer = new MutationObserver(() => {
        const dark = document.documentElement.getAttribute("data-theme") !== "light";
        // @ts-ignore: Monaco Editor theme API
        if (window.monaco) monaco.editor.setTheme(dark ? "vs-dark" : "vs");
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });

      // Run initial execution after Monaco is ready
      setTimeout(() => execute(), 250);
    }

    async function execute() {
      // @ts-ignore: Monaco Editor getValue API
      const code = window.monacoEditor ? window.monacoEditor.getValue() : textarea.value;
      statusEl.textContent = "Ejecutando...";
      statusEl.style.color = "var(--brand-primary)";
      outputEl.textContent = "Procesando...";

      const res = await runCodeInSandbox(code);

      statusEl.textContent = res.success
        ? `Completado (${res.durationMs}ms)`
        : `Error (${res.durationMs}ms)`;
      statusEl.style.color = res.success ? "var(--emerald-accent)" : "var(--rose-accent)";
      outputEl.textContent = res.output || "(Ejecutado sin mensajes de consola)";
      outputEl.style.color = res.success ? "#38bdf8" : "#fb7185";
    }

    runBtn.addEventListener("click", execute);

    // Ctrl+Enter or Cmd+Enter to execute on fallback textarea
    textarea.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        execute();
      }
    });

    if (presetSelect) {
      presetSelect.addEventListener("change", (e) => {
        const val = e.target.value;
        if (PRESETS[val]) {
          // @ts-ignore: Monaco Editor is loaded dynamically from CDN
          if (window.monacoEditor) {
            // @ts-ignore: Monaco Editor API setValue
            window.monacoEditor.setValue(PRESETS[val]);
          } else {
            textarea.value = PRESETS[val];
          }
          execute();
        }
      });
      // Initial value
      textarea.value = PRESETS.server;
      execute();
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("pgCodeInput") || document.getElementById("pgMonacoEditor")) {
      window.initPlaygroundPage();
    }
  });
})();
