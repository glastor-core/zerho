// Zerho Deno Doc Generator (Auto-API Reference from TypeScript source code)
// Uses native `deno doc --json` to generate comprehensive Markdown documentation.

export interface DocgenOptions {
  entrypoints: string[];
  title?: string;
  description?: string;
}

interface DenoDocLocation {
  filename: string;
  line: number;
  col: number;
}

interface DenoDocParam {
  kind: string;
  name?: string;
  optional?: boolean;
  tsType?: unknown;
  left?: {
    kind?: string;
    name?: string;
    optional?: boolean;
    tsType?: unknown;
  };
  right?: string;
  arg?: {
    name?: string;
    tsType?: unknown;
  };
}

interface DenoDocMethod {
  name: string;
  isStatic?: boolean;
  functionDef?: {
    params?: DenoDocParam[];
    returnType?: { repr?: string };
  };
  jsDoc?: {
    doc?: string;
    tags?: Array<{ kind: string; name?: string; doc?: string }>;
  };
}

interface DenoDocProperty {
  name: string;
  accessibility?: string;
  optional?: boolean;
  tsType?: unknown;
  jsDoc?: { doc?: string };
}

interface DenoDocDeclaration {
  kind: "function" | "class" | "interface" | "typeAlias" | "variable" | "enum";
  declarationKind: string;
  location: DenoDocLocation;
  jsDoc?: {
    doc?: string;
    tags?: Array<{ kind: string; name?: string; doc?: string }>;
  };
  def?: {
    properties?: DenoDocProperty[];
    methods?: DenoDocMethod[];
    params?: DenoDocParam[];
    returnType?: { repr?: string };
    typeParams?: Array<{ name: string }>;
    tsType?: unknown;
  };
}

interface DenoDocSymbol {
  name: string;
  declarations: DenoDocDeclaration[];
}

/** Formats complex AST Deno Doc type nodes into readable TypeScript string representations */
export function formatTsType(t: unknown): string {
  if (!t || typeof t !== "object") return "any";
  const typeObj = t as Record<string, unknown>;

  if (typeObj.kind === "array" && typeObj.value) {
    return `${formatTsType(typeObj.value)}[]`;
  }

  if (typeObj.kind === "union" && Array.isArray(typeObj.value)) {
    return typeObj.value.map(formatTsType).join(" | ");
  }

  if (typeObj.kind === "typeRef") {
    const val = typeObj.value as { typeName?: string; typeParams?: unknown[] } | undefined;
    const typeName = (typeObj.repr as string) || val?.typeName || "unknown";
    if (val?.typeParams && val.typeParams.length > 0) {
      return `${typeName}<${val.typeParams.map(formatTsType).join(", ")}>`;
    }
    return typeName;
  }

  if (typeObj.kind === "literal") {
    if (typeObj.repr) return typeObj.repr as string;
    const val = typeObj.value as { kind?: string; string?: string } | undefined;
    if (val?.kind === "string" && typeof val.string === "string") {
      return JSON.stringify(val.string);
    }
    return String(typeObj.value);
  }

  if (typeof typeObj.repr === "string" && typeObj.repr) {
    return typeObj.repr;
  }

  return "any";
}

export interface ExtractedParam {
  name: string;
  type: string;
  optional: boolean;
  defaultVal?: string;
}

/** Extracts normalized parameter metadata handling assignments, defaults, and rest parameters */
export function extractParamInfo(p: DenoDocParam | undefined): ExtractedParam {
  if (!p) return { name: "arg", type: "any", optional: false };

  if (p.kind === "assign" && p.left) {
    const rawType = formatTsType(p.left.tsType);
    let defaultRaw = p.right === "[UNSUPPORTED]" ? "{}" : (p.right || "");
    if (
      rawType === "string" && !defaultRaw.startsWith('"') && !defaultRaw.startsWith("'") &&
      defaultRaw !== "{}"
    ) {
      defaultRaw = JSON.stringify(defaultRaw);
    }
    return {
      name: p.left.name || "arg",
      type: rawType,
      optional: true,
      defaultVal: defaultRaw,
    };
  }

  if (p.kind === "rest") {
    return {
      name: `...${p.arg?.name || "args"}`,
      type: formatTsType(p.arg?.tsType),
      optional: true,
    };
  }

  return {
    name: p.name || "arg",
    type: formatTsType(p.tsType),
    optional: Boolean(p.optional),
  };
}

