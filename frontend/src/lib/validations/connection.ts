import { z } from "zod";

export const connectionFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  hosts: z
    .string()
    .min(1, "At least one host is required")
    .refine(
      (val) =>
        val
          .split(",")
          .map((h) => h.trim())
          .filter(Boolean).length > 0,
      "At least one valid host is required",
    ),
  port: z.string().refine((val) => {
    const num = parseInt(val, 10);
    return !isNaN(num) && num >= 1 && num <= 65535;
  }, "Port must be between 1 and 65535"),
  username: z.string().optional(),
  password: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex color (e.g., #ff0000)"),
  clusterName: z.string().max(255).optional().or(z.literal("")),
});

export type ConnectionFormValues = z.infer<typeof connectionFormSchema>;

/** Schema for validating imported connection objects (JSON array entries). */
export const connectionImportSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  hosts: z.array(z.string().min(1)).min(1, "At least one host is required"),
  port: z.number().int().min(1).max(65535),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  username: z.string().optional(),
  password: z.string().optional(),
});

export function validateConnectionForm(data: ConnectionFormValues) {
  return connectionFormSchema.safeParse(data);
}
