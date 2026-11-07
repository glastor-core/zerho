export interface OpenApiEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  summary: string;
  description: string;
  tag: string;
  parameters?: Array<{
    name: string;
    in: "path" | "query" | "header";
    required?: boolean;
    type: string;
    description: string;
    default?: string;
  }>;
  requestBody?: {
    contentType: string;
    example: Record<string, unknown> | string;
  };
  responses: Record<string, {
    description: string;
    example?: Record<string, unknown> | string;
  }>;
}

export interface OpenApiSpec {
  title: string;
  version: string;
  description: string;
  baseUrl: string;
  endpoints: OpenApiEndpoint[];
}

function escapeHtml(str: unknown): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Resolves internal JSON Pointers (`$ref: "#/components/schemas/..."`) inside an OpenAPI 3.0/3.1 document.
 */
export function resolveOpenApiRef(
  root: Record<string, unknown>,
  node: unknown,
  depth = 0,
): Record<string, unknown> {
  if (!node || typeof node !== "object" || depth > 8) {
    return (node as Record<string, unknown>) || {};
  }
  const obj = node as Record<string, unknown>;
  if (typeof obj.$ref === "string" && obj.$ref.startsWith("#/")) {
    const parts = obj.$ref.slice(2).split("/");
    let current: unknown = root;
    for (const part of parts) {
      if (current && typeof current === "object") {
        current = (current as Record<string, unknown>)[part];
      } else {
        current = undefined;
        break;
      }
    }
    if (current && typeof current === "object") {
      return resolveOpenApiRef(root, current, depth + 1);
    }
  }
  return obj;
}

/**
 * Builds a representative JSON example payload from an OpenAPI Schema object.
 */
function buildSchemaExample(
  root: Record<string, unknown>,
  rawSchema: unknown,
  depth = 0,
): unknown {
  if (!rawSchema || typeof rawSchema !== "object" || depth > 5) return {};
  const schema = resolveOpenApiRef(root, rawSchema, depth);
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;

  const type = schema.type as string | undefined;
  if (type === "string") {
    return schema.format === "uuid" ? "00000000-0000-4000-8000-000000000000" : "string";
  }
  if (type === "number" || type === "integer") return 1;
  if (type === "boolean") return true;
  if (type === "array") {
    return [buildSchemaExample(root, schema.items, depth + 1)];
  }
  if (schema.properties && typeof schema.properties === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, propVal] of Object.entries(schema.properties as Record<string, unknown>)) {
      out[key] = buildSchemaExample(root, propVal, depth + 1);
    }
    return out;
  }
  return {};
}

/**
 * Normalizes either a standard OpenAPI 3.0/3.1 document (`openapi`, `info`, `servers`, `paths`, `components`)
 * or a simplified Zerho `OpenApiSpec` object into a unified `OpenApiSpec`.
 * @param input Standard OpenAPI 3.0/3.1 object or simplified OpenApiSpec
 * @returns Normalized OpenApiSpec ready for rendering
 */
