import { z } from "zod";

const httpsPoster = z.string().trim().max(2048).refine((s) => {
  try {
    const parsed = new URL(s);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}, "Ảnh bìa phải là URL HTTPS hợp lệ");

export const MoviePatchSchema = z.object({
  expectedVersion: z.number().int().min(0),
  titleOverride: z.string().trim().min(1).max(180).nullable().optional(),
  posterOverride: httpsPoster.nullable().optional(),
  hidden: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).some((k) => k !== "expectedVersion"), "Không có thay đổi");

export function validateSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9_-]{0,190}$/i.test(slug);
}
