import { useState, useMemo } from "react";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

interface ParsedTask {
  title: string;
  status: "backlog" | "in_progress" | "review" | "qa" | "done";
  requiredSkills: string[];
  priority: "low" | "medium" | "high" | "critical";
  description?: string;
}

interface MarkdownImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprintId?: number;
  onSuccess?: () => void;
}

/**
 * @component MarkdownImportModal
 * @description Modal para importar tareas desde Markdown con previsualización.
 * Permite al usuario pegar texto Markdown, previsualizar las tareas parseadas
 * y confirmar la importación.
 *
 * Formato soportado:
 * - [ ] Título de la tarea (Skill: frontend, backend) (Priority: high)
 * - [x] Tarea completada (Skill: qa)
 * - [ ] Otra tarea (Skill: devops, infrastructure)
 */
export function MarkdownImportModal({
  isOpen,
  onClose,
  sprintId,
  onSuccess,
}: MarkdownImportModalProps) {
  const [markdownContent, setMarkdownContent] = useState("");
  const [step, setStep] = useState<"input" | "preview">("input");
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);

  // Mutación para importar tareas
  const importTasksMutation = trpc.tasks.importFromMarkdown.useMutation({
    onSuccess: (result) => {
      toast.success(`✅ ${result.count} tareas importadas exitosamente`);
      setMarkdownContent("");
      setStep("input");
      setParsedTasks([]);
      onClose();
      onSuccess?.();
    },
  });

  /**
   * Parsea el contenido Markdown y extrae las tareas.
   * Soporta el formato de listas de verificación de Markdown estándar.
   */
  const parseMarkdownTasks = (content: string): ParsedTask[] => {
    if (!content.trim()) return [];

    const tasks: ParsedTask[] = [];
    const lines = content.split("\n");

    for (const line of lines) {
      // Regex para detectar líneas de lista de verificación
      // Formato: - [ ] o - [x] seguido del contenido
      const match = line.match(/^[\s]*-\s+\[([ xX])\]\s+(.+)$/);
      if (!match) continue;

      const isCompleted = match[1].toLowerCase() === "x";
      const content = match[2].trim();

      // Extraer habilidades requeridas (formato: Skill: frontend, backend)
      const skillsMatch = content.match(/\(Skill:\s*([^)]+)\)/i);
      const skillsRaw = skillsMatch ? skillsMatch[1] : "";
      const requiredSkills = skillsRaw
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      // Extraer prioridad (formato: Priority: high)
      const priorityMatch = content.match(/\(Priority:\s*(low|medium|high|critical)\)/i);
      const priority = (priorityMatch?.[1]?.toLowerCase() as any) || "medium";

      // Limpiar el título removiendo las anotaciones de habilidades y prioridad
      const title = content
        .replace(/\s*\(Skill:[^)]*\)/gi, "")
        .replace(/\s*\(Priority:[^)]*\)/gi, "")
        .trim();

      if (title.length === 0) continue;

      tasks.push({
        title,
        status: isCompleted ? "done" : "backlog",
        requiredSkills,
        priority,
      });
    }

    return tasks;
  };

  /**
   * Maneja el paso de "input" a "preview".
   * Parsea el contenido y valida que haya tareas.
   */
  const handlePreview = () => {
    const tasks = parseMarkdownTasks(markdownContent);

    if (tasks.length === 0) {
      toast.error(
        "No se encontraron tareas válidas. Verifica el formato Markdown."
      );
      return;
    }

    setParsedTasks(tasks);
    setStep("preview");
  };

  /**
   * Maneja la importación confirmada de tareas.
   */
  const handleConfirmImport = async () => {
    if (parsedTasks.length === 0) {
      toast.error("No hay tareas para importar");
      return;
    }

    try {
      await importTasksMutation.mutateAsync({
        markdown: markdownContent,
        sprintId,
      });
    } catch (error) {
      // El manejo de errores es centralizado en trpc.ts
      console.error("Error al importar tareas:", error);
    }
  };

  /**
   * Vuelve del paso "preview" al "input".
   */
  const handleBackToInput = () => {
    setStep("input");
    setParsedTasks([]);
  };

  /**
   * Cierra el modal y resetea el estado.
   */
  const handleClose = () => {
    setMarkdownContent("");
    setStep("input");
    setParsedTasks([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Tareas desde Markdown</DialogTitle>
          <DialogDescription>
            {step === "input"
              ? "Pega tu contenido Markdown con tareas. Formato: - [ ] Título (Skill: frontend) (Priority: high)"
              : `Previsualización de ${parsedTasks.length} tarea${parsedTasks.length !== 1 ? "s" : ""}`}
          </DialogDescription>
        </DialogHeader>

        {step === "input" ? (
          <div className="space-y-4">
            {/* Instrucciones */}
            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-sm text-blue-800 dark:text-blue-300 ml-2">
                <strong>Formato soportado:</strong>
                <br />
                <code className="text-xs bg-blue-100 dark:bg-blue-900 px-1 rounded">
                  - [ ] Título (Skill: frontend, backend) (Priority: high)
                </code>
              </AlertDescription>
            </Alert>

            {/* Textarea para pegar Markdown */}
            <div className="space-y-2">
              <Label htmlFor="markdown-input">Contenido Markdown</Label>
              <Textarea
                id="markdown-input"
                placeholder={`- [ ] Implementar login (Skill: frontend) (Priority: high)
- [ ] Crear API de usuarios (Skill: backend) (Priority: high)
- [x] Diseñar base de datos (Skill: devops)
- [ ] Escribir tests (Skill: qa) (Priority: medium)`}
                value={markdownContent}
                onChange={(e) => setMarkdownContent(e.target.value)}
                className="min-h-48 font-mono text-sm"
              />
            </div>

            {/* Contador de tareas detectadas en tiempo real */}
            {markdownContent.trim() && (
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {parseMarkdownTasks(markdownContent).length} tarea(s) detectada(s)
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tabla de previsualización */}
            {parsedTasks.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100 dark:bg-slate-800">
                      <TableHead className="font-semibold">Título</TableHead>
                      <TableHead className="font-semibold">Estado</TableHead>
                      <TableHead className="font-semibold">Prioridad</TableHead>
                      <TableHead className="font-semibold">Habilidades</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedTasks.map((task, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium text-sm">
                          {task.title}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              task.status === "done"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {task.status === "done" ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Completada
                              </>
                            ) : (
                              "Backlog"
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              task.priority === "critical"
                                ? "border-red-500 text-red-700 dark:text-red-400"
                                : task.priority === "high"
                                ? "border-orange-500 text-orange-700 dark:text-orange-400"
                                : task.priority === "medium"
                                ? "border-yellow-500 text-yellow-700 dark:text-yellow-400"
                                : "border-green-500 text-green-700 dark:text-green-400"
                            }`}
                          >
                            {task.priority.charAt(0).toUpperCase() +
                              task.priority.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {task.requiredSkills.length > 0 ? (
                              task.requiredSkills.map((skill) => (
                                <Badge
                                  key={skill}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {skill}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-slate-500">—</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No hay tareas para mostrar en la previsualización.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Footer con botones de acción */}
        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={step === "input" ? handleClose : handleBackToInput}
          >
            {step === "input" ? "Cancelar" : "Volver"}
          </Button>

          {step === "input" ? (
            <Button
              onClick={handlePreview}
              disabled={!markdownContent.trim()}
              className="gap-2"
            >
              Previsualizar
            </Button>
          ) : (
            <Button
              onClick={handleConfirmImport}
              disabled={importTasksMutation.isPending || parsedTasks.length === 0}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {importTasksMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {importTasksMutation.isPending
                ? "Importando..."
                : "Confirmar Importación"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
