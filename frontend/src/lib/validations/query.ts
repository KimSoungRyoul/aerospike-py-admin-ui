import { z } from "zod";

const binValueSchema: z.ZodType = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(binValueSchema),
    z.record(z.string(), binValueSchema),
  ]),
);

export const queryPredicateSchema = z.object({
  bin: z.string().min(1, "Bin name is required"),
  operator: z.enum(["equals", "between", "contains", "geo_within_region", "geo_contains_point"], {
    message: "Operator is required",
  }),
  value: binValueSchema,
  value2: binValueSchema.optional(),
});

export const queryRequestSchema = z.object({
  namespace: z.string().min(1, "Namespace is required"),
  set: z.string().optional(),
  predicate: queryPredicateSchema.optional(),
  selectBins: z.array(z.string()).optional(),
  expression: z.string().optional(),
  maxRecords: z.number().int().positive().optional(),
  primaryKey: z.string().optional(),
});

export type QueryPredicateFormValues = z.infer<typeof queryPredicateSchema>;
export type QueryRequestFormValues = z.infer<typeof queryRequestSchema>;
