import { describe, it, expect } from "vitest";
import { createIndexSchema } from "../index-form";

const validIndex = {
  name: "idx_bin_int",
  namespace: "test",
  set: "sample_set",
  bin: "bin_int",
  type: "numeric" as const,
};

describe("createIndexSchema", () => {
  describe("valid inputs", () => {
    it("accepts valid index with numeric type", () => {
      const result = createIndexSchema.safeParse(validIndex);
      expect(result.success).toBe(true);
    });

    it("accepts valid index with string type", () => {
      const result = createIndexSchema.safeParse({
        ...validIndex,
        type: "string",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid index with geo2dsphere type", () => {
      const result = createIndexSchema.safeParse({
        ...validIndex,
        type: "geo2dsphere",
      });
      expect(result.success).toBe(true);
    });

    it("accepts index name with dots, hyphens, and underscores", () => {
      const result = createIndexSchema.safeParse({
        ...validIndex,
        name: "my.index-name_01",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("name validation", () => {
    it("rejects empty index name", () => {
      const result = createIndexSchema.safeParse({
        ...validIndex,
        name: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects index name exceeding 256 characters", () => {
      const result = createIndexSchema.safeParse({
        ...validIndex,
        name: "a".repeat(257),
      });
      expect(result.success).toBe(false);
    });

    it("accepts index name at max length (256 characters)", () => {
      const result = createIndexSchema.safeParse({
        ...validIndex,
        name: "a".repeat(256),
      });
      expect(result.success).toBe(true);
    });

    it("rejects index name with spaces", () => {
      const result = createIndexSchema.safeParse({
        ...validIndex,
        name: "index name",
      });
      expect(result.success).toBe(false);
    });

    it("rejects index name with special characters", () => {
      const result = createIndexSchema.safeParse({
        ...validIndex,
        name: "index@name!",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("namespace validation", () => {
    it("rejects empty namespace", () => {
      const result = createIndexSchema.safeParse({
        ...validIndex,
        namespace: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("set validation", () => {
    it("rejects empty set name", () => {
      const result = createIndexSchema.safeParse({
        ...validIndex,
        set: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("bin validation", () => {
    it("rejects empty bin name", () => {
      const result = createIndexSchema.safeParse({
        ...validIndex,
        bin: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("type validation", () => {
    it("rejects invalid index type", () => {
      const result = createIndexSchema.safeParse({
        ...validIndex,
        type: "invalid_type",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty index type", () => {
      const result = createIndexSchema.safeParse({
        ...validIndex,
        type: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("missing required fields", () => {
    it("rejects when name is missing", () => {
      const { name: _, ...withoutName } = validIndex;
      const result = createIndexSchema.safeParse(withoutName);
      expect(result.success).toBe(false);
    });

    it("rejects when namespace is missing", () => {
      const { namespace: _, ...withoutNamespace } = validIndex;
      const result = createIndexSchema.safeParse(withoutNamespace);
      expect(result.success).toBe(false);
    });

    it("rejects when set is missing", () => {
      const { set: _, ...withoutSet } = validIndex;
      const result = createIndexSchema.safeParse(withoutSet);
      expect(result.success).toBe(false);
    });

    it("rejects when bin is missing", () => {
      const { bin: _, ...withoutBin } = validIndex;
      const result = createIndexSchema.safeParse(withoutBin);
      expect(result.success).toBe(false);
    });

    it("rejects when type is missing", () => {
      const { type: _, ...withoutType } = validIndex;
      const result = createIndexSchema.safeParse(withoutType);
      expect(result.success).toBe(false);
    });
  });
});
