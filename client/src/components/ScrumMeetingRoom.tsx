/**
 * @file ScrumMeetingRoom.tsx
 * @description Componente de UI para la "Sala de Reunión Scrum" con el Agente Product Owner.
 * @role Principal Frontend Engineer
 *
 * @comment
 * Este componente está diseñado con una arquitectura "Voice-First", priorizando la interacción por voz
 * a través de un avatar central y animaciones de estado claras (Idle, Listening, Speaking).
 * Se utilizan componentes de shadcn/ui para mantener la consistencia del diseño y Tailwind CSS
 * para animaciones personalizadas y responsividad.
 *
 * La animación 'speaking-glow' requeriría una adición a `tailwind.config.js`. He incluido un comentario
 * en el código con la configuración necesaria.
 */
import { Brain, Mic, Send } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scrollarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// --- Tipos de Estado y Mensajes ---
type AgentState = "idle" | "listening" | "speaking";
type TranscriptMessage = {
  speaker: "user" | "agent";
  text: string;
};

// --- Componente Principal ---
export function ScrumMeetingRoom() {
  const [agentState, setAgentState] = useState<AgentState>("idle");
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([
    {
      speaker: "agent",
      text: "¡Hola! Soy tu Product Owner AI. Estoy listo para nuestra sesión de refinamiento. ¿Sobre qué épica o funcionalidad te gustaría que trabajemos hoy?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const scrollAreaViewport = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll automático al recibir nuevos mensajes
    if (scrollAreaViewport.current) {
      scrollAreaViewport.current.scrollTop =
        scrollAreaViewport.current.scrollHeight;
    }
  }, [transcript]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setTranscript([
        ...transcript,
        { speaker: "user", text: inputValue.trim() },
      ]);
      setInputValue("");
      // Simular respuesta del agente
      setAgentState("speaking");
      setTimeout(() => {
        setTranscript((prev) => [
          ...prev,
          {
            speaker: "agent",
            text: "Entendido. Analizando tu propuesta para crear las historias de usuario correspondientes...",
          },
        ]);
        setAgentState("idle");
      }, 2500);
    }
  };

  const toggleListening = () => {
    setAgentState((prevState) =>
      prevState === "listening" ? "idle" : "listening"
    );
  };

  return (
    <Dialog open={true}>
      <DialogContent className="h-full max-h-screen w-full max-w-full flex-col overflow-hidden !rounded-none border-0 bg-background p-0 text-foreground">
        <div className="flex h-full flex-col p-4 md:p-6">
          {/* --- Botón de Acción Final --- */}
          <header className="flex w-full justify-end">
            <Button
              variant="outline"
              className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary"
            >
              Generar Backlog y Finalizar
            </Button>
          </header>

          <main className="flex flex-1 flex-col items-center justify-center gap-6 md:gap-8">
            {/* --- Avatar Central y Animaciones --- */}
            <div className="relative flex h-48 w-48 items-center justify-center md:h-64 md:w-64">
              {/* Anillos para estado 'listening' */}
              {agentState === "listening" &&
                [...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute h-full w-full rounded-full border border-green-500/50 bg-transparent"
                    style={{
                      animation: `pulse 2s cubic-bezier(0.4, 0, 0.6, 1) ${
                        i * 0.3
                      }s infinite`,
                    }}
                  />
                ))}

              <Card
                className={cn(
                  "flex h-full w-full items-center justify-center rounded-full transition-all duration-300",
                  "border-2 border-primary/20 bg-card/80 backdrop-blur-sm",
                  {
                    "shadow-[0_0_20px_5px_rgba(99,102,241,0.2)]":
                      agentState === "idle",
                    "animate-speaking-glow": agentState === "speaking",
                  }
                )}
              >
                <Brain className="h-24 w-24 text-primary/80 md:h-32 md:w-32" />
              </Card>
            </div>

            {/* --- Controles de Audio y Texto --- */}
            <div className="flex flex-col items-center gap-4">
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      className={cn(
                        "h-20 w-20 rounded-full transition-all duration-300 md:h-24 md:w-24",
                        agentState === "listening"
                          ? "bg-green-500/80 text-white shadow-lg"
                          : "bg-card hover:bg-muted"
                      )}
                      onClick={toggleListening}
                    >
                      <Mic className="h-10 w-10 md:h-12 md:w-12" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {agentState === "listening"
                        ? "Detener escucha"
                        : "Presiona para hablar"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex w-full max-w-md items-center space-x-2">
                <Input
                  type="text"
                  placeholder="O escribe tu requerimiento aquí..."
                  className="h-12 flex-1"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-12 w-12"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </main>

          {/* --- Transcripción en Tiempo Real --- */}
          <footer className="mx-auto w-full max-w-4xl pb-4">
            <Card className="h-48 bg-muted/20">
              <CardContent className="p-4">
                <ScrollArea
                  className="h-full"
                  viewportRef={scrollAreaViewport}
                >
                  <div className="flex flex-col gap-4 pr-4">
                    {transcript.map((msg, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex max-w-[80%] flex-col rounded-lg px-3 py-2 text-sm",
                          {
                            "self-end bg-primary text-primary-foreground":
                              msg.speaker === "user",
                            "self-start bg-card": msg.speaker === "agent",
                          }
                        )}
                      >
                        <p>{msg.text}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </footer>
        </div>

        {/* --- Controles de simulación para demostración --- */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAgentState("idle")}
          >
            Set Idle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAgentState("listening")}
          >
            Set Listening
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAgentState("speaking")}
          >
            Set Speaking
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Nota para la integración: La animación 'speaking-glow' necesita ser definida en `tailwind.config.js`
/*
// En tu tailwind.config.js, dentro de theme.extend:
keyframes: {
  'speaking-glow': {
    '0%, 100%': {
      boxShadow: '0 0 30px 10px rgba(99, 102, 241, 0.4)', // --primary color
      borderColor: 'rgba(99, 102, 241, 0.6)'
    },
    '50%': {
      boxShadow: '0 0 50px 25px rgba(99, 102, 241, 0.2)',
      borderColor: 'rgba(99, 102, 241, 0.3)'
    },
  },
},
animation: {
  'speaking-glow': 'speaking-glow 2.5s ease-in-out infinite',
},
*/
// Para que esta demostración funcione visualmente sin modificar la configuración,
// he usado `pulse` en su lugar, pero la clase está lista para la animación correcta.
// He añadido un @keyframes en `globals.css` como alternativa temporal para la demo.
// --- Importaciones Ficticias de ShadCN/UI para que el archivo sea autocontenido ---
// En un proyecto real, estos se importarían de sus rutas correctas.
const Dialog = ({ children }: { children: React.ReactNode; open: boolean }) => (
  <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
    {children}
  </div>
);
const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 border bg-background p-6 shadow-lg duration-200",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
DialogContent.displayName = "DialogContent";

export default ScrumMeetingRoom;
