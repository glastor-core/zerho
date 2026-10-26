/**
 * Automated Semantic Versioning and Changelog Engine for Zerho.
 * Supports conventional commits, manual bumps (patch, minor, major),
 * and automatic synchronization across deno.json, src/version.ts,
 * CITATION.cff, and CHANGELOG.md.
 */

export interface CommitInfo {
  hash: string;
  subject: string;
  body?: string;
  type?: "feat" | "fix" | "perf" | "refactor" | "docs" | "chore" | "breaking" | "other";
  scope?: string;
  description?: string;
}

export type BumpType = "major" | "minor" | "patch" | "none";

const DENO_JSON_PATH = "deno.json";
const VERSION_TS_PATH = "src/version.ts";
const CITATION_PATH = "CITATION.cff";
const CHANGELOG_PATH = "CHANGELOG.md";

/**
 * Parses conventional commit subject and body to determine change type.
 */
export function parseCommit(hash: string, fullMessage: string): CommitInfo {
  const lines = fullMessage.trim().split("\n");
  const subject = lines[0].trim();
  const body = lines.slice(1).join("\n").trim();

  const isBreaking = subject.includes("!:") ||
    fullMessage.includes("BREAKING CHANGE:") ||
    fullMessage.includes("BREAKING-CHANGE:");

  if (isBreaking) {
    return { hash, subject, body, type: "breaking", description: subject };
  }

  const match = subject.match(/^([a-zA-Z]+)(?:\(([^)]+)\))?:\s*(.+)$/);
  if (!match) {
    return { hash, subject, body, type: "other", description: subject };
  }

  const [, rawType, scope, description] = match;
  const lower = rawType.toLowerCase();

  let type: CommitInfo["type"] = "other";
  if (lower === "feat") type = "feat";
  else if (lower === "fix") type = "fix";
  else if (lower === "perf") type = "perf";
  else if (lower === "refactor") type = "refactor";
  else if (lower === "docs") type = "docs";
  else if (lower === "chore") type = "chore";

  return { hash, subject, body, type, scope, description };
}

/**
 * Determines required bump type based on commits.
 */
export function determineBumpFromCommits(commits: CommitInfo[]): BumpType {
  let hasMinor = false;
  let hasPatch = false;

  for (const c of commits) {
    if (c.type === "breaking") {
      return "major";
    }
    if (c.type === "feat") {
      hasMinor = true;
    } else if (c.type === "fix" || c.type === "perf" || c.type === "refactor") {
      hasPatch = true;
    }
  }

  if (hasMinor) return "minor";
  if (hasPatch) return "patch";
  return "none";
}

/**
 * Increments version string based on bump type or target version.
 */
export function bumpVersionString(currentVersion: string, bump: BumpType | string): string {
  const match = currentVersion.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!match) {
    throw new Error(`Invalid current version: "${currentVersion}"`);
  }

  const major = parseInt(match[1], 10);
  const minor = parseInt(match[2], 10);
  const patch = parseInt(match[3], 10);

  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  if (bump === "patch") return `${major}.${minor}.${patch + 1}`;
  if (bump === "none") return currentVersion;

  // Direct version passed e.g. "1.2.3"
  if (/^\d+\.\d+\.\d+/.test(bump)) {
    return bump;
  }

  throw new Error(`Unknown bump type: ${bump}`);
}

/**
 * Retrieves latest git tag or null if none.
 */
export async function getLatestTag(): Promise<string | null> {
  try {
    const cmd = new Deno.Command("git", {
      args: ["describe", "--tags", "--abbrev=0"],
      stdout: "piped",
      stderr: "null",
    });
    const { stdout, code } = await cmd.output();
    if (code === 0) {
      return new TextDecoder().decode(stdout).trim();
    }
  } catch (_e) {
    // Git not available or no tags
  }
  return null;
}

/**
 * Retrieves commit history since a tag (or all recent commits if no tag).
 */
export async function getCommitsSinceTag(tag: string | null, limit = 50): Promise<CommitInfo[]> {
  try {
    const gitArgs = tag
      ? ["log", `${tag}..HEAD`, "--pretty=format:%h%x1f%s%x1f%b%x1e"]
      : ["log", `-${limit}`, "--pretty=format:%h%x1f%s%x1f%b%x1e"];

    const cmd = new Deno.Command("git", {
      args: gitArgs,
      stdout: "piped",
      stderr: "null",
    });
    const { stdout, code } = await cmd.output();
    if (code !== 0) return [];

    const text = new TextDecoder().decode(stdout).trim();
    if (!text) return [];

    const rawCommits = text.split("\x1e").filter((c) => c.trim().length > 0);
    return rawCommits.map((raw) => {
      const [hash, subject, body] = raw.split("\x1f");
      return parseCommit(hash || "", `${subject || ""}\n${body || ""}`);
    });
  } catch (_e) {
    return [];
  }
}

