import { assertStringIncludes } from "@std/assert";
import { type OpenApiSpec, renderOpenApiExplorer } from "../src/core/openapi.ts";

const sampleSpec: OpenApiSpec = {
  title: "API de Telemetría Deno",
  version: "1.5.0",
  description: "API de prueba para validación de contratos",
  baseUrl: "https://api.deno.dev",
  endpoints: [
    {
      method: "GET",
      path: "/v1/metrics",
      summary: "Obtener métricas del sistema",
      description: "Retorna CPU, memoria y latencia",
      tag: "Monitoreo",
      parameters: [
        {
          name: "interval",
          in: "query",
          required: false,
          type: "string",
          description: "Intervalo de muestreo (1m, 5m, 1h)",
        },
      ],
      responses: {
        "200": { description: "Métricas retornadas con éxito" },
        "500": { description: "Error interno del servidor" },
      },
    },
    {
      method: "POST",
      path: "/v1/alerts",
      summary: "Crear una nueva alerta",
      description: "Registra un webhook para notificación",
      tag: "Alertas",
      requestBody: {
        contentType: "application/json",
        example: { webhook: "https://example.com/hook", threshold: 90 },
      },
      responses: {
        "201": { description: "Alerta creada exitosamente" },
      },
    },
  ],
};

Deno.test("OpenAPI: Render spec header and metadata badges", () => {
  const html = renderOpenApiExplorer(sampleSpec);
  assertStringIncludes(html, "API de Telemetría Deno");
  assertStringIncludes(html, "v1.5.0");
  assertStringIncludes(html, "https://api.deno.dev");
  assertStringIncludes(html, "OpenAPI 3.1");
});

Deno.test("OpenAPI: Render endpoints grouped by tags", () => {
  const html = renderOpenApiExplorer(sampleSpec);
  assertStringIncludes(html, 'class="openapi-group-title">Monitoreo</h3>');
  assertStringIncludes(html, 'class="openapi-group-title">Alertas</h3>');
  assertStringIncludes(html, "/v1/metrics");
  assertStringIncludes(html, "/v1/alerts");
  assertStringIncludes(html, "method-get");
  assertStringIncludes(html, "method-post");
});

Deno.test("OpenAPI: Render parameters table and schema details", () => {
  const html = renderOpenApiExplorer(sampleSpec);
  assertStringIncludes(html, "<code>interval</code>");
  assertStringIncludes(html, "type-pill");
  assertStringIncludes(html, "in-pill");
  assertStringIncludes(html, "Intervalo de muestreo");
});

Deno.test("OpenAPI: Render Try It Out panel and snippet generators", () => {
  const html = renderOpenApiExplorer(sampleSpec);
  assertStringIncludes(html, "Probar Endpoint");
  assertStringIncludes(html, "sendApiRequest");
  assertStringIncludes(html, "switchSnippetTab");
  assertStringIncludes(html, "curl -X GET");
  assertStringIncludes(html, "const res = await fetch");
});

Deno.test("OpenAPI: Sanitize HTML special characters against XSS", () => {
  const maliciousSpec: OpenApiSpec = {
    ...sampleSpec,
    title: 'API <script>alert("xss")</script>',
  };
  const html = renderOpenApiExplorer(maliciousSpec);
  assertStringIncludes(html, "API &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;");
});

Deno.test("OpenAPI 3.1 Official Spec: Parses standard paths, servers, and $ref schemas", () => {
  const officialSpec = {
    openapi: "3.1.0",
    info: {
      title: "Payments Standard API",
      version: "3.1.0",
      description: "Official OpenAPI 3.1 format with paths and components",
    },
    servers: [{ url: "https://api.payments.io/v3" }],
    components: {
      schemas: {
        ChargeInput: {
          type: "object",
          properties: {
            amount: { type: "number", example: 4999 },
            currency: { type: "string", example: "USD" },
          },
        },
      },
    },
    paths: {
      "/charges": {
        post: {
          tags: ["Billing"],
          summary: "Create a charge",
          description: "Charges a customer card",
          parameters: [
            {
              name: "Idempotency-Key",
              in: "header",
              required: true,
              schema: { type: "string" },
              description: "Unique key",
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ChargeInput" },
              },
            },
          },
          responses: {
            "201": { description: "Charge created" },
          },
        },
      },
    },
  };

  const html = renderOpenApiExplorer(officialSpec);
  assertStringIncludes(html, "Payments Standard API");
  assertStringIncludes(html, "https://api.payments.io/v3");
  assertStringIncludes(html, "/charges");
  assertStringIncludes(html, "Idempotency-Key");
  assertStringIncludes(html, "4999");
  assertStringIncludes(html, "USD");
});
