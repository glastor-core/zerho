---
title: Deployment on Deno Deploy
description: Publish your documentation to the global edge network of Deno Deploy in under 60 seconds.
prev:
  text: Markdown Superpowers
  link: /en/guide/markdown-features
next:
  text: TS Playground
  link: /playground/
---

# Deploying on Deno Deploy

**Deno Deploy** is a globally distributed platform that runs modern JavaScript and TypeScript at the
Edge across 35+ regions worldwide.

Zerho is architected specifically for Deno Deploy: its entrypoint `main.ts` acts as an edge HTTP
server, serving pre-rendered static assets with immutable cache headers and integrated Deno KV
analytics.

---

## Method 1: GitHub Automatic Integration (Recommended)

1. Push your Zerho project to a **GitHub** repository.
2. Sign in to the [Deno Deploy Dashboard](https://dash.deno.com).
3. Click **"New Project"** and select your repository.
4. Configure the deployment settings:
   - **Entrypoint**: `main.ts`
   - **Build command**: `deno task build`
5. Click **Deploy Project**.

::: tip CONTINUOUS DEPLOYMENT Every time you run `git push` to your default branch (`main`), Deno
Deploy triggers an instantaneous zero-downtime deployment. :::

---

## Method 2: Command Line Deployment (`deployctl`)

If you prefer to deploy directly from your local terminal without Git commits:

```bash [Terminal]
# 1. Install or update the official deployctl tool from JSR
deno install -A jsr:@deno/deployctl -g

# 2. Deploy your project specifying the entrypoint
deployctl deploy --project=my-docs main.ts
```

---

## Edge Caching and Performance

Zerho's `main.ts` automatically applies web performance best practices:

- **Static Assets (CSS, JS)**: Cached with immutable headers
  (`cache-control: no-cache, must-revalidate` in dev, or `max-age=31536000, immutable` in
  production).
- **HTML Pages**: Fast edge delivery with near-zero cold starts (< 5ms).
- **Integrated Deno KV**: Ingests page feedback and search telemetry directly at the edge without
  third-party trackers.
