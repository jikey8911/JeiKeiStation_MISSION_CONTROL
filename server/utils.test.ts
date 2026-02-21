import { describe, it, expect } from "vitest";
import { parseMarkdownTasks, findBestAgent, hasCyclicDependency } from "./utils";

describe("parseMarkdownTasks", () => {
  it("debe parsear tareas desde Markdown correctamente", () => {
    const markdown = `## Crear página de inicio
**Prioridad:** high
**Habilidades:** FRONTEND
**Estimación:** 5 horas
**Criterios de Aceptación:**
- La página debe ser responsive
- Debe incluir un formulario de contacto
**Descripción:**
Crear una página de inicio atractiva con información sobre la empresa.

## Configurar base de datos
**Prioridad:** critical
**Habilidades:** BACKEND, DB
**Estimación:** 8 horas
**Criterios de Aceptación:**
- Debe soportar 1000 usuarios simultáneos
- Debe tener backups automáticos
**Descripción:**
Configurar la base de datos principal del sistema.`;

    const tasks = parseMarkdownTasks(markdown);

    expect(tasks).toHaveLength(2);
    expect(tasks[0].title).toBe("Crear página de inicio");
    expect(tasks[0].priority).toBe("high");
    expect(tasks[0].requiredSkills).toContain("FRONTEND");
    expect(tasks[0].estimationHours).toBe(5);
    expect(tasks[0].acceptanceCriteria).toHaveLength(2);

    expect(tasks[1].title).toBe("Configurar base de datos");
    expect(tasks[1].priority).toBe("critical");
    expect(tasks[1].requiredSkills).toContain("BACKEND");
    expect(tasks[1].requiredSkills).toContain("DB");
  });

  it("debe manejar tareas sin criterios de aceptación", () => {
    const markdown = `## Tarea simple
**Prioridad:** low
**Habilidades:** QA
**Estimación:** 2 horas
**Descripción:**
Una tarea simple sin criterios.`;

    const tasks = parseMarkdownTasks(markdown);

    expect(tasks).toHaveLength(1);
    expect(tasks[0].acceptanceCriteria).toHaveLength(0);
  });
});

describe("findBestAgent", () => {
  it("debe encontrar el mejor agente basado en habilidades", () => {
    const agents = [
      {
        id: 1,
        name: "Alice",
        skills: ["FRONTEND", "DISEÑO"],
        currentWorkload: 2,
        maxCapacity: 10,
        status: "available" as const,
      },
      {
        id: 2,
        name: "Bob",
        skills: ["BACKEND", "DB"],
        currentWorkload: 1,
        maxCapacity: 10,
        status: "available" as const,
      },
    ];

    const bestAgent = findBestAgent(agents, ["FRONTEND"]);
    expect(bestAgent?.id).toBe(1);
    expect(bestAgent?.name).toBe("Alice");
  });

  it("debe preferir agentes con menor carga de trabajo", () => {
    const agents = [
      {
        id: 1,
        name: "Alice",
        skills: ["BACKEND"],
        currentWorkload: 8,
        maxCapacity: 10,
        status: "available" as const,
      },
      {
        id: 2,
        name: "Bob",
        skills: ["BACKEND"],
        currentWorkload: 2,
        maxCapacity: 10,
        status: "available" as const,
      },
    ];

    const bestAgent = findBestAgent(agents, ["BACKEND"]);
    expect(bestAgent?.id).toBe(2);
  });

  it("debe retornar null si no hay agentes disponibles", () => {
    const agents = [
      {
        id: 1,
        name: "Alice",
        skills: ["FRONTEND"],
        currentWorkload: 10,
        maxCapacity: 10,
        status: "available" as const,
      },
    ];

    const bestAgent = findBestAgent(agents, ["BACKEND"]);
    expect(bestAgent).toBeNull();
  });

  it("debe ignorar agentes offline", () => {
    const agents = [
      {
        id: 1,
        name: "Alice",
        skills: ["FRONTEND"],
        currentWorkload: 2,
        maxCapacity: 10,
        status: "offline" as const,
      },
      {
        id: 2,
        name: "Bob",
        skills: ["FRONTEND"],
        currentWorkload: 2,
        maxCapacity: 10,
        status: "available" as const,
      },
    ];

    const bestAgent = findBestAgent(agents, ["FRONTEND"]);
    expect(bestAgent?.id).toBe(2);
  });
});

describe("hasCyclicDependency", () => {
  it("debe detectar ciclos simples", () => {
    const dependencies = [
      { taskId: 1, dependsOnTaskId: 2 },
      { taskId: 2, dependsOnTaskId: 3 },
    ];

    // Intentar agregar una dependencia que crearía un ciclo
    const hasCycle = hasCyclicDependency(dependencies, 3, 1);
    expect(hasCycle).toBe(true);
  });

  it("debe permitir dependencias válidas", () => {
    const dependencies = [
      { taskId: 1, dependsOnTaskId: 2 },
      { taskId: 2, dependsOnTaskId: 3 },
    ];

    // Agregar una dependencia válida
    const hasCycle = hasCyclicDependency(dependencies, 4, 1);
    expect(hasCycle).toBe(false);
  });

  it("debe detectar ciclos complejos", () => {
    const dependencies = [
      { taskId: 1, dependsOnTaskId: 2 },
      { taskId: 2, dependsOnTaskId: 3 },
      { taskId: 3, dependsOnTaskId: 4 },
    ];

    // Intentar crear un ciclo: 4 -> 1
    const hasCycle = hasCyclicDependency(dependencies, 4, 1);
    expect(hasCycle).toBe(true);
  });

  it("debe manejar dependencias vacías", () => {
    const dependencies: any[] = [];

    const hasCycle = hasCyclicDependency(dependencies, 1, 2);
    expect(hasCycle).toBe(false);
  });
});
