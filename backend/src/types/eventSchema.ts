import { z } from "zod";

export const guildMemberSearchQuerySchema = z.string().trim().min(2).max(100);
