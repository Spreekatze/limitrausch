import z from "zod";

export const localeSchema = z.enum(["de", "en"]);
export type Locale = z.infer<typeof localeSchema>;

export const localizedLabelsSchema = z.object({
  de: z.string(),
  en: z.string(),
});
export type LocalizedLabels = z.infer<typeof localizedLabelsSchema>;

export const localizedAliasesSchema = z.object({
  de: z.array(z.string()),
  en: z.array(z.string()),
});
export type LocalizedAliases = z.infer<typeof localizedLabelsSchema>;

export interface LabelOptions {
  labels: LocalizedLabels;
  aliases?: LocalizedAliases;
}
