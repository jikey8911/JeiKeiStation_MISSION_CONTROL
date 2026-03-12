import { Express, Request, Response } from "express";
import axios from "axios";

/**
 * Este proxy traduce las peticiones estándar de OpenAI (/v1/chat/completions)
 * a los endpoints específicos del servidor de IA de Docker.
 */
export function registerAIProxyRoutes(app: Express) {
    // Interceptamos cualquier petición POST a v1 (como /chat/completions o /responses)
    app.post("/openai/v1/*", async (req: Request, res: Response) => {
        const subPath = req.params[0];
        console.log(`[AI Proxy] POST request received for: /v1/${subPath}`);

        const dockerAIUrl = process.env.DOCKER_AI_URL || "http://host.docker.internal:8000";

        // Redirigimos todas las peticiones de inferencia al endpoint principal
        const targetUrl = `${dockerAIUrl}/v1/chat/inference/intent`;

        try {
            console.log(`[AI Proxy] Forwarding ${subPath} to: ${targetUrl}`);

            const response = await axios.post(targetUrl, req.body, {
                headers: { "Content-Type": "application/json" },
                timeout: 90000
            });

            res.status(response.status).json(response.data);
        } catch (error: any) {
            console.error(`[AI Proxy] Error forwarding ${subPath}:`, error.message);
            if (error.response) {
                res.status(error.response.status).json(error.response.data);
            } else {
                res.status(500).json({ error: "Bridge/Proxy Error", details: error.message });
            }
        }
    });

    // Proxy para la lista de modelos (necesario para la validación inicial de OpenClaw)
    app.get("/openai/v1/models", async (req: Request, res: Response) => {
        const dockerAIUrl = process.env.DOCKER_AI_URL || "http://host.docker.internal:8000";
        try {
            const response = await axios.get(`${dockerAIUrl}/v1/models`);
            res.status(response.status).json(response.data);
        } catch {
            // Fallback estático si el servidor de IA no responde a /models
            res.json({
                object: "list",
                data: [
                    {
                        id: "docker.io/ai/llama3.2:latest",
                        object: "model",
                        created: Date.now(),
                        owned_by: "docker"
                    }
                ]
            });
        }
    });
}