export async function extractDenoDoc(entrypoint: string): Promise<DenoDocSymbol[]> {
  try {
    const cmd = new Deno.Command("deno", {
      args: ["doc", "--json", entrypoint],
      stdout: "piped",
      stderr: "piped",
    });
    const output = await cmd.output();
    if (!output.success) {
      console.warn(
        `[Docgen] Falló deno doc para ${entrypoint}:`,
        new TextDecoder().decode(output.stderr),
      );
      return [];
    }

    const data = JSON.parse(new TextDecoder().decode(output.stdout));
    if (!data.nodes) return [];

    const symbols: DenoDocSymbol[] = [];
    for (const fileKey of Object.keys(data.nodes)) {
      const moduleNode = data.nodes[fileKey];
      if (moduleNode && Array.isArray(moduleNode.symbols)) {
        symbols.push(...moduleNode.symbols);
      }
    }
    return symbols;
  } catch (err) {
    console.warn(`[Docgen] Error extrayendo docs de ${entrypoint}:`, err);
    return [];
  }
}

export function formatSymbolsToMarkdown(
  symbols: DenoDocSymbol[],
  title = "Referencia de API",
): string {
  const sections: string[] = [];

  sections.push(`---
title: ${title}
description: Referencia técnica generada automáticamente a partir del código fuente mediante deno doc
layout: doc
---

# ${title}

> Esta página de referencia se compila automáticamente analizando las firmas de tipos y comentarios JSDoc con **\`deno doc\`**.

---
`);

  // Table of Contents summary
  sections.push(`## Índice de Símbolos\n`);
  for (const sym of symbols) {
    const decl = sym.declarations[0];
    const kind = decl?.kind || "symbol";
    const slug = sym.name.toLowerCase();
    sections.push(`- [**${sym.name}**](#${slug}) (\`${kind}\`)`);
  }
  sections.push("\n---\n");

  // Detailed symbols documentation
  for (const sym of symbols) {
    const decl = sym.declarations[0];
    if (!decl) continue;

    const kind = decl.kind;
    const docText = decl.jsDoc?.doc || "Sin descripción JSDoc proporcionada.";

    // Parse JSDoc tags (@param, @returns)
    const paramDocs = new Map<string, string>();
    let returnDoc = "";
    if (decl.jsDoc?.tags) {
      for (const tag of decl.jsDoc.tags) {
        if (tag.kind === "param" && tag.name) {
          paramDocs.set(tag.name, tag.doc || "");
        } else if (tag.kind === "return") {
          returnDoc = tag.doc || "";
        }
      }
    }

    sections.push(`## ${sym.name}`);
    sections.push(
      `**Tipo:** \`${kind}\` | **Ubicación:** \`${
        decl.location.filename.split("/").pop()
      }:${decl.location.line}\`\n`,
    );
    sections.push(`${docText}\n`);

    if (kind === "interface" && decl.def?.properties) {
      sections.push("### Propiedades\n");
      sections.push("| Propiedad | Tipo | Opcional | Descripción |");
      sections.push("| :--- | :--- | :--- | :--- |");
      for (const prop of decl.def.properties) {
        const typeRepr = formatTsType(prop.tsType).replace(/\|/g, "\\|");
        const isOpt = prop.optional ? "Sí" : "No";
        const desc = prop.jsDoc?.doc || "—";
        sections.push(`| \`${prop.name}\` | \`${typeRepr}\` | ${isOpt} | ${desc} |`);
      }
      sections.push("");
    } else if (kind === "class") {
      if (decl.def?.properties && decl.def.properties.length > 0) {
        sections.push("### Propiedades\n");
        sections.push("| Propiedad | Visibilidad | Tipo | Descripción |");
        sections.push("| :--- | :--- | :--- | :--- |");
        for (const prop of decl.def.properties) {
          const access = prop.accessibility || "public";
          const typeRepr = formatTsType(prop.tsType).replace(/\|/g, "\\|");
          const desc = prop.jsDoc?.doc || "—";
          sections.push(`| \`${prop.name}\` | \`${access}\` | \`${typeRepr}\` | ${desc} |`);
        }
        sections.push("");
      }

      if (decl.def?.methods && decl.def.methods.length > 0) {
        sections.push("### Métodos\n");
        for (const method of decl.def.methods) {
          const methodParams = (method.functionDef?.params || []).map(extractParamInfo);
          const sigParams = methodParams
            .map((p) => {
              if (p.defaultVal) return `${p.name} = ${p.defaultVal}`;
              if (p.optional) return `${p.name}?: ${p.type}`;
              return `${p.name}: ${p.type}`;
            })
            .join(", ");
          const retType = formatTsType(method.functionDef?.returnType);
          const methodDesc = method.jsDoc?.doc || "";
          const staticPrefix = method.isStatic ? "static " : "";

          // Parse method param tags
          const methodParamDocs = new Map<string, string>();
          if (method.jsDoc?.tags) {
            for (const tag of method.jsDoc.tags) {
              if (tag.kind === "param" && tag.name) {
                methodParamDocs.set(tag.name, tag.doc || "");
              }
            }
          }

          sections.push(`#### \`${staticPrefix}${method.name}(${sigParams}): ${retType}\`\n`);
          if (methodDesc) sections.push(`${methodDesc}\n`);

          if (methodParams.length > 0) {
            sections.push("| Parámetro | Tipo | Opcional | Defecto | Descripción |");
            sections.push("| :--- | :--- | :--- | :--- | :--- |");
            for (const p of methodParams) {
              const typeRepr = p.type.replace(/\|/g, "\\|");
              const optStr = p.optional ? "Sí" : "No";
              const defStr = p.defaultVal ? `\`${p.defaultVal}\`` : "—";
              const doc = methodParamDocs.get(p.name) || "—";
              sections.push(`| \`${p.name}\` | \`${typeRepr}\` | ${optStr} | ${defStr} | ${doc} |`);
            }
            sections.push("");
          }
        }
      }
    } else if (kind === "function") {
      const params = (decl.def?.params || []).map(extractParamInfo);
      const sigParams = params
        .map((p) => {
          if (p.defaultVal) return `${p.name} = ${p.defaultVal}`;
          if (p.optional) return `${p.name}?: ${p.type}`;
          return `${p.name}: ${p.type}`;
        })
        .join(", ");
      const retType = formatTsType(decl.def?.returnType);

      sections.push("```typescript");
      sections.push(`function ${sym.name}(${sigParams}): ${retType};`);
      sections.push("```\n");

      if (returnDoc) {
        sections.push(`**Retorna:** \`${retType}\` — ${returnDoc}\n`);
      }

      if (params.length > 0) {
        sections.push("### Parámetros\n");
        sections.push("| Parámetro | Tipo | Opcional | Defecto | Descripción |");
        sections.push("| :--- | :--- | :--- | :--- | :--- |");
        for (const p of params) {
          const typeRepr = p.type.replace(/\|/g, "\\|");
          const optStr = p.optional ? "Sí" : "No";
          const defStr = p.defaultVal ? `\`${p.defaultVal}\`` : "—";
          const doc = paramDocs.get(p.name) || "—";
          sections.push(`| \`${p.name}\` | \`${typeRepr}\` | ${optStr} | ${defStr} | ${doc} |`);
        }
        sections.push("");
      }
    }

    sections.push("---\n");
  }

  return sections.join("\n");
}

export async function generateApiDocs(options: DocgenOptions): Promise<string> {
  const allSymbols: DenoDocSymbol[] = [];
  for (const ep of options.entrypoints) {
    const syms = await extractDenoDoc(ep);
    allSymbols.push(...syms);
  }
  return formatSymbolsToMarkdown(allSymbols, options.title || "Referencia de API");
}
