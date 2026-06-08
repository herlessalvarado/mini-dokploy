import fs from "fs/promises";
import path from "path";

import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { deployments } from "@/server/db/schema";
import {
  buildDockerImage,
  createDockerService,
  removeDockerService,
  removeDockerServiceIfExists,
} from "./docker";
import { cloneRepository } from "./git";
import {
  getTraefikLabels,
  mergeDockerLabels,
  type DockerLabel,
} from "./labels";
import { createRedeployImageTag } from "./deployment-identity";

const TMP_DEPLOYMENTS_DIR = process.env.DOKPLOY_TMP_DIR ?? "/tmp/mini-dokploy";

export async function runDeploymentJob(deploymentId: string) {
  const [deployment] = await db
    .select()
    .from(deployments)
    .where(eq(deployments.id, deploymentId))
    .limit(1);

  if (!deployment) {
    throw new Error(`Deployment ${deploymentId} not found`);
  }

  await executeDeployment({
    deploymentId: deployment.id,
    repoUrl: deployment.repoUrl,
    dockerfilePath: deployment.dockerfilePath,
    exposedPort: deployment.exposedPort,
    serviceName: deployment.serviceName,
    imageTag: deployment.imageTag,
    domain: deployment.domain,
    customLabelsJson: deployment.customLabelsJson,
  });
}

export async function runRedeploymentJob(deploymentId: string) {
  const [deployment] = await db
    .select()
    .from(deployments)
    .where(eq(deployments.id, deploymentId))
    .limit(1);

  if (!deployment) {
    throw new Error(`Deployment ${deploymentId} not found`);
  }

  const newImageTag = createRedeployImageTag(deployment.id);

  await db
    .update(deployments)
    .set({
      imageTag: newImageTag,
      status: "building",
      errorMessage: null,
      updatedAt: new Date(),
    })
    .where(eq(deployments.id, deployment.id));

  await removeDockerServiceIfExists(deployment.serviceName);

  await executeDeployment({
    deploymentId: deployment.id,
    repoUrl: deployment.repoUrl,
    dockerfilePath: deployment.dockerfilePath,
    exposedPort: deployment.exposedPort,
    serviceName: deployment.serviceName,
    imageTag: newImageTag,
    domain: deployment.domain,
    customLabelsJson: deployment.customLabelsJson,
  });
}

export async function removeDeployment(deploymentId: string) {
  const [deployment] = await db
    .select()
    .from(deployments)
    .where(eq(deployments.id, deploymentId))
    .limit(1);

  if (!deployment) {
    throw new Error(`Deployment ${deploymentId} not found`);
  }

  try {
    await removeDockerService(deployment.serviceName);
  } catch {}

  await db
    .update(deployments)
    .set({
      status: "removed",
      errorMessage: null,
      updatedAt: new Date(),
    })
    .where(eq(deployments.id, deployment.id));
}

async function executeDeployment(params: {
  deploymentId: string;
  repoUrl: string;
  dockerfilePath: string;
  exposedPort: number;
  serviceName: string;
  imageTag: string;
  domain: string;
  customLabelsJson: string | null;
}) {
  const repoPath = path.join(TMP_DEPLOYMENTS_DIR, params.deploymentId);

  try {
    await markDeploymentBuilding(params.deploymentId);

    await fs.mkdir(TMP_DEPLOYMENTS_DIR, { recursive: true });

    await cloneRepository({
      repoUrl: params.repoUrl,
      targetPath: repoPath,
    });

    await buildDockerImage({
      imageTag: params.imageTag,
      repoPath,
      dockerfilePath: params.dockerfilePath,
    });

    const customLabels = parseStoredCustomLabels(params.customLabelsJson);

    const generatedLabels = getTraefikLabels({
      serviceName: params.serviceName,
      domain: params.domain,
      exposedPort: params.exposedPort,
    });

    const labels = mergeDockerLabels({
      customLabels,
      generatedLabels,
    });

    await removeDockerServiceIfExists(params.serviceName);

    await createDockerService({
      serviceName: params.serviceName,
      imageTag: params.imageTag,
      labels,
    });

    await markDeploymentRunning(params.deploymentId);
  } catch (error) {
    await markDeploymentFailed(
      params.deploymentId,
      error instanceof Error ? error.message : "Unknown deployment error",
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
        typeof label?.key === "string" && typeof label?.value === "string",
    );
  } catch {
    return [];
  }
}
