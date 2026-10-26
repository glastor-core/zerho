// Semantic versioning calculation script for Zerho
const denoJsonPath = "deno.json";
const citationPath = "CITATION.cff";

const denoJson = JSON.parse(await Deno.readTextFile(denoJsonPath));
const currentVersion = denoJson.version || "1.1.0";
const [major, minor, patch] = currentVersion.split(".").map(Number);

// Get latest commit message
let commitMsg = "";
try {
  const p = new Deno.Command("git", {
    args: ["log", "-1", "--pretty=%B"],
    stdout: "piped",
  });
  const { stdout } = await p.output();
  commitMsg = new TextDecoder().decode(stdout).trim();
} catch (_e) {
  commitMsg = "";
}

let nextVersion = currentVersion;
let hasBump = false;

if (commitMsg.includes("BREAKING CHANGE:") || commitMsg.includes("!:")) {
  nextVersion = `${major + 1}.0.0`;
  hasBump = true;
} else if (commitMsg.startsWith("feat:") || commitMsg.startsWith("feat(")) {
  nextVersion = `${major}.${minor + 1}.0`;
  hasBump = true;
} else if (
  commitMsg.startsWith("fix:") ||
  commitMsg.startsWith("fix(") ||
  commitMsg.startsWith("perf:") ||
  commitMsg.startsWith("perf(")
) {
  nextVersion = `${major}.${minor}.${patch + 1}`;
  hasBump = true;
}

if (hasBump) {
  // Update deno.json
  denoJson.version = nextVersion;
  await Deno.writeTextFile(denoJsonPath, JSON.stringify(denoJson, null, 2) + "\n");

  // Update CITATION.cff
  try {
    let citation = await Deno.readTextFile(citationPath);
    citation = citation.replace(/version:\s*"[^"]+"/, `version: "${nextVersion}"`);
    const today = new Date().toISOString().split("T")[0];
    citation = citation.replace(/date-released:\s*"[^"]+"/, `date-released: "${today}"`);
    await Deno.writeTextFile(citationPath, citation);
  } catch (_e) {
    // Ignore citation update errors
  }

  console.log(`✨ Bumping version: ${currentVersion} -> ${nextVersion}`);
} else {
  console.log(`ℹ️ No version bump needed for commit: "${commitMsg}"`);
}

// Write to GitHub Actions outputs if present
const githubOutput = Deno.env.get("GITHUB_OUTPUT");
if (githubOutput) {
  const out = `has_bump=${hasBump}\ntag_name=v${nextVersion}\n`;
  await Deno.writeTextFile(githubOutput, out, { append: true });
}
