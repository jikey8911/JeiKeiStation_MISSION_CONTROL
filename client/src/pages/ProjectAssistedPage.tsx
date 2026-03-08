import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ProjectInterviewV2 } from "@/components/ProjectInterviewV2";

export default function ProjectAssistedPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#030405] text-white p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-cyan-300">+ Proyecto asistido</h1>
          <Button variant="outline" onClick={() => setLocation("/dashboard")}>Volver</Button>
        </div>
        <div className="bg-black/40 border border-cyan-500/20 rounded-xl p-4">
          <ProjectInterviewV2 />
        </div>
      </div>
    </div>
  );
}
