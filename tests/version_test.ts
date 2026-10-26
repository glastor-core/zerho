import { assertEquals, assertStringIncludes } from "@std/assert";
import {
  bumpVersionString,
  determineBumpFromCommits,
  formatChangelogEntry,
  insertChangelogEntry,
  parseCommit,
} from "../scripts/bump-version.ts";

Deno.test("SemVer Engine: parseCommit correctly identifies types and scopes", () => {
  const feat = parseCommit("abc1234", "feat(auth): add OAuth2 edge handler");
  assertEquals(feat.type, "feat");
  assertEquals(feat.scope, "auth");
  assertEquals(feat.description, "add OAuth2 edge handler");

  const fix = parseCommit("def5678", "fix(ssg): correct path normalization for Windows");
  assertEquals(fix.type, "fix");
  assertEquals(fix.scope, "ssg");

  const breaking1 = parseCommit("789abcd", "feat!: overhaul CLI argument structure");
  assertEquals(breaking1.type, "breaking");

  const breaking2 = parseCommit(
    "987fedc",
    "fix: align headers\n\nBREAKING CHANGE: changes output signature",
  );
  assertEquals(breaking2.type, "breaking");

  const chore = parseCommit("1112223", "chore: update dependencies");
  assertEquals(chore.type, "chore");
});

Deno.test("SemVer Engine: determineBumpFromCommits calculates correct bump priority", () => {
  // Breaking change takes highest precedence -> major
  const commitsMajor = [
    parseCommit("1", "feat: new thing"),
    parseCommit("2", "fix: small bug"),
    parseCommit("3", "feat!: major architectural shift"),
  ];
  assertEquals(determineBumpFromCommits(commitsMajor), "major");

  // Feat takes precedence over fix -> minor
  const commitsMinor = [
    parseCommit("1", "fix: small bug"),
    parseCommit("2", "feat: added spotlight filter"),
    parseCommit("3", "perf: cached assets"),
  ];
  assertEquals(determineBumpFromCommits(commitsMinor), "minor");

  // Fix / perf / refactor only -> patch
  const commitsPatch = [
    parseCommit("1", "fix: resolve link anchor"),
    parseCommit("2", "perf: optimize KV indexing"),
  ];
  assertEquals(determineBumpFromCommits(commitsPatch), "patch");

  // Chores/docs only -> none
  const commitsNone = [
    parseCommit("1", "docs: update README"),
    parseCommit("2", "chore: bump dev tooling"),
  ];
  assertEquals(determineBumpFromCommits(commitsNone), "none");
});

Deno.test("SemVer Engine: bumpVersionString computes accurate semver targets", () => {
  assertEquals(bumpVersionString("1.1.0", "patch"), "1.1.1");
  assertEquals(bumpVersionString("1.1.0", "minor"), "1.2.0");
  assertEquals(bumpVersionString("1.1.0", "major"), "2.0.0");
  assertEquals(bumpVersionString("1.1.0", "none"), "1.1.0");
  assertEquals(bumpVersionString("1.1.0", "2.1.5"), "2.1.5");
});

Deno.test("SemVer Engine: formatChangelogEntry produces structured Keep a Changelog markdown", () => {
  const commits = [
    parseCommit("a1b2c3d", "feat(search): add edge AI natural language querying"),
    parseCommit("e4f5a6b", "fix(kv): validate incoming feedback payloads"),
  ];

  const entry = formatChangelogEntry("1.2.0", "2026-10-26", commits);

  assertStringIncludes(entry, "## [1.2.0] - 2026-10-26");
  assertStringIncludes(entry, "### ✨ Added");
  assertStringIncludes(entry, "**search:** add edge AI natural language querying (a1b2c3d)");
  assertStringIncludes(entry, "### 🐛 Fixed");
  assertStringIncludes(entry, "**kv:** validate incoming feedback payloads (e4f5a6b)");
  assertStringIncludes(entry, "---");
});

Deno.test("SemVer Engine: insertChangelogEntry places release directly after [Unreleased]", () => {
  const existing = `# Changelog

## [Unreleased]

### 💡 Planned
- Future item

---

## [1.0.0] - 2026-10-25
- Initial release
`;

  const newEntry = `## [1.1.0] - 2026-10-26

### ✨ Added
- New feature

---`;

  const updated = insertChangelogEntry(existing, newEntry);

  const unreleasedIdx = updated.indexOf("## [Unreleased]");
  const newEntryIdx = updated.indexOf("## [1.1.0] - 2026-10-26");
  const oldEntryIdx = updated.indexOf("## [1.0.0] - 2026-10-25");

  assertEquals(unreleasedIdx < newEntryIdx, true);
  assertEquals(newEntryIdx < oldEntryIdx, true);
});
