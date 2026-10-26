/**
 * Conventional Commits Validator for Zerho Git Hooks.
 * Ensures commit messages comply with semantic versioning triggers.
 */

const commitMsgFile = Deno.args[0];

if (!commitMsgFile) {
  console.error("❌ Error: Ruta del archivo de mensaje de commit no especificada.");
  Deno.exit(1);
}

const msg = (await Deno.readTextFile(commitMsgFile)).trim();

// Skip automated or merge commits
if (
  msg.startsWith("Merge ") ||
  msg.includes("[skip ci]") ||
  msg.startsWith("chore(release):") ||
  msg.startsWith("Revert ")
) {
  Deno.exit(0);
}

const firstLine = msg.split("\n")[0].trim();

// Conventional commit pattern: type(scope)?: description or type!?: description
const CONVENTIONAL_PATTERN =
  /^(feat|fix|perf|refactor|docs|style|test|build|ci|chore)(\([a-zA-Z0-9_\-.]+\))?!?:\s*.{3,}$/;

if (!CONVENTIONAL_PATTERN.test(firstLine)) {
  console.error(
    "\n❌ \x1b[31m[Commit Inválido]\x1b[0m El mensaje de commit no cumple con Conventional Commits.\n",
  );
  console.error("  Formato esperado:  <tipo>(<alcance opcional>): <descripción>");
  console.error("  Ejemplos válidos:");
  console.error("    feat(search): añadir búsqueda semántica con Edge AI");
  console.error("    fix(builder): corregir resolución de rutas en Windows");
  console.error("    refactor: simplificar controlador de eventos");
  console.error("    chore(deps): actualizar dependencias estándar JSR");
  console.error("    feat!: romper compatibilidad de la API pública\n");
  console.error(`  Mensaje recibido: "${firstLine}"\n`);
  Deno.exit(1);
}

console.log("✅ \x1b[32m[Commit Válido]\x1b[0m Formato Conventional Commits verificado.");
Deno.exit(0);
