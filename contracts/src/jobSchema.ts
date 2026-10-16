import { z } from "zod";

export const ROLE_TYPE = {
  TANK: "Tank",
  HEALER: "Healer",
  MELEE: "Melee",
  PRANGED: "PRanged",
  CASTER: "Caster",
  LIMITED_JOB: "Limited",
  ALLROUNDER: "Allrounder",
} as const;

export const roleTypeSchema = z.enum(ROLE_TYPE);
export type RoleType = z.infer<typeof roleTypeSchema>;

export const jobSchema = z.object({
  id: z.number(),
  role: roleTypeSchema,
  germanName: z.string(),
  germanShort: z.string(),
  englishName: z.string(),
  englishShort: z.string(),
  raidHelperName: z.string(),
});
export type Job = z.infer<typeof jobSchema>;
