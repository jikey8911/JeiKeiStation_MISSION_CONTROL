import { useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

export default function AgentsPage() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: agents = [] } = trpc.agents.list.useQuery();
  const { data: presets = [] } = trpc.agents.presets.useQuery();

  const createFromPreset = trpc.agents.createFromPreset.useMutation({
    onSuccess: async () => {
      await utils.agents.list.invalidate();
    },
  });

  const createdAgents = useMemo(() => (agents as any[]).filter(a => a.source !== "openclaw"), [agents]);

  return (
    <div className="min-h-screen bg-[#030405] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-cyan-300">Agentes</h1>
          <Button onClick={() => setLocation("/dashboard")} variant="outline">Volver</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="bg-black/40 border border-cyan-500/20 rounded-xl p-4">
            <h2 className="text-cyan-300 font-bold mb-3">Agentes creados</h2>
            <div className="space-y-2">
              {createdAgents.length > 0 ? createdAgents.map((a: any) => (
                <div key={a.id} className="p-3 rounded-lg bg-black/50 border border-cyan-500/10">
                  <div className="font-semibold">{a.name}</div>
                  <div className="text-xs text-white/50">{a.description || "Sin descripción"}</div>
                </div>
              )) : <div className="text-white/40">No hay agentes creados.</div>}
            </div>
          </section>

          <section className="bg-black/40 border border-cyan-500/20 rounded-xl p-4">
            <h2 className="text-cyan-300 font-bold mb-3">Agentes predefinidos</h2>
            <div className="space-y-2">
              {(presets as any[]).map((p: any) => (
                <div key={p.key} className="p-3 rounded-lg bg-black/50 border border-cyan-500/10 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-white/50">{p.description}</div>
                  </div>
                  <Button size="sm" onClick={() => createFromPreset.mutate({ key: p.key })}>Crear</Button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
