---
title: Playground Interactivo Deno
description: Entorno de ejecución TypeScript y JavaScript en vivo impulsado por el sandbox de ZerhoPress.
prev:
  text: Despliegue en Deno Deploy
  link: /guide/deployment
next:
  text: Referencia de API
  link: /api/runtime
---

## Entorno de Ejecución en Vivo

Este playground te permite experimentar con código **TypeScript** y simular APIs clave de **Deno 2** directamente en el navegador.

- **Sandbox aislado**: Tu código se ejecuta de manera segura en un hilo independiente sin bloquear la interfaz.
- **APIs simuladas**: Soporta `Deno.version`, `Deno.env.get()`, `Deno.readTextFile()`, `crypto.subtle` y flujos `ReadableStream`.
- **Atajo de teclado**: Presiona <kbd>Ctrl</kbd> + <kbd>Enter</kbd> (o <kbd>⌘</kbd> + <kbd>Enter</kbd> en Mac) para ejecutar.

<div class="playground-workspace">
<div class="playground-toolbar">
<div style="display:flex; align-items:center; gap:0.75rem;">
<span style="font-weight:700; font-size:0.85rem; color:var(--text-primary);">Ejemplos Preconfigurados:</span>
<select id="pgPresetSelect" class="playground-select-preset">
<option value="server">⚡ Deno.serve (Servidor HTTP Edge)</option>
<option value="crypto">🔒 WebCrypto (SHA-256 Digest)</option>
<option value="streams">🌊 Streams Asíncronos</option>
<option value="vfs">📂 Sistema de Archivos Virtual (VFS)</option>
</select>
</div>
<div style="display:flex; align-items:center; gap:0.6rem;">
<button id="pgRunBtn" class="run-execute-btn" style="padding:0.45rem 1rem; font-size:0.88rem;">
<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
<span>Ejecutar Código</span>
</button>
</div>
</div>
<div class="playground-split">
<div class="playground-editor-pane">
<div class="playground-pane-title">
<span>Editor VS Code / Monaco (TypeScript)</span>
<span style="font-size:0.7rem; color:var(--brand-primary); font-weight:700;">IntelliSense Activo</span>
</div>
<div id="pgMonacoEditor" class="playground-monaco-container"></div>
<textarea id="pgCodeInput" class="playground-textarea" style="display:none;" spellcheck="false" placeholder="Escribe tu código TypeScript aquí..."></textarea>
</div>
<div class="playground-output-pane">
<div class="playground-pane-title">
<span>Terminal de Salida</span>
<span id="pgStatus" class="console-status">Listo</span>
</div>
<div id="pgOutput" class="playground-output-content">// Haz clic en 'Ejecutar Código' o presiona Ctrl+Enter...</div>
</div>
</div>
</div>

---

## Capacidades del Sandbox

::: tip WEB WORKERS Y TIPADO DINÁMICO
El sandbox de ZerhoPress remueve automáticamente las anotaciones de tipo de TypeScript para ejecutar el código resultante en el motor V8 nativo de tu navegador, garantizando un rendimiento casi instantáneo (menos de 5ms de latencia).
:::

### APIs Soportadas en el Sandbox

| API | Estado | Descripción |
| :--- | :---: | :--- |
| `Deno.version` | ✅ Activa | Retorna versiones de Deno, V8 y TypeScript. |
| `Deno.env.get(key)` | ✅ Activa | Simula acceso a variables de entorno (`DENO_ENV`, `REGION`, `PORT`). |
| `Deno.readTextFile(path)` | ✅ Activa | Lectura de archivos virtuales en memoria (`deno.json`, `README.md`). |
| `Deno.serve(handler)` | ✅ Activa | Simula peticiones HTTP entrantes y salida formateada. |
| `crypto.subtle` | ✅ Nativa | Acceso a WebCrypto nativo del navegador para hashing y cifrado. |
| `ReadableStream` | ✅ Nativa | Creación y lectura de flujos asíncronos. |
