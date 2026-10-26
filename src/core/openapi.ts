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

export function renderOpenApiExplorer(spec: OpenApiSpec): string {
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
      <span class="openapi-badge api-version">v${spec.version}</span>
      <span class="openapi-badge base-url">Base: <code>${spec.baseUrl}</code></span>
    </div>
    <h2 class="openapi-title">${spec.title}</h2>
    <p class="openapi-desc">${spec.description}</p>
  </div>
`;

  for (const [tag, endpoints] of Object.entries(groups)) {
    html += `
  <div class="openapi-group">
    <h3 class="openapi-group-title">${tag}</h3>
    <div class="openapi-endpoints-list">
`;

    for (let i = 0; i < endpoints.length; i++) {
      const ep = endpoints[i];
      const epId = `ep_${tag.toLowerCase().replace(/\s+/g, "_")}_${i}`;
      const methodClass = `method-${ep.method.toLowerCase()}`;
      const reqBodyJson = ep.requestBody ? JSON.stringify(ep.requestBody.example, null, 2) : "";

      html += `
      <div class="openapi-endpoint-card" id="${epId}">
        <div class="endpoint-header" onclick="toggleEndpoint('${epId}')">
          <span class="method-badge ${methodClass}">${ep.method}</span>
          <span class="endpoint-path">${ep.path}</span>
          <span class="endpoint-summary">${ep.summary}</span>
          <svg class="endpoint-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>

        <div class="endpoint-details" style="display: none;">
          <p class="endpoint-desc">${ep.description}</p>

          <div class="endpoint-grid">
            <div class="endpoint-left-col">
              ${ep.parameters && ep.parameters.length > 0 ? `
              <div class="endpoint-section-title">Parámetros</div>
              <div class="table-responsive">
                <table class="docs-table params-table">
                  <thead>
                    <tr><th>Nombre</th><th>Tipo</th><th>Ubicación</th><th>Requerido</th><th>Descripción</th></tr>
                  </thead>
                  <tbody>
                    ${ep.parameters.map(p => `
                    <tr>
                      <td><code>${p.name}</code></td>
                      <td><span class="type-pill">${p.type}</span></td>
                      <td><span class="in-pill">${p.in}</span></td>
                      <td>${p.required ? '<span class="req-yes">Sí</span>' : '<span class="req-no">No</span>'}</td>
                      <td>${p.description}</td>
                    </tr>`).join("")}
                  </tbody>
                </table>
              </div>` : ""}

              ${ep.requestBody ? `
              <div class="endpoint-section-title">Cuerpo de la Petición (${ep.requestBody.contentType})</div>
              <pre class="code-pre"><code class="language-json">${reqBodyJson}</code></pre>
              ` : ""}

              <div class="endpoint-section-title">Respuestas</div>
              <div class="responses-list">
                ${Object.entries(ep.responses).map(([code, res]) => `
                <div class="response-item status-${code.startsWith('2') ? '2xx' : '4xx'}">
                  <span class="response-status-badge">${code}</span>
                  <span class="response-desc">${res.description}</span>
                </div>`).join("")}
              </div>
            </div>

            <!-- Interactive Try it out panel -->
            <div class="endpoint-right-col">
              <div class="tryout-panel">
                <div class="tryout-header">
                  <span>Probar Endpoint ("Try It Out")</span>
                  <button class="tryout-send-btn" onclick="sendApiRequest('${epId}', '${ep.method}', '${spec.baseUrl}${ep.path}')">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    <span>Enviar Request</span>
                  </button>
                </div>

                <div class="tryout-url-bar">
                  <span class="tryout-method ${methodClass}">${ep.method}</span>
                  <input type="text" class="tryout-url-input" id="${epId}_url" value="${spec.baseUrl}${ep.path}">
                </div>

                ${ep.requestBody ? `
                <div class="tryout-body-wrap">
                  <div class="tryout-label">JSON Request Body</div>
                  <textarea class="tryout-body-textarea" id="${epId}_body">${reqBodyJson}</textarea>
                </div>` : ""}

                <!-- Snippets Generator Tabs -->
                <div class="snippets-tabs">
                  <div class="snippets-tab-bar">
                    <button class="snippet-tab-btn active" onclick="switchSnippetTab('${epId}', 'curl')">cURL</button>
                    <button class="snippet-tab-btn" onclick="switchSnippetTab('${epId}', 'ts')">Deno (TS)</button>
                    <button class="snippet-tab-btn" onclick="switchSnippetTab('${epId}', 'py')">Python</button>
                  </div>
                  <pre class="snippet-code" id="${epId}_snippet_curl"><code>curl -X ${ep.method} "${spec.baseUrl}${ep.path}" \\
  -H "Authorization: Bearer &lt;TOKEN&gt;" \\
  -H "Content-Type: application/json"</code></pre>
                  <pre class="snippet-code" id="${epId}_snippet_ts" style="display:none;"><code>const res = await fetch("${spec.baseUrl}${ep.path}", {
  method: "${ep.method}",
  headers: {
    "Authorization": "Bearer <TOKEN>",
    "Content-Type": "application/json"
  }${ep.requestBody ? `,\n  body: JSON.stringify(${reqBodyJson})` : ""}
});
const data = await res.json();
console.log(data);</code></pre>
                  <pre class="snippet-code" id="${epId}_snippet_py" style="display:none;"><code>import requests

url = "${spec.baseUrl}${ep.path}"
headers = {"Authorization": "Bearer <TOKEN>"}
response = requests.${ep.method.toLowerCase()}(url, headers=headers)
print(response.json())</code></pre>
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

window.switchSnippetTab = function(epId, lang) {
  const card = document.getElementById(epId);
  if (!card) return;
  card.querySelectorAll('.snippet-tab-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  ['curl', 'ts', 'py'].forEach(l => {
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
  if (bodyInput && (method === 'POST' || method === 'PUT')) {
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
        engine: "ZerhoPress OpenAPI Explorer",
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
