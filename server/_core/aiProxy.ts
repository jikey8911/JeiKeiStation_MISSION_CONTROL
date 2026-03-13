import { Express, Request, Response } from "express";
import axios from "axios";

/**
 * Este proxy traduce las peticiones estándar de OpenAI (/v1/chat/completions)
 * a los endpoints específicos del servidor de IA de Docker.
 */
export function registerAIProxyRoutes(app: Express) {
    const dockerAIUrl = process.env.DOCKER_AI_URL || "http://host.docker.internal:8000";

    // 1. Models List
    app.get("/openai/v1/models", async (req: Request, res: Response) => {
        try {
            const response = await axios.get(`${dockerAIUrl}/v1/models`);
            res.status(response.status).json(response.data);
        } catch (error) {
            res.json({
                object: "list",
                data: [{ id: "docker.io/ai/llama3.2:latest", object: "model", created: Date.now(), owned_by: "docker" }]
            });
        }
    });

    // 2. Embeddings (Dummy to avoid 404s)
    app.post("/openai/v1/embeddings", (req: Request, res: Response) => {
        console.log("[AI Proxy] Handled Embeddings (Dummy)");
        res.json({
            object: "list",
            data: [{ object: "embedding", index: 0, embedding: new Array(1536).fill(0) }],
            model: req.body.model || "llama3.2",
            usage: { prompt_tokens: 0, total_tokens: 0 }
        });
    });

    // 3. Catch-all for Chat/Responses (Forward to completions)
    app.post("/openai/v1/*", async (req: Request, res: Response) => {
        const subPath = req.params[0];
        const targetUrl = `${dockerAIUrl}/v1/chat/completions`;

        console.log(`[AI Proxy] Forwarding POST /v1/${subPath} -> ${targetUrl}`);

        try {
            const startTime = Date.now();

            // Garantizamos que el body tenga el formato que espera el servidor de chat
            const finalBody = { ...req.body };
            if (!finalBody.messages && finalBody.prompt) {
                console.log("[AI Proxy] Converting completion prompt to chat messages");
                finalBody.messages = [{ role: "user", content: finalBody.prompt }];
                delete finalBody.prompt;
            }

            if (!finalBody.model) {
                finalBody.model = "docker.io/ai/llama3.2:latest";
            }

            console.log(`[AI Proxy] Forwarding ${subPath} to: ${targetUrl} (Final Body Keys: ${Object.keys(finalBody).join(", ")})`);

            const response = await axios.post(targetUrl, finalBody, {
                headers: { "Content-Type": "application/json" },
                timeout: 180000
            });
            console.log(`[AI Proxy] SUCCESS in ${Date.now() - startTime}ms`);
            res.status(response.status).json(response.data);
        } catch (error: any) {
            console.error(`[AI Proxy] FAILED ${subPath}:`, error.message);
            if (error.response) {
                res.status(error.response.status).json(error.response.data);
            } else {
                res.status(500).json({ error: "Bridge Error", details: error.message });
            }
        }
    });
}
