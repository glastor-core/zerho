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
  tsType?: { repr?: string };
}

interface DenoDocMethod {
  name: string;
  isStatic?: boolean;
  functionDef?: {
    params?: DenoDocParam[];
    returnType?: { repr?: string };
  };
  jsDoc?: { doc?: string };
}

interface DenoDocProperty {
  name: string;
  accessibility?: string;
  tsType?: { repr?: string };
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
    tsType?: { repr?: string };
  };
}

interface DenoDocSymbol {
  name: string;
  declarations: DenoDocDeclaration[];
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
  sections.push(`## Índice de Simbolos\n`);
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

    sections.push(`## ${sym.name}`);
    sections.push(
      `**Tipo:** \`${kind}\` | **Ubicación:** \`${
        decl.location.filename.split("/").pop()
      }:${decl.location.line}\`\n`,
    );
    sections.push(`${docText}\n`);

    if (kind === "interface" && decl.def?.properties) {
      sections.push("### Propiedades\n");
      sections.push("| Nombre | Tipo | Descripción |");
      sections.push("| :--- | :--- | :--- |");
      for (const prop of decl.def.properties) {
        const typeRepr = (prop.tsType?.repr || "unknown").replace(/\|/g, "\\|");
        const desc = prop.jsDoc?.doc || "—";
        sections.push(`| \`${prop.name}\` | \`${typeRepr}\` | ${desc} |`);
      }
      sections.push("");
    } else if (kind === "class") {
      if (decl.def?.properties && decl.def.properties.length > 0) {
        sections.push("### Propiedades\n");
        sections.push("| Nombre | Visibilidad | Tipo |");
        sections.push("| :--- | :--- | :--- |");
        for (const prop of decl.def.properties) {
          const access = prop.accessibility || "public";
          const typeRepr = (prop.tsType?.repr || "unknown").replace(/\|/g, "\\|");
          sections.push(`| \`${prop.name}\` | \`${access}\` | \`${typeRepr}\` |`);
        }
        sections.push("");
      }

      if (decl.def?.methods && decl.def.methods.length > 0) {
        sections.push("### Métodos\n");
        for (const method of decl.def.methods) {
          const params = (method.functionDef?.params || [])
            .map((p) => `${p.name || "arg"}: ${p.tsType?.repr || "any"}`)
            .join(", ");
          const retType = method.functionDef?.returnType?.repr || "void";
          const methodDesc = method.jsDoc?.doc || "";
          const staticPrefix = method.isStatic ? "static " : "";

          sections.push(`#### \`${staticPrefix}${method.name}(${params}): ${retType}\`\n`);
          if (methodDesc) sections.push(`${methodDesc}\n`);
        }
      }
    } else if (kind === "function") {
      const params = (decl.def?.params || [])
        .map((p) => `${p.name || "arg"}: ${p.tsType?.repr || "any"}`)
        .join(", ");
      const retType = decl.def?.returnType?.repr || "void";

      sections.push("```typescript");
      sections.push(`function ${sym.name}(${params}): ${retType};`);
      sections.push("```\n");

      if (decl.def?.params && decl.def.params.length > 0) {
        sections.push("### Parámetros\n");
        sections.push("| Parámetro | Tipo | Opcional |");
        sections.push("| :--- | :--- | :--- |");
        for (const p of decl.def.params) {
          const typeRepr = (p.tsType?.repr || "any").replace(/\|/g, "\\|");
          sections.push(
            `| \`${p.name || "arg"}\` | \`${typeRepr}\` | ${p.optional ? "Sí" : "No"} |`,
          );
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
