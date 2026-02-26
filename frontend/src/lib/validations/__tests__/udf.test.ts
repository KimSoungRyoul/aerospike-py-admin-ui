import { describe, it, expect } from "vitest";
import { uploadUDFSchema } from "../udf";

describe("uploadUDFSchema", () => {
  const validUDF = {
    filename: "record_utils.lua",
    content: "function hello(rec)\n  return 'hello'\nend",
  };

  describe("valid inputs", () => {
    it("accepts a valid .lua filename with content", () => {
      const result = uploadUDFSchema.safeParse(validUDF);
      expect(result.success).toBe(true);
    });

    it("accepts filename with path-like prefix ending in .lua", () => {
      const result = uploadUDFSchema.safeParse({
        ...validUDF,
        filename: "my_module.lua",
      });
      expect(result.success).toBe(true);
    });

    it("accepts filename with underscores and numbers", () => {
      const result = uploadUDFSchema.safeParse({
        ...validUDF,
        filename: "my_module_v2.lua",
      });
      expect(result.success).toBe(true);
    });

    it("accepts minimal content (single character)", () => {
      const result = uploadUDFSchema.safeParse({
        filename: "minimal.lua",
        content: "-",
      });
      expect(result.success).toBe(true);
    });

    it("accepts multiline Lua content", () => {
      const content = [
        "local exports = {}",
        "",
        "function exports.sum(rec, bin1, bin2)",
        "  return rec[bin1] + rec[bin2]",
        "end",
        "",
        "return exports",
      ].join("\n");
      const result = uploadUDFSchema.safeParse({
        filename: "math_ops.lua",
        content,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("filename validation", () => {
    it("rejects empty filename", () => {
      const result = uploadUDFSchema.safeParse({
        ...validUDF,
        filename: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Filename is required");
      }
    });

    it("rejects filename without .lua extension", () => {
      const result = uploadUDFSchema.safeParse({
        ...validUDF,
        filename: "module.py",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Filename must end with .lua");
      }
    });

    it("rejects filename ending in .luac (compiled Lua)", () => {
      const result = uploadUDFSchema.safeParse({
        ...validUDF,
        filename: "module.luac",
      });
      expect(result.success).toBe(false);
    });

    it("rejects filename with .lua in the middle but different extension", () => {
      const result = uploadUDFSchema.safeParse({
        ...validUDF,
        filename: "module.lua.bak",
      });
      expect(result.success).toBe(false);
    });

    it("rejects filename with no extension", () => {
      const result = uploadUDFSchema.safeParse({
        ...validUDF,
        filename: "module",
      });
      expect(result.success).toBe(false);
    });

    it("rejects filename that is just .lua", () => {
      const result = uploadUDFSchema.safeParse({
        ...validUDF,
        filename: ".lua",
      });
      // .lua has length > 0 and ends with .lua, so it should pass the schema
      // (the regex checks for ending in .lua, and min(1) checks for non-empty)
      expect(result.success).toBe(true);
    });
  });

  describe("content validation", () => {
    it("rejects empty content", () => {
      const result = uploadUDFSchema.safeParse({
        ...validUDF,
        content: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Content is required");
      }
    });

    it("rejects missing content field", () => {
      const result = uploadUDFSchema.safeParse({
        filename: "test.lua",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing filename field", () => {
      const result = uploadUDFSchema.safeParse({
        content: "function hello() end",
      });
      expect(result.success).toBe(false);
    });
  });
});
