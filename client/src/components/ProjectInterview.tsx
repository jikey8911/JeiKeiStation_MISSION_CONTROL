import { useState, useEffect } from "react";
import { AIChatBox, Message } from "./AIChatBox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Sparkles, CheckCircle2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProjectInterview() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "¡Hola! Soy tu JeiKei Project Owner. Estoy aquí para ayudarte a definir tu próximo gran proyecto. ¿Cuál es tu idea general?",
    },
  ]);
  const [confidence, setConfidence] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [markdownResult, setMarkdownResult] = useState("");

  const utils = trpc.useUtils();

  const chatMutation = trpc.projectOwner.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);
      if (data.confidence > 0) {
        setConfidence(data.confidence);
      }
      if (data.isFinished) {
        setIsFinished(true);
        setMarkdownResult(data.message);
      }
    },
    onError: (err) => {
      toast.error("Error al conectar con el Project Owner: " + err.message);
    },
  });

  const finalizeMutation = trpc.projectOwner.finalizeProject.useMutation({
    onSuccess: () => {
      toast.success("¡Proyecto creado con éxito!");
      utils.sprints.list.invalidate();
      utils.tasks.list.invalidate();
      // Redirigir o cerrar el diálogo
    },
    onError: (err) => {
      toast.error("Error al finalizar el proyecto: " + err.message);
    },
  });

  const handleSendMessage = (content: string) => {
    const newMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    chatMutation.mutate({ messages: newMessages });
  };

  const handleFinalize = () => {
    // Intentar extraer nombre y descripción básica del markdownResult
    const nameMatch = markdownResult.match(/# (.*)/);
    const projectName = nameMatch ? nameMatch[1] : "Nuevo Proyecto";
    
    finalizeMutation.mutate({
      projectName,
      description: "Proyecto generado por IA Project Owner",
      markdownBoard: markdownResult,
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto p-4">
      <Card className="bg-black/40 border-white/10 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-[#00f2ff] flex items-center gap-2">
              <Shield className="w-5 h-5" /> Entrevista de Misión
            </CardTitle>
            <CardDescription>
              El Project Owner está analizando tu visión para el despliegue.
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-[10px] uppercase tracking-widest font-bold text-white/40">
              Nivel de Confianza: {confidence}%
            </div>
            <Progress value={confidence} className="w-32 h-1 bg-white/5" />
          </div>
        </CardHeader>
        <CardContent>
          {isFinished ? (
            <div className="flex flex-col items-center justify-center py-12 gap-6 text-center">
              <div className="h-16 w-16 bg-[#00f2ff]/20 border border-[#00f2ff]/5 flex items-center justify-center rounded-full animate-pulse">
                <CheckCircle2 className="h-8 w-8 text-[#00f2ff]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold uppercase tracking-widest">¡Visión Alcanzada!</h2>
                <p className="text-white/60 max-w-md mx-auto">
                  El Project Owner ha comprendido el proyecto al 100% y ha generado el tablero de misiones inicial.
                </p>
              </div>
              <Button 
                onClick={handleFinalize}
                disabled={finalizeMutation.isPending}
                className="bg-[#00f2ff] hover:bg-[#00d0db] text-black font-bold rounded-none uppercase tracking-widest px-8 h-12 shadow-[0_0_15px_rgba(0,242,255,0.3)]"
              >
                {finalizeMutation.isPending ? "Desplegando..." : <><Rocket className="w-4 h-4 mr-2" /> Desplegar Misión</>}
              </Button>
            </div>
          ) : (
            <AIChatBox
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={chatMutation.isPending}
              placeholder="Escribe tu respuesta aquí..."
              height="500px"
              className="border-white/5 bg-transparent"
              emptyStateMessage="Inicia la entrevista con el Project Owner"
            />
          )}
        </CardContent>
      </Card>
      
      {!isFinished && (
        <div className="flex items-center justify-center gap-2 text-[10px] text-white/20 uppercase tracking-[0.2em]">
          <Sparkles className="w-3 h-3" /> Procesando con Red Neuronal JeiKei v2.0
        </div>
      )}
    </div>
  );
}
