# ⚡ ZerhoPress

<p align="center">
  <strong>El motor de documentación técnica de nivel pro diseñado nativamente para Deno 2 y Deno Deploy.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Deno-2.x-000000?style=for-the-badge&logo=deno&logoColor=white" alt="Deno 2" />
  <img src="https://img.shields.io/badge/Deno_Deploy-Ready-06b6d4?style=for-the-badge&logo=deno&logoColor=white" alt="Deno Deploy" />
  <img src="https://img.shields.io/badge/Build_Time-67ms-10b981?style=for-the-badge" alt="Build Time" />
  <img src="https://img.shields.io/badge/Licencia-MIT-8b5cf6?style=for-the-badge" alt="MIT License" />
</p>

---

## 🚀 ¿Por qué ZerhoPress supera a VitePress en Deno?

| Característica | VitePress Estándar | ZerhoPress Pro en Deno |
| :--- | :---: | :---: |
| **Runtime Base** | Node.js + npm + node_modules (400MB+) | **Deno 2 Nativo (0 node_modules)** |
| **Playground en Vivo** | ❌ Requiere plugins externos complejos | **✅ Sandbox TypeScript / Deno Integrado** |
| **Bloques Ejecutables** | Solo estáticos con copy | **✅ ````ts run```` con salida de consola en vivo** |
| **Despliegue Edge** | Configuración manual de adapters | **✅ 1 Clic en Deno Deploy (`main.ts`)** |
| **Búsqueda Instantánea** | Algolia externo o local básico | **✅ Buscador Cmd+K spotlight indexado** |
| **Diagramas Mermaid** | Plugin extra | **✅ Soporte nativo de serie** |
| **Tiempo de Compilación** | ~2.5 segundos | **~67 milisegundos (7 páginas)** |
| **Estética UI** | Tema default clásico | **Estilo Linear / Vercel con Glassmorphism** |

---

## ⚡ Inicio Rápido

Solo necesitas tener instalado [Deno 2](https://deno.com).

```bash
# 1. Iniciar el servidor local de desarrollo con Live-Reload (WebSocket HMR)
deno task dev

# 2. Compilar el sitio estático para producción (genera dist/)
deno task build

# 3. Servir en modo producción con encabezados de caché Edge
deno task serve
```

---

## 🛠️ Estructura del Proyecto

```
zerho/
├── deno.json               # Configuración oficial de Deno 2 y tareas
├── zerho.config.ts         # Metadatos, navegación, sidebar y enlaces sociales
├── main.ts                 # Servidor Edge nativo para Deno Deploy
├── docs/                   # Contenido en Markdown
│   ├── index.md            # Landing page principal (layout: home)
│   ├── guide/              # Guías (getting-started, configuration, deployment, etc.)
│   ├── playground/         # Entorno de pruebas TypeScript interactivo
│   └── api/                # Referencia de APIs del runtime
├── src/
│   ├── core/
│   │   ├── markdown.ts     # Compilador Markdown con callouts, TOC y snippets ejecutables
│   │   ├── builder.ts      # Generador SSG ultrarrápido (<100ms)
│   │   ├── dev.ts          # Servidor dev con WebSocket HMR
│   │   └── search.ts       # Indexador de búsqueda client-side
│   ├── client/
│   │   ├── theme.css       # Estilos Pro (Modo Oscuro/Luz, Neon Glow, Glass)
│   │   ├── app.js          # Controlador cliente (Theme, ScrollSpy, Cmd+K)
│   │   └── playground.js   # Motor de ejecución en Web Worker simulando Deno
│   └── templates/
│       └── layout.ts       # Plantilla HTML con SEO y OpenGraph
└── dist/                   # Salida estática compilada lista para producción
```

---

## 🌐 Despliegue en Deno Deploy

### Opción 1: Conexión Automática con GitHub
1. Conecta tu repositorio en [dash.deno.com](https://dash.deno.com).
2. Selecciona `main.ts` como entrypoint.
3. ¡Listo! Cada `git push` despliega en más de 35 regiones mundiales con latencia inferior a 10ms.

### Opción 2: Despliegue directo por CLI
```bash
deno install -A jsr:@deno/deployctl -g
deployctl deploy --project=mi-documentacion main.ts
```

---

## 📄 Licencia

MIT License © 2026 ZerhoPress.
