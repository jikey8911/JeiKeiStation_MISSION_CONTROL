import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, Brain, Clock } from "lucide-react";

interface ProjectCreationModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMode: (mode: "manual" | "ai") => void;
}

export function ProjectCreationModeDialog({
  open,
  onOpenChange,
  onSelectMode,
}: ProjectCreationModeDialogProps) {
  const [selectedMode, setSelectedMode] = useState<"manual" | "ai" | null>(null);

  const handleSelect = (mode: "manual" | "ai") => {
    setSelectedMode(mode);
    onSelectMode(mode);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f0f0f] border border-[#00f2ff]/30 text-white max-w-2xl rounded-none">
        <DialogHeader className="text-center">
          <DialogTitle className="text-[#00f2ff] uppercase tracking-[0.2em] font-bold text-2xl">
            Crear Nueva Misión
          </DialogTitle>
          <DialogDescription className="text-white/60 mt-2">
            Elige cómo deseas crear tu proyecto
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6">
          {/* Modo Manual */}
          <Card
            className={`cursor-pointer transition-all border-2 ${
              selectedMode === "manual"
                ? "border-[#00f2ff] bg-[#00f2ff]/5"
                : "border-white/10 bg-black/40 hover:border-white/20"
            }`}
            onClick={() => handleSelect("manual")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" /> Modo Manual
                </CardTitle>
                <Badge variant="outline" className="border-yellow-400/50 text-yellow-300">
                  Rápido
                </Badge>
              </div>
              <CardDescription className="text-white/60">
                Crea tareas manualmente con control total
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm text-white/60">
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Tiempo: 2-5 minutos
                </p>
                <div className="bg-white/5 p-3 rounded border border-white/10">
                  <p className="font-semibold text-white mb-2">Incluye:</p>
                  <ul className="space-y-1 text-[12px]">
                    <li>✓ Crear tareas individuales</li>
                    <li>✓ Definir prioridades</li>
                    <li>✓ Asignar habilidades requeridas</li>
                    <li>✓ Crear sprint manualmente</li>
                  </ul>
                </div>
              </div>
              <Button
                onClick={() => handleSelect("manual")}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white rounded-none uppercase tracking-widest text-[10px] font-bold"
              >
                Usar Modo Manual
              </Button>
            </CardContent>
          </Card>

          {/* Modo AI Project Owner */}
          <Card
            className={`cursor-pointer transition-all border-2 ${
              selectedMode === "ai"
                ? "border-[#00f2ff] bg-[#00f2ff]/5"
                : "border-white/10 bg-black/40 hover:border-white/20"
            }`}
            onClick={() => handleSelect("ai")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5 text-[#00f2ff]" /> Project Owner IA
                </CardTitle>
                <Badge className="bg-[#00f2ff]/20 text-[#00f2ff] border-0">
                  Recomendado
                </Badge>
              </div>
              <CardDescription className="text-white/60">
                Entrevista guiada por IA para definir tu proyecto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm text-white/60">
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Tiempo: 5-10 minutos
                </p>
                <div className="bg-[#00f2ff]/5 p-3 rounded border border-[#00f2ff]/20">
                  <p className="font-semibold text-white mb-2">Incluye:</p>
                  <ul className="space-y-1 text-[12px]">
                    <li>✓ Entrevista conversacional</li>
                    <li>✓ Generación automática de tareas</li>
                    <li>✓ Recomendación de agentes</li>
                    <li>✓ Tablero Kanban inicial</li>
                    <li>✓ Análisis de confianza (93%)</li>
                  </ul>
                </div>
              </div>
              <Button
                onClick={() => handleSelect("ai")}
                className="w-full bg-[#00f2ff] hover:bg-[#00d0db] text-black font-bold rounded-none uppercase tracking-widest text-[10px] shadow-[0_0_15px_rgba(0,242,255,0.3)]"
              >
                <Sparkles className="w-4 h-4 mr-2" /> Usar Project Owner
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white/5 p-4 rounded border border-white/10 text-center text-[12px] text-white/60">
          <p>
            💡 <span className="text-white">Consejo:</span> Usa el Project Owner IA para proyectos nuevos. Es más rápido y genera mejores resultados.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
