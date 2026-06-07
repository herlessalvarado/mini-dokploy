import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export type CommandResult = {
  stdout: string;
  stderr: string;
};

export async function runCommand(
  command: string,
  args: string[],
  options?: {
    cwd?: string;
  }
): Promise<CommandResult> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd: options?.cwd,
      maxBuffer: 1024 * 1024 * 20,
    });

    return {
      stdout,
      stderr,
    };
  } catch (error) {
    if (isExecError(error)) {
      const message =
        error.stderr ||
        error.stdout ||
        error.message ||
        `${command} ${args.join(" ")} failed`;

      throw new Error(message);
    }

    throw error;
  }
}

function isExecError(
  error: unknown
): error is Error & { stdout?: string; stderr?: string } {
  return error instanceof Error;
}