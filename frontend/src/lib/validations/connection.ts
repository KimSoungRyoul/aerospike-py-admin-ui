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
  color: z.string().min(1),
});

export type ConnectionFormValues = z.infer<typeof connectionFormSchema>;

export function validateConnectionForm(data: ConnectionFormValues) {
  return connectionFormSchema.safeParse(data);
}
