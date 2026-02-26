import { describe, it, expect } from "vitest";
import { connectionFormSchema, validateConnectionForm } from "../connection";

const validConnection = {
  name: "My Cluster",
  hosts: "localhost",
  port: "3000",
  color: "#ff0000",
};

describe("connectionFormSchema", () => {
  describe("valid inputs", () => {
    it("accepts a valid connection with single host", () => {
      const result = connectionFormSchema.safeParse(validConnection);
      expect(result.success).toBe(true);
    });

    it("accepts multiple comma-separated hosts", () => {
      const result = connectionFormSchema.safeParse({
        ...validConnection,
        hosts: "host1,host2,host3",
      });
      expect(result.success).toBe(true);
    });

    it("accepts hosts with spaces around commas", () => {
      const result = connectionFormSchema.safeParse({
        ...validConnection,
        hosts: "host1 , host2 , host3",
      });
      expect(result.success).toBe(true);
    });

    it("accepts port at lower boundary (1)", () => {
      const result = connectionFormSchema.safeParse({
        ...validConnection,
        port: "1",
      });
      expect(result.success).toBe(true);
    });

    it("accepts port at upper boundary (65535)", () => {
      const result = connectionFormSchema.safeParse({
        ...validConnection,
        port: "65535",
      });
      expect(result.success).toBe(true);
    });

    it("accepts optional username and password", () => {
      const result = connectionFormSchema.safeParse({
        ...validConnection,
        username: "admin",
        password: "secret",
      });
      expect(result.success).toBe(true);
    });

    it("accepts connection without username and password", () => {
      const result = connectionFormSchema.safeParse(validConnection);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBeUndefined();
        expect(result.data.password).toBeUndefined();
      }
    });
  });

  describe("name validation", () => {
    it("rejects empty name", () => {
      const result = connectionFormSchema.safeParse({
        ...validConnection,
        name: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects name exceeding 100 characters", () => {
      const result = connectionFormSchema.safeParse({
        ...validConnection,
        name: "a".repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it("accepts name at max length (100 characters)", () => {
      const result = connectionFormSchema.safeParse({
        ...validConnection,
        name: "a".repeat(100),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("hosts validation", () => {
    it("rejects empty hosts string", () => {
      const result = connectionFormSchema.safeParse({
        ...validConnection,
        hosts: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects hosts with only commas and spaces", () => {
      const result = connectionFormSchema.safeParse({
        ...validConnection,
        hosts: " , , ",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("port validation", () => {
    it("rejects port 0 (below minimum)", () => {
      const result = connectionFormSchema.safeParse({
        ...validConnection,
        port: "0",
      });
      expect(result.success).toBe(false);
    });

    it("rejects port 65536 (above maximum)", () => {
      const result = connectionFormSchema.safeParse({
        ...validConnection,
        port: "65536",
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-numeric port", () => {
      const result = connectionFormSchema.safeParse({
        ...validConnection,
        port: "abc",
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative port", () => {
      const result = connectionFormSchema.safeParse({
        ...validConnection,
        port: "-1",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("color validation", () => {
    it("rejects empty color", () => {
      const result = connectionFormSchema.safeParse({
        ...validConnection,
        color: "",
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid 6-digit hex color", () => {
      const result = connectionFormSchema.safeParse({
        ...validConnection,
        color: "#ff00aa",
      });
      expect(result.success).toBe(true);
    });

    it("accepts uppercase hex color", () => {
      const result = connectionFormSchema.safeParse({
        ...validConnection,
        color: "#FF00AA",
      });
      expect(result.success).toBe(true);
    });

    it("accepts mixed case hex color", () => {
      const result = connectionFormSchema.safeParse({
        ...validConnection,
        color: "#aB12cD",
      });
      expect(result.success).toBe(true);
    });

    it("rejects color without hash prefix", () => {
      const result = connectionFormSchema.safeParse({
        ...validConnection,
        color: "ff0000",
      });
      expect(result.success).toBe(false);
    });

    it("rejects 3-digit hex shorthand", () => {
      const result = connectionFormSchema.safeParse({
        ...validConnection,
        color: "#f00",
      });
      expect(result.success).toBe(false);
    });

    it("rejects 8-digit hex (with alpha)", () => {
      const result = connectionFormSchema.safeParse({
        ...validConnection,
        color: "#ff0000ff",
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-hex characters", () => {
      const result = connectionFormSchema.safeParse({
        ...validConnection,
        color: "#gghhii",
      });
      expect(result.success).toBe(false);
    });

    it("rejects named colors", () => {
      const result = connectionFormSchema.safeParse({
        ...validConnection,
        color: "red",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("clusterName validation", () => {
    it("accepts connection without clusterName", () => {
      const result = connectionFormSchema.safeParse(validConnection);
      expect(result.success).toBe(true);
    });

    it("accepts connection with valid clusterName", () => {
      const result = connectionFormSchema.safeParse({
        ...validConnection,
        clusterName: "my-cluster",
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty string clusterName", () => {
      const result = connectionFormSchema.safeParse({
        ...validConnection,
        clusterName: "",
      });
      expect(result.success).toBe(true);
    });

    it("accepts clusterName at max length (255 characters)", () => {
      const result = connectionFormSchema.safeParse({
        ...validConnection,
        clusterName: "a".repeat(255),
      });
      expect(result.success).toBe(true);
    });

    it("rejects clusterName exceeding 255 characters", () => {
      const result = connectionFormSchema.safeParse({
        ...validConnection,
        clusterName: "a".repeat(256),
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("validateConnectionForm", () => {
  it("returns success for valid data", () => {
    const result = validateConnectionForm(validConnection);
    expect(result.success).toBe(true);
  });

  it("returns error for invalid data", () => {
    const result = validateConnectionForm({ ...validConnection, name: "" });
    expect(result.success).toBe(false);
  });
});
