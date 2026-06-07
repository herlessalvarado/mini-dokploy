import fs from "fs/promises";

import { runCommand } from "./command";

export async function cloneRepository(params: {
  repoUrl: string;
  targetPath: string;
}) {
  await fs.rm(params.targetPath, {
    recursive: true,
    force: true,
  });

  await runCommand("git", [
    "clone",
    "--depth=1",
    params.repoUrl,
    params.targetPath,
  ]);
}