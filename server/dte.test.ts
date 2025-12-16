import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(role: "admin" | "gestor" | "politico" | "demo" | "user" = "admin"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "email",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAnonymousContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("DTE System - Auth", () => {
  it("returns user data when authenticated", async () => {
    const ctx = createMockContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeDefined();
    expect(result?.role).toBe("admin");
    expect(result?.email).toBe("test@example.com");
  });

  it("returns null when not authenticated", async () => {
    const ctx = createAnonymousContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeNull();
  });
});

describe("DTE System - Demo Data", () => {
  it("allows anonymous access to demo data", async () => {
    const ctx = createAnonymousContext();
    const caller = appRouter.createCaller(ctx);

    // Demo getData should be accessible without authentication
    const result = await caller.demo.getData({ dataType: "eleitorado_demo" });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns demo data for authenticated users", async () => {
    const ctx = createMockContext("demo");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.demo.getData({});

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("DTE System - Eleitorado Stats", () => {
  it("returns eleitorado statistics", async () => {
    const ctx = createMockContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.eleitorado.stats();

    expect(result).toBeDefined();
    expect(result).toHaveProperty("totalEleitores");
    // The result contains various demographic statistics
    expect(typeof result).toBe("object");
  });
});

describe("DTE System - Role-Based Access", () => {
  it("admin can access user list", async () => {
    const ctx = createMockContext("admin");
    const caller = appRouter.createCaller(ctx);

    // This should not throw for admin
    const result = await caller.users.list();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("gestor can access importacoes list", async () => {
    const ctx = createMockContext("gestor");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.importacoes.list();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});
