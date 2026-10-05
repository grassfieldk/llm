import { execFileSync } from "node:child_process";
import { cp, copyFile, mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const instructions = path.join(root, "custom/agents.md");
const skillsRoot = path.join(root, "skills");
const home = process.env.HOME || process.env.USERPROFILE;

if (!home) {
  throw new Error("ホームディレクトリを特定できません");
}

async function getWindowsHome() {
  if (process.env.LLM_SYNC_WINDOWS_HOME) {
    return path.resolve(process.env.LLM_SYNC_WINDOWS_HOME);
  }

  if (process.platform === "win32") {
    return process.env.USERPROFILE;
  }

  if (!process.env.WSL_DISTRO_NAME) {
    return undefined;
  }

  const windowsWorkingDirectory = execFileSync("wslpath", ["-u", "C:\\Windows"], {
    encoding: "utf8",
  }).trim();
  const windowsProfile = execFileSync(
    "cmd.exe",
    ["/c", "cd /d %USERPROFILE% && echo %USERPROFILE%"],
    { cwd: windowsWorkingDirectory, encoding: "utf8" },
  ).trim();

  if (!windowsProfile) {
    throw new Error("Windows のユーザーディレクトリを取得できません");
  }

  return execFileSync("wslpath", ["-u", windowsProfile], {
    encoding: "utf8",
  }).trim();
}

const homes = [home];
const windowsHome = await getWindowsHome();
if (windowsHome && path.resolve(windowsHome) !== path.resolve(home)) {
  homes.push(windowsHome);
}

const skillEntries = await readdir(skillsRoot, { withFileTypes: true });
const skillNames = [];
for (const entry of skillEntries) {
  if (!entry.isDirectory()) continue;
  const skillPath = path.join(skillsRoot, entry.name);
  try {
    if ((await stat(path.join(skillPath, "SKILL.md"))).isFile()) {
      skillNames.push(entry.name);
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

const destinations = [
  { directory: ".codex", instructionFile: "AGENTS.md" },
  { directory: ".claude", instructionFile: "CLAUDE.md" },
  { directory: ".copilot", instructionFile: "copilot-instructions.md" },
];

for (const targetHome of homes) {
  for (const destination of destinations) {
    const targetDirectory = path.join(targetHome, destination.directory);
    await mkdir(targetDirectory, { recursive: true });
    await copyFile(
      instructions,
      path.join(targetDirectory, destination.instructionFile),
    );

    const targetSkills = path.join(targetDirectory, "skills");
    await mkdir(targetSkills, { recursive: true });
    for (const skillName of skillNames) {
      await cp(
        path.join(skillsRoot, skillName),
        path.join(targetSkills, skillName),
        { recursive: true, force: true },
      );
    }
  }
}

console.log(
  `指示を ${homes.length} 環境、${destinations.length} ツールへ同期し、${skillNames.length} 個のスキルをコピーしました`,
);
