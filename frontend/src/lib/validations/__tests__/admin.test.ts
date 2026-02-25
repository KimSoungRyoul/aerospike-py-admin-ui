import { describe, it, expect } from "vitest";
import { createUserSchema, changePasswordSchema, createRoleSchema } from "../admin";

describe("createUserSchema", () => {
  const validUser = {
    username: "admin_user",
    password: "securePass123",
    roles: ["read-write"],
  };

  describe("valid inputs", () => {
    it("accepts a valid user with username, password, and roles", () => {
      const result = createUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("accepts username with dots, hyphens, and underscores", () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        username: "user.name-test_01",
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty roles array", () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        roles: [],
      });
      expect(result.success).toBe(true);
    });

    it("accepts multiple roles", () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        roles: ["read", "write", "sys-admin"],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("username validation", () => {
    it("rejects empty username", () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        username: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects username exceeding 63 characters", () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        username: "a".repeat(64),
      });
      expect(result.success).toBe(false);
    });

    it("accepts username at max length (63 characters)", () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        username: "a".repeat(63),
      });
      expect(result.success).toBe(true);
    });

    it("rejects username with spaces", () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        username: "user name",
      });
      expect(result.success).toBe(false);
    });

    it("rejects username with special characters", () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        username: "user@name!",
      });
      expect(result.success).toBe(false);
    });

    it("rejects username with slash", () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        username: "user/name",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("password validation", () => {
    it("rejects empty password", () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        password: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password exceeding 256 characters", () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        password: "a".repeat(257),
      });
      expect(result.success).toBe(false);
    });

    it("accepts password at max length (256 characters)", () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        password: "a".repeat(256),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("roles validation", () => {
    it("rejects when roles is not an array", () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        roles: "read-write",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("changePasswordSchema", () => {
  it("accepts a valid password", () => {
    const result = changePasswordSchema.safeParse({ password: "newPassword123" });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = changePasswordSchema.safeParse({ password: "" });
    expect(result.success).toBe(false);
  });

  it("rejects password exceeding 256 characters", () => {
    const result = changePasswordSchema.safeParse({ password: "a".repeat(257) });
    expect(result.success).toBe(false);
  });

  it("accepts password at max length (256 characters)", () => {
    const result = changePasswordSchema.safeParse({ password: "a".repeat(256) });
    expect(result.success).toBe(true);
  });
});

describe("createRoleSchema", () => {
  const validRole = {
    name: "custom-role",
    privileges: ["read"],
  };

  describe("valid inputs", () => {
    it("accepts a valid role with name and privileges", () => {
      const result = createRoleSchema.safeParse(validRole);
      expect(result.success).toBe(true);
    });

    it("accepts role name with dots, hyphens, and underscores", () => {
      const result = createRoleSchema.safeParse({
        ...validRole,
        name: "my.custom_role-01",
      });
      expect(result.success).toBe(true);
    });

    it("accepts optional whitelist", () => {
      const result = createRoleSchema.safeParse({
        ...validRole,
        whitelist: "10.0.0.0/8",
      });
      expect(result.success).toBe(true);
    });

    it("accepts optional readQuota and writeQuota", () => {
      const result = createRoleSchema.safeParse({
        ...validRole,
        readQuota: "1000",
        writeQuota: "500",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("name validation", () => {
    it("rejects empty role name", () => {
      const result = createRoleSchema.safeParse({
        ...validRole,
        name: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects role name exceeding 63 characters", () => {
      const result = createRoleSchema.safeParse({
        ...validRole,
        name: "a".repeat(64),
      });
      expect(result.success).toBe(false);
    });

    it("accepts role name at max length (63 characters)", () => {
      const result = createRoleSchema.safeParse({
        ...validRole,
        name: "a".repeat(63),
      });
      expect(result.success).toBe(true);
    });

    it("rejects role name with spaces", () => {
      const result = createRoleSchema.safeParse({
        ...validRole,
        name: "role name",
      });
      expect(result.success).toBe(false);
    });

    it("rejects role name with special characters", () => {
      const result = createRoleSchema.safeParse({
        ...validRole,
        name: "role@name!",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("privileges validation", () => {
    it("rejects empty privileges array", () => {
      const result = createRoleSchema.safeParse({
        ...validRole,
        privileges: [],
      });
      expect(result.success).toBe(false);
    });

    it("accepts multiple privileges", () => {
      const result = createRoleSchema.safeParse({
        ...validRole,
        privileges: ["read", "write", "read-write"],
      });
      expect(result.success).toBe(true);
    });
  });
});
