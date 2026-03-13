import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getUserByOpenId } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const clerkUser = await (sdk as any).authenticateRequest(opts.req);
    if (clerkUser && clerkUser.sub) {
      // Obtener o crear el usuario en nuestra base de datos
      const dbUser = await getUserByOpenId(clerkUser.sub);
      
      if (dbUser) {
        user = dbUser;
      } else {
        // Auto-registro: Crear el usuario si no existe
        const { upsertUser } = await import("../db");
        user = await upsertUser({
          openId: clerkUser.sub,
          name: clerkUser.name || clerkUser.email || "User",
          email: clerkUser.email || null,
          loginMethod: "clerk",
          lastSignedIn: new Date(),
        }) as User;
      }
    }
  } catch (error) {
    console.warn("[Context] Unauthorized or User not found:", error instanceof Error ? error.message : "Auth Check Failed");
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