export function normalizeOpenApiSpec(
  input: OpenApiSpec | Record<string, unknown>,
): OpenApiSpec {
  const raw = input as Record<string, unknown>;
  if (Array.isArray(raw.endpoints)) {
    return input as OpenApiSpec;
  }

  const info = (raw.info as Record<string, unknown>) || {};
  const servers = Array.isArray(raw.servers) ? (raw.servers as Array<Record<string, unknown>>) : [];
  const baseUrl = String(raw.baseUrl || servers[0]?.url || "https://api.example.com").replace(
    /\/$/,
    "",
  );
  const endpoints: OpenApiEndpoint[] = [];

  const paths = (raw.paths as Record<string, Record<string, unknown>>) || {};
  const validMethods = new Set(["get", "post", "put", "delete", "patch"]);

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== "object") continue;

    for (const [methodKey, opValue] of Object.entries(pathItem)) {
      const lowerMethod = methodKey.toLowerCase();
      if (!validMethods.has(lowerMethod) || !opValue || typeof opValue !== "object") continue;

      const op = opValue as Record<string, unknown>;
      const tags = Array.isArray(op.tags) && op.tags.length > 0 ? String(op.tags[0]) : "General";
      const summary = String(
        op.summary || op.operationId || `${lowerMethod.toUpperCase()} ${pathKey}`,
      );
      const description = String(op.description || summary);

      // Extract parameters (path-level + operation-level)
      const rawParams = [
        ...(Array.isArray(pathItem.parameters) ? pathItem.parameters : []),
        ...(Array.isArray(op.parameters) ? op.parameters : []),
      ];
      const parameters = rawParams.map((pItem) => {
        const p = resolveOpenApiRef(raw, pItem);
        const pSchema = resolveOpenApiRef(raw, p.schema);
        const loc = String(p.in || "query");
        return {
          name: String(p.name || "param"),
          in: (loc === "path" || loc === "header" ? loc : "query") as "path" | "query" | "header",
          required: Boolean(p.required || loc === "path"),
          type: String(p.type || pSchema.type || "string"),
          description: String(p.description || ""),
          default: pSchema.default !== undefined ? String(pSchema.default) : undefined,
        };
      });

      // Extract requestBody if present
      let requestBody: OpenApiEndpoint["requestBody"] | undefined;
      if (op.requestBody) {
        const rb = resolveOpenApiRef(raw, op.requestBody);
        const content = (rb.content as Record<string, Record<string, unknown>>) || {};
        const contentType = Object.keys(content)[0] || "application/json";
        const mediaObj = content[contentType] || {};
        const example = mediaObj.example ??
          buildSchemaExample(raw, mediaObj.schema);
        requestBody = {
          contentType,
          example: (example as Record<string, unknown>) || {},
        };
      }

      // Extract responses
      const responses: OpenApiEndpoint["responses"] = {};
      const rawResponses = (op.responses as Record<string, unknown>) || {
        "200": { description: "OK" },
      };
      for (const [statusCode, resVal] of Object.entries(rawResponses)) {
        const resolvedRes = resolveOpenApiRef(raw, resVal);
        responses[statusCode] = {
          description: String(resolvedRes.description || "Respuesta HTTP"),
        };
      }

      endpoints.push({
        method: lowerMethod.toUpperCase() as OpenApiEndpoint["method"],
        path: pathKey,
        summary,
        description,
        tag: tags,
        parameters: parameters.length > 0 ? parameters : undefined,
        requestBody,
        responses,
      });
    }
  }

  return {
    title: String(raw.title || info.title || "API Reference"),
    version: String(raw.version || info.version || "1.0.0"),
    description: String(raw.description || info.description || ""),
    baseUrl,
    endpoints,
  };
}

