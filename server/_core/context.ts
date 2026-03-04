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
    const clerkUser = await sdk.authenticateRequest(opts.req);
    if (clerkUser && clerkUser.sub) {
      // Intentar obtener el usuario de nuestra base de datos usando el openId (sub de Clerk)
      const dbUser = await getUserByOpenId(clerkUser.sub);
      if (dbUser) {
        user = dbUser;
      } else {
        // Si no existe en la DB, devolvemos un objeto parcial o nulo
        // En una app real, aquí podrías hacer un auto-registro (upsert)
        user = null;
      }
    }
  } catch (error) {
    console.error("[Context] Error creating context:", error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
