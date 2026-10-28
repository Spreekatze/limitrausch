import { z } from "zod";
import { localizedLabelsSchema } from "./localizationSchema.js";
import { JOB_ID } from "../data/jobId.js";
import { ROLE_TYPE } from "../data/roleType.js";

export const jobIdSchema = z.enum(JOB_ID);
export type JobId = z.infer<typeof jobIdSchema>;

export const roleTypeSchema = z.enum(ROLE_TYPE);
export type RoleType = z.infer<typeof roleTypeSchema>;

export const jobSchema = z.object({
  id: jobIdSchema,
  role: roleTypeSchema,
  name: localizedLabelsSchema,
  shortName: localizedLabelsSchema.optional(),
  raidHelperName: z.string().optional(),
});
export type Job = z.infer<typeof jobSchema>;
