---
title: Explorador OpenAPI Interactivo
description: Referencia de API interactiva tipo Mintlify con ejecutor de peticiones en vivo ("Try It Out") y generador de snippets.
prev:
  text: Referencia de Runtime Deno 2
  link: /api/runtime
next:
  text: Playground TS
  link: /playground/
---

## Explorador de Endpoints REST en Vivo

Esta sección demuestra el motor de documentación de APIs de **ZerhoPress**. Puedes expandir cualquier endpoint, consultar los parámetros y esquemas JSON, generar snippets en **cURL, TypeScript o Python**, y presionar **"Enviar Request"** para probar la API en tiempo real.

<div id="openapi-container">
  <!-- El contenido interactivo es inyectado por el renderizador de OpenAPI -->
</div>

<script type="module">
import { renderOpenApiExplorer } from "/assets/openapi-client.js";

const spec = {
  title: "Deno Deploy Edge Services API",
  version: "2.1.0",
  description: "API global para inspección de despliegues, métricas perimetrales y estado de dominios en ZerhoPress.",
  baseUrl: "https://api.deno.com/v1",
  endpoints: [
    {
      method: "GET",
      path: "/status",
      summary: "Estado global del Edge Runtime",
      description: "Retorna el estado operativo de las 35 regiones mundiales de Deno Deploy y latencias promedio.",
      tag: "Infraestructura",
      parameters: [
        { name: "region", in: "query", type: "string", description: "Filtro por código de región (ej: sao-1, fra-1, iad-1)", default: "sao-1" }
      ],
      responses: {
        "200": { description: "Estado operativo normal con telemetría de latencia." },
        "500": { description: "Error interno del servicio." }
      }
    },
    {
      method: "POST",
      path: "/deployments",
      summary: "Crear nuevo despliegue instantáneo",
      description: "Envía un manifiesto de compilación para desplegar una nueva versión en el Edge en menos de 200ms.",
      tag: "Despliegues",
      parameters: [
        { name: "Authorization", in: "header", required: true, type: "string", description: "Token Bearer de autenticación Deno" }
      ],
      requestBody: {
        contentType: "application/json",
        example: {
          project: "zerho-docs",
          entrypoint: "main.ts",
          envVars: {
            "DENO_ENV": "production"
          }
        }
      },
      responses: {
        "201": { description: "Despliegue creado e inicializado en todas las regiones." },
        "400": { description: "Esquema de solicitud inválido." },
        "401": { description: "Token de autorización inválido o expirado." }
      }
    },
    {
      method: "DELETE",
      path: "/deployments/{deploymentId}",
      summary: "Eliminar o archivar un despliegue",
      description: "Invalida las cachés perimetrales y remueve el despliegue indicado.",
      tag: "Despliegues",
      parameters: [
        { name: "deploymentId", in: "path", required: true, type: "string", description: "Identificador único del despliegue (UUID)" }
      ],
      responses: {
        "204": { description: "Despliegue eliminado exitosamente." },
        "404": { description: "El despliegue indicado no existe." }
      }
    }
  ]
};

const container = document.getElementById("openapi-container");
if (container) {
  container.innerHTML = renderOpenApiExplorer(spec);
}
</script>
