import { clerkClient } from "@clerk/clerk-sdk-node";
import axios from "axios";
import { ENV } from "./env";

export const sdk = {
  async authenticateRequest(req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.__session;
    if (!token) throw new Error("No token provided");
    return await (clerkClient as any).verifyToken(token);
  },

  async exchangeCodeForToken(code: string, state: string) {
    const response = await axios.post(`${ENV.oAuthServerUrl}/api/oauth/token`, {
      code,
      state,
      appId: ENV.appId
    });
    return response.data;
  },

  async getUserInfo(accessToken: string) {
    const response = await axios.get(`${ENV.oAuthServerUrl}/api/oauth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  },

  async createSessionToken(openId: string, options: any) {
    // Generar un token JWT o similar para la sesión local
    const response = await axios.post(`${ENV.oAuthServerUrl}/api/oauth/session`, {
      openId,
      ...options
    });
    return response.data.token;
  }
};
