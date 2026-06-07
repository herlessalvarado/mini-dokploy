import fs from "fs/promises";
import path from "path";

import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { deployments } from "@/server/db/schema";
import { buildDockerImage, createDockerService } from "./docker";
import { cloneRepository } from "./git";
import {
  getTraefikLabels,
  mergeDockerLabels,
  type DockerLabel,
} from "./labels";

const TMP_DEPLOYMENTS_DIR =
  process.env.DOKPLOY_TMP_DIR ?? "/tmp/mini-dokploy";

export async function runDeploymentJob(deploymentId: string) {
  const [deployment] = await db
    .select()
    .from(deployments)
    .where(eq(deployments.id, deploymentId))
    .limit(1);

  if (!deployment) {
    throw new Error(`Deployment ${deploymentId} not found`);
  }

  const repoPath = path.join(TMP_DEPLOYMENTS_DIR, deployment.id);

  try {
    await markDeploymentBuilding(deployment.id);

    await fs.mkdir(TMP_DEPLOYMENTS_DIR, { recursive: true });

    await cloneRepository({
      repoUrl: deployment.repoUrl,
      targetPath: repoPath,
    });

    await buildDockerImage({
      imageTag: deployment.imageTag,
      repoPath,
      dockerfilePath: deployment.dockerfilePath,
    });

    const customLabels = parseStoredCustomLabels(deployment.customLabelsJson);

    const generatedLabels = getTraefikLabels({
      serviceName: deployment.serviceName,
      domain: deployment.domain,
      exposedPort: deployment.exposedPort,
    });

    const labels = mergeDockerLabels({
      customLabels,
      generatedLabels,
    });

    await createDockerService({
      serviceName: deployment.serviceName,
      imageTag: deployment.imageTag,
      labels,
    });

    await markDeploymentRunning(deployment.id);
  } catch (error) {
    await markDeploymentFailed(
      deployment.id,
      error instanceof Error ? error.message : "Unknown deployment error"
    );
  } finally {
    await fs.rm(repoPath, {
      recursive: true,
      force: true,
    });
  }
}

async function markDeploymentBuilding(id: string) {
  await db
    .update(deployments)
    .set({
      status: "building",
      errorMessage: null,
      updatedAt: new Date(),
    })
    .where(eq(deployments.id, id));
}

async function markDeploymentRunning(id: string) {
  await db
    .update(deployments)
    .set({
      status: "running",
      errorMessage: null,
      updatedAt: new Date(),
    })
    .where(eq(deployments.id, id));
}

async function markDeploymentFailed(id: string, errorMessage: string) {
  await db
    .update(deployments)
    .set({
      status: "failed",
      errorMessage,
      updatedAt: new Date(),
    })
    .where(eq(deployments.id, id));
}

function parseStoredCustomLabels(value: string | null): DockerLabel[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (label): label is DockerLabel =>
        typeof label?.key === "string" && typeof label?.value === "string"
    );
  } catch {
    return [];
  }
}