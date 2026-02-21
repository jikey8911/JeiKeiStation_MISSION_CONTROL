/**
 * Parser de Markdown para importación de tareas
 * Formato esperado:
 * ## Título de la Tarea
 * **Prioridad:** high
 * **Habilidades:** FRONTEND, BACKEND
 * **Estimación:** 5 horas
 * **Criterios de Aceptación:**
 * - Criterio 1
 * - Criterio 2
 * **Descripción:**
 * Descripción detallada de la tarea
 */

export interface ParsedTask {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "critical";
  requiredSkills: string[];
  estimationHours?: number;
  acceptanceCriteria: string[];
}

export function parseMarkdownTasks(markdown: string): ParsedTask[] {
  const tasks: ParsedTask[] = [];
  const sections = markdown.split(/^## /m).slice(1); // Dividir por encabezados de nivel 2

  for (const section of sections) {
    const lines = section.split("\n");
    const title = lines[0]?.trim() || "";

    if (!title) continue;

    const task: ParsedTask = {
      title,
      priority: "medium",
      requiredSkills: [],
      acceptanceCriteria: [],
    };

    let currentSection = "";
    let descriptionLines: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith("**Prioridad:**")) {
        const priority = line.replace("**Prioridad:**", "").trim().toLowerCase();
        if (["low", "medium", "high", "critical"].includes(priority)) {
          task.priority = priority as any;
        }
      } else if (line.startsWith("**Habilidades:**")) {
        const skills = line.replace("**Habilidades:**", "").trim();
        task.requiredSkills = skills.split(",").map(s => s.trim().toUpperCase());
      } else if (line.startsWith("**Estimación:**")) {
        const estimation = line.replace("**Estimación:**", "").trim();
        const hours = parseFloat(estimation);
        if (!isNaN(hours)) {
          task.estimationHours = hours;
        }
      } else if (line.startsWith("**Criterios de Aceptación:**")) {
        currentSection = "criteria";
      } else if (line.startsWith("**Descripción:**")) {
        currentSection = "description";
      } else if (currentSection === "criteria" && line.startsWith("-")) {
        task.acceptanceCriteria.push(line.replace(/^-\s*/, "").trim());
      } else if (currentSection === "description" && line.trim()) {
        descriptionLines.push(line.trim());
      }
    }

    if (descriptionLines.length > 0) {
      task.description = descriptionLines.join(" ");
    }

    tasks.push(task);
  }

  return tasks;
}

/**
 * Motor de asignación automática de tareas a agentes
 * Selecciona el agente más apropiado basado en:
 * 1. Coincidencia de habilidades
 * 2. Disponibilidad (carga de trabajo actual)
 * 3. Capacidad máxima
 */

export interface Agent {
  id: number;
  name: string;
  skills: string[];
  currentWorkload: number;
  maxCapacity: number;
  status: "available" | "busy" | "offline";
}

export function findBestAgent(
  agents: Agent[],
  requiredSkills: string[]
): Agent | null {
  // Filtrar agentes disponibles que tengan las habilidades requeridas
  const candidateAgents = agents.filter(agent => {
    // Debe estar disponible
    if (agent.status === "offline") return false;

    // Debe tener capacidad disponible
    if (agent.currentWorkload >= agent.maxCapacity) return false;

    // Debe tener al menos una de las habilidades requeridas
    if (requiredSkills.length === 0) return true;

    return requiredSkills.some(skill => 
      agent.skills.includes(skill.toUpperCase())
    );
  });

  if (candidateAgents.length === 0) return null;

  // Ordenar por:
  // 1. Mejor coincidencia de habilidades (más habilidades coincidentes)
  // 2. Menor carga de trabajo actual
  const scored = candidateAgents.map(agent => {
    const matchingSkills = requiredSkills.filter(skill =>
      agent.skills.includes(skill.toUpperCase())
    ).length;

    const workloadRatio = agent.currentWorkload / agent.maxCapacity;

    // Puntuación: más habilidades coincidentes es mejor, menos carga es mejor
    const score = (matchingSkills * 10) - workloadRatio;

    return { agent, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored[0]?.agent || null;
}

/**
 * Detectar ciclos en dependencias de tareas
 */
export interface TaskDependency {
  taskId: number;
  dependsOnTaskId: number;
}

export function hasCyclicDependency(
  dependencies: TaskDependency[],
  newTaskId: number,
  newDependsOnTaskId: number
): boolean {
  // Crear un grafo de dependencias
  const graph = new Map<number, number[]>();

  for (const dep of dependencies) {
    if (!graph.has(dep.taskId)) {
      graph.set(dep.taskId, []);
    }
    graph.get(dep.taskId)!.push(dep.dependsOnTaskId);
  }

  // Agregar la nueva dependencia
  if (!graph.has(newTaskId)) {
    graph.set(newTaskId, []);
  }
  graph.get(newTaskId)!.push(newDependsOnTaskId);

  // DFS para detectar ciclos
  const visited = new Set<number>();
  const recursionStack = new Set<number>();

  function dfs(node: number): boolean {
    visited.add(node);
    recursionStack.add(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        return true; // Ciclo detectado
      }
    }

    recursionStack.delete(node);
    return false;
  }

  // Verificar desde todos los nodos
  const nodes = Array.from(graph.keys());
  for (const node of nodes) {
    if (!visited.has(node)) {
      if (dfs(node)) return true;
    }
  }

  return false;
}

/**
 * Calcular métricas SCRUM
 */
export interface SprintMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  velocity: number;
  burndownData: Array<{ day: number; remaining: number }>;
}

export function calculateVelocity(
  completedTasks: number,
  totalEstimation: number
): number {
  return totalEstimation > 0 ? (completedTasks / totalEstimation) * 100 : 0;
}
