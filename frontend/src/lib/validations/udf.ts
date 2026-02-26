import { z } from "zod";

export const uploadUDFSchema = z.object({
  filename: z
    .string()
    .min(1, "Filename is required")
    .regex(/\.lua$/, "Filename must end with .lua"),
  content: z.string().min(1, "Content is required"),
});

export type UploadUDFFormValues = z.infer<typeof uploadUDFSchema>;
