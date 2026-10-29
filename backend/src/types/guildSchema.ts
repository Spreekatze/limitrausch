import { guildSchema } from "@limitrausch/contracts";
import { PermissionsBitField } from "discord.js";
import z from "zod";

export const guildIdSchema = z.string().regex(/^\d{17,20}$/);

export const authGuildSchema = guildSchema.extend({
  owner: z.boolean(),
  permissions: z
    .number()
    .transform((value) => new PermissionsBitField(BigInt(value))),
});
export type AuthGuild = z.infer<typeof authGuildSchema>;
