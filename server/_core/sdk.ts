import { clerkClient } from "@clerk/clerk-sdk-node";

export const sdk = {
  async authenticateRequest(req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return null;
    try {
      return await clerkClient.verifyToken(token);
    } catch (error) {
      console.error("[Clerk] Token verification failed:", error);
      return null;
    }
  },

  // Funciones placeholder para OAuth si se usan en el proyecto
  // Nota: Si usas Clerk, el flujo de OAuth suele manejarse en el frontend
  async exchangeCodeForToken(code: string, state: string) {
    console.log("[SDK] exchangeCodeForToken called (placeholder)");
    return { accessToken: "mock_token" };
  },

  async getUserInfo(accessToken: string) {
    console.log("[SDK] getUserInfo called (placeholder)");
    return { openId: "mock_id", name: "Mock User", email: "mock@example.com", loginMethod: "mock" };
  },

  async createSessionToken(openId: string, options: any) {
    console.log("[SDK] createSessionToken called (placeholder)");
    return "mock_session_token";
  }
};
