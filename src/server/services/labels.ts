export type DockerLabel = {
  key: string;
  value: string;
};

export function getTraefikLabels(params: {
  serviceName: string;
  domain: string;
  exposedPort: number;
}): DockerLabel[] {
  const routerName = params.serviceName;
  const serviceName = params.serviceName;

  return [
    {
      key: "traefik.enable",
      value: "true",
    },
    {
      key: "traefik.swarm.network",
      value: "dokploy-public",
    },
    {
      key: `traefik.http.routers.${routerName}.rule`,
      value: `Host(\`${params.domain}\`)`,
    },
    {
      key: `traefik.http.routers.${routerName}.entrypoints`,
      value: "web",
    },
    {
      key: `traefik.http.services.${serviceName}.loadbalancer.server.port`,
      value: String(params.exposedPort),
    },
  ];
}

export function mergeDockerLabels(params: {
  generatedLabels: DockerLabel[];
  customLabels: DockerLabel[];
}) {
  const labels = new Map<string, string>();

  for (const label of params.customLabels) {
    labels.set(label.key, label.value);
  }

  for (const label of params.generatedLabels) {
    labels.set(label.key, label.value);
  }

  return Array.from(labels.entries()).map(([key, value]) => ({
    key,
    value,
  }));
}