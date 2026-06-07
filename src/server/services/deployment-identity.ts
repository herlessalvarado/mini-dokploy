import { randomUUID } from "crypto";

export function createDeploymentIdentity() {
  const id = randomUUID();
  const shortId = id.slice(0, 8);

  return {
    id,
    shortId,
    name: `app-${shortId}`,
    serviceName: `mini-dokploy-${shortId}`,
    imageTag: `mini-dokploy/${shortId}:${Date.now()}`,
    domain: `app-${shortId}.127.0.0.1.sslip.io`,
  };
}

export function createRedeployImageTag(deploymentId: string) {
  const shortId = deploymentId.slice(0, 8);

  return `mini-dokploy/${shortId}:${Date.now()}`;
}