import { runCommand } from "./command";
import type { DockerLabel } from "./labels";

const PUBLIC_NETWORK = process.env.DOKPLOY_PUBLIC_NETWORK ?? "dokploy-public";

export async function buildDockerImage(params: {
  imageTag: string;
  repoPath: string;
  dockerfilePath: string;
}) {
  await runCommand(
    "docker",
    [
      "build",
      "-t",
      params.imageTag,
      "-f",
      params.dockerfilePath,
      ".",
    ],
    {
      cwd: params.repoPath,
    }
  );
}

export async function createDockerService(params: {
  serviceName: string;
  imageTag: string;
  labels: DockerLabel[];
}) {
  const labelArgs = params.labels.flatMap((label) => [
    "--label",
    `${label.key}=${label.value}`,
  ]);

  await runCommand("docker", [
    "service",
    "create",
    "--name",
    params.serviceName,
    "--network",
    PUBLIC_NETWORK,
    ...labelArgs,
    params.imageTag,
  ]);
}

export async function removeDockerService(serviceName: string) {
  await runCommand("docker", ["service", "rm", serviceName]);
}

export async function inspectDockerService(serviceName: string) {
  return runCommand("docker", ["service", "inspect", serviceName]);
}