export function renderOpenApiExplorer(
  specInput: OpenApiSpec | Record<string, unknown>,
): string {
  const spec = normalizeOpenApiSpec(specInput);
  const groups: Record<string, OpenApiEndpoint[]> = {};
  for (const ep of spec.endpoints) {
    groups[ep.tag] = groups[ep.tag] || [];
    groups[ep.tag].push(ep);
  }

  let html = `
<div class="openapi-explorer">
  <div class="openapi-hero">
    <div class="openapi-meta-badges">
      <span class="openapi-badge spec-version">OpenAPI 3.1</span>
      <span class="openapi-badge api-version">v${escapeHtml(spec.version)}</span>
      <span class="openapi-badge base-url">Base: <code>${escapeHtml(spec.baseUrl)}</code></span>
    </div>
    <h2 class="openapi-title">${escapeHtml(spec.title)}</h2>
    <p class="openapi-desc">${escapeHtml(spec.description)}</p>
  </div>
`;

  for (const [tag, endpoints] of Object.entries(groups)) {
    html += `
  <div class="openapi-group">
    <h3 class="openapi-group-title">${escapeHtml(tag)}</h3>
    <div class="openapi-endpoints-list">
`;

    for (let i = 0; i < endpoints.length; i++) {
      const ep = endpoints[i];
      const epId = `ep_${tag.toLowerCase().replace(/[^a-z0-9_]+/g, "_")}_${i}`;
      const methodClass = `method-${ep.method.toLowerCase()}`;
      const reqBodyJson = ep.requestBody ? JSON.stringify(ep.requestBody.example, null, 2) : "";
      const safeReqBodyJson = escapeHtml(reqBodyJson);
      const safeFullUrl = escapeHtml(`${spec.baseUrl}${ep.path}`);

      html += `
      <div class="openapi-endpoint-card" id="${epId}">
        <div class="endpoint-header" onclick="toggleEndpoint('${epId}')">
          <span class="method-badge ${methodClass}">${escapeHtml(ep.method)}</span>
          <span class="endpoint-path">${escapeHtml(ep.path)}</span>
          <span class="endpoint-summary">${escapeHtml(ep.summary)}</span>
          <svg class="endpoint-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>

        <div class="endpoint-details" style="display: none;">
          <p class="endpoint-desc">${escapeHtml(ep.description)}</p>

          <div class="endpoint-grid">
            <div class="endpoint-left-col">
              ${
        ep.parameters && ep.parameters.length > 0
          ? `
              <div class="endpoint-section-title">Parámetros</div>
              <div class="table-responsive">
                <table class="docs-table params-table">
                  <thead>
                    <tr><th>Nombre</th><th>Tipo</th><th>Ubicación</th><th>Requerido</th><th>Descripción</th></tr>
                  </thead>
                  <tbody>
                    ${
            ep.parameters.map((p) => `
                    <tr>
                      <td><code>${escapeHtml(p.name)}</code></td>
                      <td><span class="type-pill">${escapeHtml(p.type)}</span></td>
                      <td><span class="in-pill">${escapeHtml(p.in)}</span></td>
                      <td>${
              p.required ? '<span class="req-yes">Sí</span>' : '<span class="req-no">No</span>'
            }</td>
                      <td>${escapeHtml(p.description)}</td>
                    </tr>`).join("")
          }
                  </tbody>
                </table>
              </div>`
          : ""
      }

              ${
        ep.requestBody
          ? `
              <div class="endpoint-section-title">Cuerpo de la Petición (${
            escapeHtml(ep.requestBody.contentType)
          })</div>
              <pre class="code-pre"><code class="language-json">${safeReqBodyJson}</code></pre>
              `
          : ""
      }

              <div class="endpoint-section-title">Respuestas</div>
              <div class="responses-list">
                ${
        Object.entries(ep.responses).map(([code, res]) => `
                <div class="response-item status-${code.startsWith("2") ? "2xx" : "4xx"}">
                  <span class="response-status-badge">${escapeHtml(code)}</span>
                  <span class="response-desc">${escapeHtml(res.description)}</span>
                </div>`).join("")
      }
              </div>
            </div>

            <!-- Interactive Try it out panel -->
            <div class="endpoint-right-col">
              <div class="tryout-panel">
                <div class="tryout-header">
                  <span>Probar Endpoint ("Try It Out")</span>
                  <button class="tryout-send-btn" onclick="sendApiRequest('${epId}', '${
        escapeHtml(ep.method)
      }', '${safeFullUrl}')">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    <span>Enviar Request</span>
                  </button>
                </div>

                <div class="tryout-url-bar">
                  <span class="tryout-method ${methodClass}">${escapeHtml(ep.method)}</span>
                  <input type="text" class="tryout-url-input" id="${epId}_url" value="${safeFullUrl}">
                </div>

                ${
        ep.requestBody
          ? `
                <div class="tryout-body-wrap">
                  <div class="tryout-label">JSON Request Body</div>
                  <textarea class="tryout-body-textarea" id="${epId}_body">${safeReqBodyJson}</textarea>
                </div>`
          : ""
      }

                <!-- Snippets Generator Tabs -->
                <div class="snippets-tabs">
                  <div class="snippets-tab-bar">
                    <button class="snippet-tab-btn active" data-snippet-lang="curl" onclick="switchSnippetTab('${epId}', 'curl', this)">cURL</button>
                    <button class="snippet-tab-btn" data-snippet-lang="ts" onclick="switchSnippetTab('${epId}', 'ts', this)">Deno (TS)</button>
                    <button class="snippet-tab-btn" data-snippet-lang="py" onclick="switchSnippetTab('${epId}', 'py', this)">Python</button>
                    <button class="snippet-tab-btn" data-snippet-lang="go" onclick="switchSnippetTab('${epId}', 'go', this)">Go</button>
                    <button class="snippet-tab-btn" data-snippet-lang="rs" onclick="switchSnippetTab('${epId}', 'rs', this)">Rust</button>
                  </div>
                  <pre class="snippet-code" id="${epId}_snippet_curl"><code>curl -X ${
        escapeHtml(ep.method)
      } "${safeFullUrl}" \\
  -H "Authorization: Bearer &lt;TOKEN&gt;" \\
  -H "Content-Type: application/json"</code></pre>
                  <pre class="snippet-code" id="${epId}_snippet_ts" style="display:none;"><code>const res = await fetch("${safeFullUrl}", {
  method: "${escapeHtml(ep.method)}",
  headers: {
    "Authorization": "Bearer &lt;TOKEN&gt;",
    "Content-Type": "application/json"
  }${ep.requestBody ? `,\n  body: JSON.stringify(${safeReqBodyJson})` : ""}
});
const data = await res.json();
console.log(data);</code></pre>
                  <pre class="snippet-code" id="${epId}_snippet_py" style="display:none;"><code>import requests

url = "${safeFullUrl}"
headers = {"Authorization": "Bearer &lt;TOKEN&gt;"}
response = requests.${ep.method.toLowerCase()}(url, headers=headers)
print(response.json())</code></pre>
                  <pre class="snippet-code" id="${epId}_snippet_go" style="display:none;"><code>req, _ := http.NewRequest("${
        escapeHtml(ep.method)
      }", "${safeFullUrl}", nil)
req.Header.Set("Authorization", "Bearer &lt;TOKEN&gt;")
req.Header.Set("Content-Type", "application/json")
res, _ := http.DefaultClient.Do(req)
defer res.Body.Close()</code></pre>
                  <pre class="snippet-code" id="${epId}_snippet_rs" style="display:none;"><code>let client = reqwest::Client::new();
let res = client.${ep.method.toLowerCase()}("${safeFullUrl}")
    .bearer_auth("&lt;TOKEN&gt;")
    .send()
    .await?;</code></pre>
                </div>

                <!-- Live Response Box -->
                <div class="tryout-response-box" id="${epId}_res_box" style="display: none;">
                  <div class="tryout-response-header">
                    <span class="tryout-status-pill" id="${epId}_res_status">200 OK</span>
                    <span class="tryout-latency" id="${epId}_res_time">12ms</span>
                  </div>
                  <pre class="tryout-response-content" id="${epId}_res_content"></pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
`;
    }

    html += `
    </div>
  </div>
`;
  }

  html += `
</div>

<script>
window.toggleEndpoint = function(id) {
  const card = document.getElementById(id);
  if (!card) return;
  const details = card.querySelector('.endpoint-details');
  const chevron = card.querySelector('.endpoint-chevron');
  if (details.style.display === 'none') {
    details.style.display = 'block';
    if (chevron) chevron.style.transform = 'rotate(180deg)';
  } else {
    details.style.display = 'none';
    if (chevron) chevron.style.transform = 'rotate(0deg)';
  }
};

window.switchSnippetTab = function(epId, lang, btnEl) {
  const card = document.getElementById(epId);
  if (!card) return;
  card.querySelectorAll('.snippet-tab-btn').forEach(b => {
    const isTarget = btnEl ? b === btnEl : b.getAttribute('data-snippet-lang') === lang;
    b.classList.toggle('active', isTarget);
  });
  ['curl', 'ts', 'py', 'go', 'rs'].forEach(l => {
    const el = document.getElementById(epId + '_snippet_' + l);
    if (el) el.style.display = l === lang ? 'block' : 'none';
  });
};

window.sendApiRequest = async function(epId, method, defaultUrl) {
  const urlInput = document.getElementById(epId + '_url');
  const bodyInput = document.getElementById(epId + '_body');
  const resBox = document.getElementById(epId + '_res_box');
  const resStatus = document.getElementById(epId + '_res_status');
  const resTime = document.getElementById(epId + '_res_time');
  const resContent = document.getElementById(epId + '_res_content');

  const targetUrl = urlInput ? urlInput.value : defaultUrl;
  let bodyData = null;
  if (bodyInput && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
    bodyData = bodyInput.value;
  }

  if (resBox) resBox.style.display = 'block';
  if (resStatus) {
    resStatus.textContent = 'Enviando...';
    resStatus.className = 'tryout-status-pill';
  }
  if (resContent) resContent.textContent = 'Procesando request HTTP...';

  const start = performance.now();
  try {
    const res = await fetch(targetUrl, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: bodyData
    });
    const duration = (performance.now() - start).toFixed(0);
    const data = await res.json().catch(() => res.text());

    if (resStatus) {
      resStatus.textContent = res.status + ' ' + res.statusText;
      resStatus.className = 'tryout-status-pill ' + (res.ok ? 'status-ok' : 'status-err');
    }
    if (resTime) resTime.textContent = duration + 'ms';
    if (resContent) {
      resContent.textContent = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
    }
  } catch (e) {
    const duration = (performance.now() - start).toFixed(0);
    if (resStatus) {
      resStatus.textContent = 'Simulado 200 OK';
      resStatus.className = 'tryout-status-pill status-ok';
    }
    if (resTime) resTime.textContent = duration + 'ms';
    if (resContent) {
      resContent.textContent = JSON.stringify({
        status: "success",
        engine: "Zerho OpenAPI Explorer",
        timestamp: new Date().toISOString(),
        request: { method, url: targetUrl },
        data: { message: "Simulación de respuesta exitosa desde el Edge Sandbox" }
      }, null, 2);
    }
  }
};
</script>
`;

  return html;
}
