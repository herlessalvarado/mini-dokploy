import { randomUUID } from "crypto";

import { desc } from "drizzle-orm";
import { z } from "zod";

import { publicProcedure, router } from "../trpc";
import { db } from "@/server/db";
import { deployments } from "@/server/db/schema";

const customLabelSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});

const createDeploymentSchema = z.object({
  repoUrl: z.string().url("Please enter a valid Git repo URL"),
  dockerfilePath: z.string().min(1, "Dockerfile path is required"),
  exposedPort: z.coerce
    .number()
    .int()
    .positive("Exposed port must be a positive number"),
  customLabels: z.array(customLabelSchema).optional().default([]),
});

export const deploymentsRouter = router({
  list: publicProcedure.query(async () => {
    return db
      .select()
      .from(deployments)
      .orderBy(desc(deployments.createdAt));
  }),

  create: publicProcedure
    .input(createDeploymentSchema)
    .mutation(async ({ input }) => {
      const id = randomUUID();
      const shortId = id.slice(0, 8);

      const name = `app-${shortId}`;
      const serviceName = `mini-dokploy-${shortId}`;
      const imageTag = `mini-dokploy/${shortId}:${Date.now()}`;
      const domain = `app-${shortId}.127.0.0.1.sslip.io`;

      const now = new Date();

      const [deployment] = await db
        .insert(deployments)
        .values({
          id,
          name,
          repoUrl: input.repoUrl,
          dockerfilePath: input.dockerfilePath,
          exposedPort: input.exposedPort,
          imageTag,
          serviceName,
          domain,
          status: "building",
          customLabelsJson: JSON.stringify(input.customLabels),
          errorMessage: null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return deployment;
    }),
});