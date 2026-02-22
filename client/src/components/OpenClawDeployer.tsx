import { useState } from "react";
import { Copy, LogIn } from "lucide-react";
import { Toaster, toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AIProvider = "openai" | "gemini" | "anthropic" | "ollama";

/**
 * @component OpenClawDeployer
 * @description Componente para que los usuarios configuren y obtengan los comandos de despliegue
 * para su agente de IA personal (OpenClaw). Permite seleccionar un proveedor de IA,
 * introducir una clave de API y elegir un método de despliegue (Local o Cloud).
 */
export function OpenClawDeployer() {
  const [provider, setProvider] = useState<AIProvider>("openai");
  const [apiKey, setApiKey] = useState<string>("");
  const [jwt, setJwt] = useState<string | null>(null);
  const [email, setEmail] = useState("developer@jeikei.ai");
  const [password, setPassword] = useState("password");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) throw new Error("Error en el login");
      const data = await response.json();
      setJwt(data.access_token);
      toast.success("¡Autenticación exitosa! Token generado.");
    } catch (error) {
      toast.error("No se pudo autenticar. ¿El backend está corriendo en http://127.0.0.1:8000?");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const generatedCommand = `export JEIKEI_AGENT_TOKEN="${jwt || '{TU_TOKEN_JWT}'}"\ncurl -sL https://jeikei.ai/install.sh | bash -s -- --llm-provider=${provider} --llm-key=${apiKey || '{TU_API_KEY}'}`;

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedCommand);
    toast.success("Comando copiado al portapapeles.");
  };

  // Si no está logueado, mostrar el formulario de login
  if (!jwt) {
    return (
      <>
        <Toaster position="bottom-right" richColors />
        <Card className="w-full max-w-md mx-auto bg-gray-900/60 dark:bg-black/80 border-white/10 backdrop-blur-sm text-white">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Autenticación Requerida</CardTitle>
            <CardDescription className="text-gray-400">
              Inicia sesión para generar tu token de despliegue de OpenClaw.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
                placeholder="tu@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
                placeholder="••••••••"
              />
            </div>
            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              <LogIn className="mr-2 h-4 w-4" />
              {isLoading ? "Autenticando..." : "Iniciar Sesión y Obtener Token"}
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  // Si está logueado, mostrar el Deployer
  return (
    <>
      <Toaster position="bottom-right" richColors />
      <Card className="w-full max-w-2xl mx-auto bg-gray-900/60 dark:bg-black/80 border-white/10 backdrop-blur-sm text-white">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">OpenClaw Agent Deployer</CardTitle>
          <CardDescription className="text-gray-400">
            Configura y despliega tu agente de IA personal en segundos. Conecta tu propia clave de LLM (BYOK).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sección 1: Configuración del Proveedor y API Key */}
          <div className="space-y-4 p-4 border border-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold">1. Configuración del Proveedor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider-select">Proveedor de IA</Label>
                <Select
                  onValueChange={(value) => setProvider(value as AIProvider)}
                  defaultValue={provider}
                >
                  <SelectTrigger
                    id="provider-select"
                    className="w-full bg-gray-800 border-gray-600 text-white"
                  >
                    <SelectValue placeholder="Selecciona un proveedor" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 text-white">
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="gemini">Google Gemini</SelectItem>
                    <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                    <SelectItem value="ollama">Ollama (Local)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-key-input">
                  {provider === "ollama" ? "URL del Host (Opcional)" : "API Key"}
                </Label>
                <Input
                  id="api-key-input"
                  type="password"
                  placeholder={
                    provider === "ollama"
                      ? "Ej: http://localhost:11434"
                      : "Pega tu clave aquí"
                  }
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-gray-800 border-gray-600 placeholder:text-gray-500 text-white"
                />
              </div>
            </div>
            {provider === "ollama" && (
              <p className="text-xs text-gray-400 pt-2">
                Para Ollama, la clave no es necesaria. Puedes especificar una URL si no se ejecuta en el host local por defecto.
              </p>
            )}
          </div>

          {/* Sección 2: Opciones de Despliegue */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">2. Elige tu método de despliegue</h3>
            <Tabs defaultValue="local" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                <TabsTrigger value="local">Local / Terminal</TabsTrigger>
                <TabsTrigger value="cloud">Cloud (Railway)</TabsTrigger>
              </TabsList>

              {/* Tab de Despliegue Local */}
              <TabsContent value="local">
                <Card className="bg-black mt-4 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-base text-gray-300">
                      Ejecuta en tu terminal
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-sm">
                      Copia y pega este comando para descargar, instalar y ejecutar tu agente.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-900 rounded-md p-4 flex items-start justify-between gap-4 font-mono text-sm text-green-400">
                      <pre className="overflow-x-auto whitespace-pre-wrap break-all flex-1">
                        <code>{generatedCommand}</code>
                      </pre>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopyToClipboard}
                        className="text-gray-400 hover:text-white flex-shrink-0 mt-1"
                      >
                        <Copy className="h-5 w-5" />
                        <span className="sr-only">Copiar comando</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab de Despliegue en Cloud */}
              <TabsContent value="cloud">
                <Card className="bg-gray-900/50 mt-4 border-gray-700">
                  <CardContent className="pt-6 flex flex-col items-center justify-center text-center space-y-4">
                    <p className="text-gray-300">
                      Haz clic en el botón para desplegar tu agente en Railway. Las variables de
                      entorno, como tu{" "}
                      <code className="bg-gray-700 text-amber-400 text-xs p-1 rounded-sm mx-1">
                        JEIKEI_AGENT_TOKEN
                      </code>{" "}
                      y{" "}
                      <code className="bg-gray-700 text-amber-400 text-xs p-1 rounded-sm mx-1">
                        LLM_API_KEY
                      </code>
                      , se inyectarán automáticamente en tu proyecto de Railway.
                    </p>
                    <a
                      href={`https://railway.app/new/clone?template=https://github.com/jeikei/openclaw-template&envs=JEIKEI_AGENT_TOKEN,LLM_PROVIDER,LLM_API_KEY&JEIKEI_AGENT_TOKEN=${jwt}&LLM_PROVIDER=${provider}&LLM_API_KEY=${apiKey}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button
                        size="lg"
                        className="w-full bg-black border border-white/20 hover:bg-gray-900 text-white font-bold py-6 text-lg"
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="mr-2"
                        >
                          <path d="M4.125 3.75H19.875V7.5H4.125V3.75Z" fill="currentColor"></path>
                          <path d="M4.125 9.375H19.875V13.125H4.125V9.375Z" fill="currentColor"></path>
                          <path d="M4.125 15H12V18.75H4.125V15Z" fill="currentColor"></path>
                        </svg>
                        Deploy on Railway
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
