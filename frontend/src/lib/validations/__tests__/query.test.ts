import { describe, it, expect } from "vitest";
import { queryPredicateSchema, queryRequestSchema } from "../query";

describe("queryPredicateSchema", () => {
  const validPredicate = {
    bin: "age",
    operator: "equals" as const,
    value: 25,
  };

  describe("valid inputs", () => {
    it("accepts a predicate with string value", () => {
      const result = queryPredicateSchema.safeParse({
        bin: "name",
        operator: "equals",
        value: "John",
      });
      expect(result.success).toBe(true);
    });

    it("accepts a predicate with numeric value", () => {
      const result = queryPredicateSchema.safeParse(validPredicate);
      expect(result.success).toBe(true);
    });

    it("accepts a predicate with boolean value", () => {
      const result = queryPredicateSchema.safeParse({
        bin: "active",
        operator: "equals",
        value: true,
      });
      expect(result.success).toBe(true);
    });

    it("accepts a predicate with null value", () => {
      const result = queryPredicateSchema.safeParse({
        bin: "field",
        operator: "equals",
        value: null,
      });
      expect(result.success).toBe(true);
    });

    it("accepts a predicate with array value", () => {
      const result = queryPredicateSchema.safeParse({
        bin: "tags",
        operator: "contains",
        value: ["a", "b", "c"],
      });
      expect(result.success).toBe(true);
    });

    it("accepts a predicate with map/object value", () => {
      const result = queryPredicateSchema.safeParse({
        bin: "metadata",
        operator: "equals",
        value: { key: "value", nested: { deep: 42 } },
      });
      expect(result.success).toBe(true);
    });

    it("accepts between operator with value2", () => {
      const result = queryPredicateSchema.safeParse({
        bin: "score",
        operator: "between",
        value: 10,
        value2: 100,
      });
      expect(result.success).toBe(true);
    });

    it("accepts geo_within_region operator", () => {
      const result = queryPredicateSchema.safeParse({
        bin: "location",
        operator: "geo_within_region",
        value: '{"type": "AeroCircle", "coordinates": [[-122.0, 37.5], 1000]}',
      });
      expect(result.success).toBe(true);
    });

    it("accepts geo_contains_point operator", () => {
      const result = queryPredicateSchema.safeParse({
        bin: "region",
        operator: "geo_contains_point",
        value: '{"type": "Point", "coordinates": [-122.0, 37.5]}',
      });
      expect(result.success).toBe(true);
    });

    it("accepts value2 as optional (undefined)", () => {
      const result = queryPredicateSchema.safeParse(validPredicate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.value2).toBeUndefined();
      }
    });
  });

  describe("invalid inputs", () => {
    it("rejects empty bin name", () => {
      const result = queryPredicateSchema.safeParse({
        ...validPredicate,
        bin: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Bin name is required");
      }
    });

    it("rejects missing bin", () => {
      const { bin: _, ...noBin } = validPredicate;
      const result = queryPredicateSchema.safeParse(noBin);
      expect(result.success).toBe(false);
    });

    it("rejects invalid operator", () => {
      const result = queryPredicateSchema.safeParse({
        ...validPredicate,
        operator: "greater_than",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing operator", () => {
      const { operator: _, ...noOp } = validPredicate;
      const result = queryPredicateSchema.safeParse(noOp);
      expect(result.success).toBe(false);
    });

    it("rejects missing value", () => {
      const { value: _, ...noValue } = validPredicate;
      const result = queryPredicateSchema.safeParse(noValue);
      expect(result.success).toBe(false);
    });

    it("rejects undefined value (value is required)", () => {
      const result = queryPredicateSchema.safeParse({
        ...validPredicate,
        value: undefined,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("queryRequestSchema", () => {
  const validRequest = {
    namespace: "test",
  };

  describe("valid inputs", () => {
    it("accepts minimal request with only namespace", () => {
      const result = queryRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("accepts request with set", () => {
      const result = queryRequestSchema.safeParse({
        ...validRequest,
        set: "users",
      });
      expect(result.success).toBe(true);
    });

    it("accepts request with predicate", () => {
      const result = queryRequestSchema.safeParse({
        ...validRequest,
        predicate: {
          bin: "age",
          operator: "between",
          value: 18,
          value2: 65,
        },
      });
      expect(result.success).toBe(true);
    });

    it("accepts request with selectBins", () => {
      const result = queryRequestSchema.safeParse({
        ...validRequest,
        selectBins: ["name", "age", "email"],
      });
      expect(result.success).toBe(true);
    });

    it("accepts request with expression filter", () => {
      const result = queryRequestSchema.safeParse({
        ...validRequest,
        expression: "bin('age') > 21",
      });
      expect(result.success).toBe(true);
    });

    it("accepts request with maxRecords", () => {
      const result = queryRequestSchema.safeParse({
        ...validRequest,
        maxRecords: 100,
      });
      expect(result.success).toBe(true);
    });

    it("accepts request with primaryKey", () => {
      const result = queryRequestSchema.safeParse({
        ...validRequest,
        primaryKey: "user-123",
      });
      expect(result.success).toBe(true);
    });

    it("accepts fully populated request", () => {
      const result = queryRequestSchema.safeParse({
        namespace: "test",
        set: "users",
        predicate: {
          bin: "age",
          operator: "equals",
          value: 30,
        },
        selectBins: ["name", "age"],
        expression: "bin('active') == true",
        maxRecords: 50,
        primaryKey: "pk-1",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects empty namespace", () => {
      const result = queryRequestSchema.safeParse({ namespace: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Namespace is required");
      }
    });

    it("rejects missing namespace", () => {
      const result = queryRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects non-integer maxRecords", () => {
      const result = queryRequestSchema.safeParse({
        ...validRequest,
        maxRecords: 10.5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects zero maxRecords", () => {
      const result = queryRequestSchema.safeParse({
        ...validRequest,
        maxRecords: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative maxRecords", () => {
      const result = queryRequestSchema.safeParse({
        ...validRequest,
        maxRecords: -10,
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid predicate within request", () => {
      const result = queryRequestSchema.safeParse({
        ...validRequest,
        predicate: {
          bin: "",
          operator: "invalid_op",
          value: 1,
        },
      });
      expect(result.success).toBe(false);
    });

    it("rejects selectBins with non-string elements", () => {
      const result = queryRequestSchema.safeParse({
        ...validRequest,
        selectBins: [123, true],
      });
      expect(result.success).toBe(false);
    });
  });
});
