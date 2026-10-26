---
title: Despliegue en Deno Deploy
description: Publica tu documentación en la red perimetral de Deno Deploy en menos de 60 segundos.
prev:
  text: Superpoderes Markdown
  link: /guide/markdown-features
next:
  text: Playground TS
  link: /playground/
---

## Despliegue en Deno Deploy

**Deno Deploy** es una plataforma distribuida a nivel global que ejecuta código JavaScript y TypeScript en el Edge, en más de 35 regiones alrededor del mundo.

ZerhoPress está arquitectado específicamente para Deno Deploy: su archivo raíz `main.ts` sirve como servidor HTTP edge nativo y gestor de activos estáticos optimizado con compresión y encabezados de caché inmutables.

---

## Método 1: Integración con GitHub (Recomendado)

1. Sube tu proyecto ZerhoPress a un repositorio de **GitHub**.
2. Ingresa a la consola de [Deno Deploy Dashboard](https://dash.deno.com).
3. Haz clic en **"New Project"** y selecciona tu repositorio.
4. En la configuración del proyecto:
   - **Entrypoint**: `main.ts`
   - **Install step**: Ninguno requerido (Deno descarga automáticamente en caché).
5. Haz clic en **Deploy Project**.

::: tip DESPLIEGUE CONTINUO
Cada vez que hagas `git push` a tu rama principal (`main` o `master`), Deno Deploy generará un nuevo despliegue instantáneo sin tiempo de inactividad.
:::

---

## Método 2: Despliegue mediante CLI (`deployctl`)

Si prefieres desplegar directamente desde tu terminal sin pasar por Git:

```bash [Terminal]
# 1. Instalar la herramienta oficial de Deno Deploy
deno install -A jsr:@deno/deployctl -g

# 2. Desplegar tu proyecto indicando el entrypoint
deployctl deploy --project=mi-documentacion main.ts
```

---

## Rendimiento y Encabezados Edge

El servidor `main.ts` de ZerhoPress aplica automáticamente las mejores prácticas de rendimiento web:

```ts [main.ts]
// Configuración de encabezados automáticos de caché
const isAsset = filePath.startsWith("/assets/");
const cacheControl = isAsset 
  ? "public, max-age=31536000, immutable" 
  : "public, max-age=3600, stale-while-revalidate=86400";
```

- **Activos estáticos (CSS, JS)**: Almacenados en caché inmutable por 1 año (`max-age=31536000`).
- **Páginas HTML**: Cacheadas por 1 hora con revalidación en segundo plano (`stale-while-revalidate=86400`).
- **Cero Cold Starts**: Arranque en el Edge en menos de 5ms.

---

## GitHub Actions Workflow Opcional

Si deseas ejecutar verificaciones de tipos y formateo antes de desplegar:

```yaml [.github/workflows/deploy.yml]
name: Deploy ZerhoPress

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x

      - name: Verificar Tipos y Build
        run: |
          deno check main.ts
          deno task build

      - name: Desplegar en Deno Deploy
        uses: denoland/deployctl@v1
        with:
          project: "tu-proyecto-zerho"
          entrypoint: "main.ts"
```
