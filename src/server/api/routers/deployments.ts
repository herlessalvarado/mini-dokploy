import { desc } from "drizzle-orm";

import { publicProcedure, router } from "../trpc";
import { db } from "@/server/db";
import { deployments } from "@/server/db/schema";

export const deploymentsRouter = router({
  list: publicProcedure.query(async () => {
    return db
      .select()
      .from(deployments)
      .orderBy(desc(deployments.createdAt));
  }),
});