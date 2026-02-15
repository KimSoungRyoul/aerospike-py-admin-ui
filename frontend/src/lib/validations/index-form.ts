import { z } from "zod";

export const createIndexSchema = z.object({
  name: z
    .string()
    .min(1, "Index name is required")
    .max(256, "Index name is too long")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Index name contains invalid characters"),
  namespace: z.string().min(1, "Namespace is required"),
  set: z.string().min(1, "Set name is required"),
  bin: z.string().min(1, "Bin name is required"),
  type: z.enum(["numeric", "string", "geo2dsphere"], {
    message: "Index type is required",
  }),
});

export type CreateIndexFormValues = z.infer<typeof createIndexSchema>;
