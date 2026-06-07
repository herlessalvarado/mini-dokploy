import { randomUUID } from "crypto";

import { db } from "../src/server/db";
import { deployments } from "../src/server/db/schema";

async function main() {
  const id = randomUUID();
  const shortId = id.slice(0, 8);

  await db.insert(deployments).values({
    id,
    name: `test-${shortId}`,
    repoUrl: "https://github.com/example/repo",
    dockerfilePath: "Dockerfile",
    exposedPort: 3000,
    imageTag: `mini-dokploy/${shortId}:latest`,
    serviceName: `mini-dokploy-${shortId}`,
    domain: `app-${shortId}.127.0.0.1.sslip.io`,
    status: "building",
    customLabelsJson: null,
    errorMessage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const rows = await db.select().from(deployments);

  console.log(rows);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});