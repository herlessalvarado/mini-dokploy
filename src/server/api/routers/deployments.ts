import { createDeploymentIdentity } from "@/server/services/deployment-identity";

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
      const identity = createDeploymentIdentity();

      const now = new Date();

      const [deployment] = await db
        .insert(deployments)
        .values({
          id: identity.id,
          name: identity.name,
          repoUrl: input.repoUrl,
          dockerfilePath: input.dockerfilePath,
          exposedPort: input.exposedPort,
          imageTag: identity.imageTag,
          serviceName: identity.serviceName,
          domain: identity.domain,
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