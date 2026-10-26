/**
 * Local Hygiene, Security & Compliance Audit Script for Zerho.
 * Compatible with glastor-core/nemesis rules for fast local developer verification.
 */

import { walk } from "@std/fs";

interface Finding {
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  category: "Secret" | "Hygiene" | "Size" | "Governance" | "Dependency";
  file: string;
  message: string;
  line?: number;
}

const TOXIC_PATTERNS = [
  /\.DS_Store$/i,
  /Thumbs\.db$/i,
  /\.env(\.local|\.production|\.development)?$/i,
  /\.bak$/i,
  /\.dump$/i,
  /\.orig$/i,
  /\.log$/i,
];

const SECRET_PATTERNS = [
  { name: "AWS Access Key", regex: /AKIA[0-9A-Z]{16}/ },
  { name: "GitHub Personal Access Token", regex: /ghp_[a-zA-Z0-9]{36}/ },
  { name: "GitHub Fine-Grained PAT", regex: /github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}/ },
  { name: "OpenAI API Key", regex: /sk-[a-zA-Z0-9]{20,}/ },
  { name: "Private RSA/EC Key", regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: "Slack Token", regex: /xox[baprs]-[0-9a-zA-Z]{10,48}/ },
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function runLocalAudit(targetDir = "."): Promise<Finding[]> {
  const findings: Finding[] = [];

  // 1. Governance check
  try {
    await Deno.stat("LICENSE");
  } catch {
    findings.push({
      severity: "HIGH",
      category: "Governance",
      file: "LICENSE",
      message: "Falta el archivo de licencia oficial LICENSE en la raíz del proyecto.",
    });
  }

  // 2. Scan files
  for await (
    const entry of walk(targetDir, {
      skip: [/\.git/, /dist/, /node_modules/, /\.tempmediaStorage/],
      includeDirs: false,
    })
  ) {
    const relPath = entry.path.replace(/\\/g, "/");

    // Toxic files check
    for (const pat of TOXIC_PATTERNS) {
      if (pat.test(entry.name)) {
        findings.push({
          severity: "MEDIUM",
          category: "Hygiene",
          file: relPath,
          message:
            `Archivo temporal/tóxico detectado: "${entry.name}". Debe agregarse a .gitignore.`,
        });
      }
    }

    // File size check
    try {
      const stat = await Deno.stat(entry.path);
      if (stat.size > MAX_FILE_SIZE_BYTES) {
        const mb = (stat.size / (1024 * 1024)).toFixed(1);
        findings.push({
          severity: "HIGH",
          category: "Size",
          file: relPath,
          message: `Archivo supera el límite de 10 MB (${mb} MB). Considera usar Git LFS.`,
        });
      }
    } catch {
      // Ignore stat errors
    }

    // Secret scanning on text files
    if (
      /\.(ts|js|json|md|yml|yaml|toml|html|css|txt)$/i.test(entry.name) &&
      !relPath.includes("tests/") // Ignore intentional test fixtures
    ) {
      try {
        const content = await Deno.readTextFile(entry.path);
        const lines = content.split("\n");

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          for (const sec of SECRET_PATTERNS) {
            if (sec.regex.test(line)) {
              findings.push({
                severity: "CRITICAL",
                category: "Secret",
                file: relPath,
                line: i + 1,
                message: `Posible secreto detectado (${sec.name}).`,
              });
            }
          }
        }
      } catch {
        // Binary or unreadable
      }
    }
  }

  return findings;
}

if (import.meta.main) {
  console.log("🛡️  Iniciando Auditoría Nemesis Local (Seguridad, Higiene y Gobernanza)...");
  const start = performance.now();
  const findings = await runLocalAudit();
  const duration = (performance.now() - start).toFixed(1);

  if (findings.length === 0) {
    console.log(
      `\n✅ \x1b[32m[Nemesis Audit Aprobado]\x1b[0m 0 vulnerabilidades, 0 secretos y repositorio 100% limpio (${duration}ms).\n`,
    );
  } else {
    console.log(
      `\n⚠️  \x1b[33m[Nemesis Audit]\x1b[0m Se encontraron ${findings.length} hallazgo(s) (${duration}ms):\n`,
    );
    for (const f of findings) {
      const color = f.severity === "CRITICAL"
        ? "\x1b[31m"
        : f.severity === "HIGH"
        ? "\x1b[33m"
        : "\x1b[36m";
      const lineStr = f.line ? `:${f.line}` : "";
      console.log(
        `  ${color}[${f.severity}]\x1b[0m ${f.category} ➔ ${f.file}${lineStr}: ${f.message}`,
      );
    }
    console.log("");
  }
}
