import { useState, useEffect } from "react";
import { AIChatBox, Message } from "./AIChatBox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Sparkles, CheckCircle2, Rocket, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InterviewState {
  messages: Message[];
  phase: number;
  questionsAsked: number;
  confidence: number;
  isFinished: boolean;
}

export function ProjectInterviewV2() {
  const [state, setState] = useState<InterviewState>({
    messages: [
      {
        role: "assistant",
        content: "¡Hola! Soy tu JeiKei Project Owner. Estoy aquí para ayudarte a definir tu próximo gran proyecto. ¿Cuál es la idea general o el concepto de tu proyecto?",
      },
    ],
    phase: 1,
    questionsAsked: 1,
    confidence: 0,
    isFinished: false,
  });

  const [markdownResult, setMarkdownResult] = useState("");
  const utils = trpc.useUtils();

  const chatMutation = trpc.projectOwner.chat.useMutation({
    onSuccess: (data) => {
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, { role: "assistant", content: data.message }],
        confidence: data.confidence,
        isFinished: data.isFinished,
        phase: data.phase,
        questionsAsked: data.questionsAsked,
      }));

      if (data.isFinished) {
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
    },
    onError: (err) => {
      toast.error("Error al finalizar el proyecto: " + err.message);
    },
  });

  const handleSendMessage = (content: string) => {
    const newMessages: Message[] = [...state.messages, { role: "user", content }];
    setState((prev) => ({
      ...prev,
      messages: newMessages,
    }));
    chatMutation.mutate({
      messages: newMessages,
      phase: state.phase,
      questionsAsked: state.questionsAsked,
    });
  };

  const handleFinalize = () => {
    const nameMatch = markdownResult.match(/# (.*)/);
    const projectName = nameMatch ? nameMatch[1] : "Nuevo Proyecto";

    finalizeMutation.mutate({
      projectName,
      description: "Proyecto generado por IA Project Owner",
      markdownBoard: markdownResult,
    });
  };

  const getPhaseLabel = (phase: number) => {
    const labels: Record<number, string> = {
      1: "Idea General",
      2: "Requisitos Funcionales",
      3: "Detalles Técnicos",
      4: "Validación Final",
    };
    return labels[phase] || "Fase Desconocida";
  };

  const getPhaseColor = (phase: number) => {
    const colors: Record<number, string> = {
      1: "bg-blue-500/20 text-blue-300",
      2: "bg-purple-500/20 text-purple-300",
      3: "bg-orange-500/20 text-orange-300",
      4: "bg-green-500/20 text-green-300",
    };
    return colors[phase] || "bg-gray-500/20 text-gray-300";
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto p-4">
      <Card className="bg-black/40 border-white/10 backdrop-blur-md">
        <CardHeader className="flex flex-col gap-4">
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-[#00f2ff] flex items-center gap-2">
                <Shield className="w-5 h-5" /> Entrevista de Misión
              </CardTitle>
              <CardDescription>
                El Project Owner está analizando tu visión para el despliegue.
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={`${getPhaseColor(state.phase)} border-0`}>
                {getPhaseLabel(state.phase)}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">
                Confianza
              </span>
              <div className="flex items-center gap-2">
                <Progress value={state.confidence} className="flex-1 h-1 bg-white/5" />
                <span className="text-sm font-bold text-[#00f2ff]">{state.confidence}%</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">
                Fase
              </span>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((p) => (
                    <div
                      key={p}
                      className={`h-2 w-2 rounded-full transition-all ${
                        p <= state.phase ? "bg-[#00f2ff]" : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">
                Preguntas
              </span>
              <span className="text-sm font-bold text-white/60">{state.questionsAsked}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {state.isFinished ? (
            <div className="flex flex-col items-center justify-center py-12 gap-6 text-center">
              <div className="h-16 w-16 bg-[#00f2ff]/20 border border-[#00f2ff]/5 flex items-center justify-center rounded-full animate-pulse">
                <CheckCircle2 className="h-8 w-8 text-[#00f2ff]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold uppercase tracking-widest">¡Visión Alcanzada!</h2>
                <p className="text-white/60 max-w-md mx-auto">
                  El Project Owner ha comprendido el proyecto al {state.confidence}% y ha generado el tablero de misiones inicial.
                </p>
              </div>
              <Button
                onClick={handleFinalize}
                disabled={finalizeMutation.isPending}
                className="bg-[#00f2ff] hover:bg-[#00d0db] text-black font-bold rounded-none uppercase tracking-widest px-8 h-12 shadow-[0_0_15px_rgba(0,242,255,0.3)]"
              >
                {finalizeMutation.isPending ? (
                  <>
                    <Zap className="w-4 h-4 mr-2 animate-spin" /> Desplegando...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 mr-2" /> Desplegar Misión
                  </>
                )}
              </Button>
            </div>
          ) : (
            <AIChatBox
              messages={state.messages}
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

      {!state.isFinished && (
        <div className="flex items-center justify-center gap-2 text-[10px] text-white/20 uppercase tracking-[0.2em]">
          <Sparkles className="w-3 h-3 animate-pulse" /> Procesando con Red Neuronal JeiKei v2.0
        </div>
      )}
    </div>
  );
}
