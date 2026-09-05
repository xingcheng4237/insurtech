import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(role?: "user" | "admin"): TrpcContext {
  const user = role
    ? {
        id: 1,
        openId: `${role}-user`,
        email: `${role}@example.com`,
        name: `${role} user`,
        loginMethod: "google",
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      }
    : null;

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => undefined,
    } as TrpcContext["res"],
  };
}

describe("server-side authorization", () => {
  it("rejects unauthenticated access to stored reports", async () => {
    const caller = appRouter.createCaller(createContext());

    await expect(caller.news.latest()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects a standard user attempting to start a collection", async () => {
    const caller = appRouter.createCaller(createContext("user"));

    await expect(caller.news.collect()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("rejects a standard user attempting to access queue details", async () => {
    const caller = appRouter.createCaller(createContext("user"));

    await expect(caller.news.jobs()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
