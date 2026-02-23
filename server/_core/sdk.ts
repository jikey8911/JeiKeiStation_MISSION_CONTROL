import { clerkClient } from "@clerk/clerk-sdk-node";

export const sdk = {
  async authenticateRequest(req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new Error("No token provided");
    return await clerkClient.verifyToken(token);
  }
};