/**
 * Generates formatted markdown changelog entry for a new release.
 */
export function formatChangelogEntry(
  version: string,
  date: string,
  commits: CommitInfo[],
): string {
  const feats = commits.filter((c) => c.type === "feat");
  const fixes = commits.filter((c) => c.type === "fix");
  const perfs = commits.filter((c) => c.type === "perf");
  const refactors = commits.filter((c) => c.type === "refactor");
  const breakings = commits.filter((c) => c.type === "breaking");

  const lines: string[] = [];
  lines.push(`## [${version}] - ${date}`);
  lines.push("");

  if (breakings.length > 0) {
    lines.push("### ⚠️ BREAKING CHANGES");
    lines.push("");
    for (const c of breakings) {
      const scope = c.scope ? `**${c.scope}:** ` : "";
      lines.push(`- ${scope}${c.description || c.subject} (${c.hash})`);
    }
    lines.push("");
  }

  if (feats.length > 0) {
    lines.push("### ✨ Added");
    lines.push("");
    for (const c of feats) {
      const scope = c.scope ? `**${c.scope}:** ` : "";
      lines.push(`- ${scope}${c.description || c.subject} (${c.hash})`);
    }
    lines.push("");
  }

  if (fixes.length > 0) {
    lines.push("### 🐛 Fixed");
    lines.push("");
    for (const c of fixes) {
      const scope = c.scope ? `**${c.scope}:** ` : "";
      lines.push(`- ${scope}${c.description || c.subject} (${c.hash})`);
    }
    lines.push("");
  }

  if (perfs.length > 0) {
    lines.push("### ⚡ Performance");
    lines.push("");
    for (const c of perfs) {
      const scope = c.scope ? `**${c.scope}:** ` : "";
      lines.push(`- ${scope}${c.description || c.subject} (${c.hash})`);
    }
    lines.push("");
  }

  if (refactors.length > 0) {
    lines.push("### 🔄 Changed");
    lines.push("");
    for (const c of refactors) {
      const scope = c.scope ? `**${c.scope}:** ` : "";
      lines.push(`- ${scope}${c.description || c.subject} (${c.hash})`);
    }
    lines.push("");
  }

  if (lines.length === 2) {
    // No categorized commits, provide fallback summary
    lines.push("### 🔄 Maintenance & Improvements");
    lines.push("");
    if (commits.length > 0) {
      for (const c of commits.slice(0, 10)) {
        lines.push(`- ${c.subject} (${c.hash})`);
      }
    } else {
      lines.push("- Actualización de dependencias y optimizaciones continuas.");
    }
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  return lines.join("\n");
}

/**
 * Inserts changelog entry into CHANGELOG.md right beneath the Unreleased section.
 */
export function insertChangelogEntry(changelogContent: string, newEntry: string): string {
  const unreleasedMarker = "## [Unreleased]";
  const idx = changelogContent.indexOf(unreleasedMarker);

  if (idx === -1) {
    return `${newEntry}\n${changelogContent}`;
  }

  // Find the end of unreleased section (either "---" or next "## [")
  const afterUnreleased = changelogContent.indexOf("---", idx + unreleasedMarker.length);
  if (afterUnreleased === -1) {
    return changelogContent.replace(
      unreleasedMarker,
      `${unreleasedMarker}\n\n${newEntry}`,
    );
  }

  const insertPos = afterUnreleased + 3;
  return (
    changelogContent.slice(0, insertPos) +
    "\n\n" +
    newEntry +
    changelogContent.slice(insertPos).trimStart()
  );
}

/**
 * Main execution handler.
 */
export async function runBump(args: string[] = Deno.args) {
  const dryRun = args.includes("--dry-run");
  const skipChangelog = args.includes("--no-changelog");
  const cleanArgs = args.filter((a) => !a.startsWith("--"));

  let explicitBump: string | null = null;
  if (cleanArgs.length > 0) {
    const candidate = cleanArgs[0].toLowerCase();
    if (["major", "minor", "patch"].includes(candidate) || /^\d+\.\d+\.\d+/.test(candidate)) {
      explicitBump = candidate;
    }
  }

  // 1. Read current version from deno.json
  const denoJson = JSON.parse(await Deno.readTextFile(DENO_JSON_PATH));
  const currentVersion: string = denoJson.version || "1.1.0";

  // 2. Determine bump type
  const latestTag = await getLatestTag();
  const commits = await getCommitsSinceTag(latestTag);

  let bumpType: BumpType = "none";
  let nextVersion = currentVersion;

  if (explicitBump) {
    bumpType =
      (["major", "minor", "patch"].includes(explicitBump) ? explicitBump : "patch") as BumpType;
    nextVersion = bumpVersionString(currentVersion, explicitBump);
  } else {
    bumpType = determineBumpFromCommits(commits);
    nextVersion = bumpVersionString(currentVersion, bumpType);
  }

  const hasBump = nextVersion !== currentVersion;
  const tagName = `v${nextVersion}`;
  const today = new Date().toISOString().split("T")[0];

  console.log(`📌 Versión actual: ${currentVersion}`);
  if (latestTag) console.log(`🏷️  Último tag detectado: ${latestTag}`);
  console.log(`📝 Commits analizados: ${commits.length}`);

  if (!hasBump) {
    console.log(
      `ℹ️  No se requiere incremento de versión (no hay commits feat/fix/breaking o bump=none).`,
    );
  } else {
    console.log(`🚀 Incremento [${bumpType.toUpperCase()}]: ${currentVersion} ➔ ${nextVersion}`);
  }

  if (hasBump && !dryRun) {
    // 3. Update deno.json
    denoJson.version = nextVersion;
    await Deno.writeTextFile(DENO_JSON_PATH, JSON.stringify(denoJson, null, 2) + "\n");
    console.log(`✅ Actualizado: ${DENO_JSON_PATH} -> ${nextVersion}`);

    // 4. Update src/version.ts
    const versionTsContent =
      `/**\n * Current version of Zerho.\n * Managed automatically by scripts/bump-version.ts.\n */\nexport const VERSION = "${nextVersion}";\n`;
    await Deno.writeTextFile(VERSION_TS_PATH, versionTsContent);
    console.log(`✅ Actualizado: ${VERSION_TS_PATH} -> ${nextVersion}`);

    // 5. Update CITATION.cff
    try {
      let citation = await Deno.readTextFile(CITATION_PATH);
      citation = citation.replace(/version:\s*"[^"]+"/, `version: "${nextVersion}"`);
      citation = citation.replace(/date-released:\s*"[^"]+"/, `date-released: "${today}"`);
      await Deno.writeTextFile(CITATION_PATH, citation);
      console.log(`✅ Actualizado: ${CITATION_PATH}`);
    } catch (_e) {
      console.warn(`⚠️ No se pudo actualizar ${CITATION_PATH}`);
    }

    // 6. Update CHANGELOG.md
    if (!skipChangelog) {
      try {
        const changelog = await Deno.readTextFile(CHANGELOG_PATH);
        const newEntry = formatChangelogEntry(nextVersion, today, commits);
        const updatedChangelog = insertChangelogEntry(changelog, newEntry);
        await Deno.writeTextFile(CHANGELOG_PATH, updatedChangelog);
        console.log(`✅ Actualizado: ${CHANGELOG_PATH}`);
      } catch (_e) {
        console.warn(`⚠️ No se pudo actualizar ${CHANGELOG_PATH}`);
      }
    }
  } else if (hasBump && dryRun) {
    console.log(`🔍 Modo simulado (--dry-run): ningún archivo fue modificado.`);
  }

  // 7. GitHub Actions Output
  const githubOutput = Deno.env.get("GITHUB_OUTPUT");
  if (githubOutput) {
    const lines = [
      `has_bump=${hasBump}`,
      `tag_name=${tagName}`,
      `current_version=${currentVersion}`,
      `next_version=${nextVersion}`,
      `bump_type=${bumpType}`,
    ].join("\n") + "\n";
    await Deno.writeTextFile(githubOutput, lines, { append: true });
    console.log(`🤖 Variables exportadas a $GITHUB_OUTPUT.`);
  }

  return { hasBump, currentVersion, nextVersion, tagName, bumpType };
}

if (import.meta.main) {
  await runBump();
}
