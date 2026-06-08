import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { publicProcedure, router } from "../trpc";
import { db } from "@/server/db";
import { deployments } from "@/server/db/schema";
import { createDeploymentIdentity } from "@/server/services/deployment-identity";
import {
  removeDeployment,
  runDeploymentJob,
  runRedeploymentJob,
} from "@/server/services/deployment";

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

const deploymentIdSchema = z.object({
  id: z.string().min(1),
});

export const deploymentsRouter = router({
  list: publicProcedure.query(async () => {
    return db.select().from(deployments).orderBy(desc(deployments.createdAt));
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

      void runDeploymentJob(deployment.id);

      return deployment;
    }),

  redeploy: publicProcedure
    .input(deploymentIdSchema)
    .mutation(async ({ input }) => {
      const [deployment] = await db
        .select()
        .from(deployments)
        .where(eq(deployments.id, input.id))
        .limit(1);

      if (!deployment) {
        throw new Error("Deployment not found");
      }

      if (deployment.status === "building") {
        throw new Error("Deployment is already building");
      }

      await db
        .update(deployments)
        .set({
          status: "building",
          errorMessage: null,
          updatedAt: new Date(),
        })
        .where(eq(deployments.id, input.id));

      void runRedeploymentJob(input.id);

      return { success: true };
    }),

  remove: publicProcedure
    .input(deploymentIdSchema)
    .mutation(async ({ input }) => {
      await removeDeployment(input.id);

      return { success: true };
    }),
});
