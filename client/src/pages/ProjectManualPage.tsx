import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ProjectManualPage() {
  const [, setLocation] = useLocation();
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [markdown, setMarkdown] = useState("");

  const chat = trpc.projectOwner.chat.useMutation();
  const finalize = trpc.projectOwner.finalizeProject.useMutation();

  const handleAnalyze = async () => {
    const result = await chat.mutateAsync({
      messages: [{ role: "user", content: `Analiza este markdown de proyecto y devuelve tablero kanban.\n\n${markdown}` }],
      phase: 1,
      questionsAsked: 0,
    });

    await finalize.mutateAsync({
      projectName: projectName || "Nuevo Proyecto",
      description: description || "Proyecto creado desde markdown",
      markdownBoard: result.message || markdown,
    });

    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#030405] text-white p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-cyan-300">+ Proyecto</h1>
          <Button variant="outline" onClick={() => setLocation("/dashboard")}>Volver</Button>
        </div>

        <div className="bg-black/40 border border-cyan-500/20 rounded-xl p-4 space-y-3">
          <Input placeholder="Nombre del proyecto" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
          <Input placeholder="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Textarea className="min-h-72" placeholder="Pega aquí el markdown del proyecto" value={markdown} onChange={(e) => setMarkdown(e.target.value)} />
          <div className="flex gap-2">
            <Button onClick={handleAnalyze}>Analizar con Product Owner y crear proyecto</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
