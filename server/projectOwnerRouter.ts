import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM, Message } from "./_core/llm";
import * as db from "./db";
import { parseMarkdownTasks } from "./utils";

/**
 * Prompt del sistema para el Agente Project Owner
 */
const SYSTEM_PROMPT = `
Eres el "JeiKei Project Owner", un agente de IA experto en metodologías ágiles y gestión de productos.
Tu objetivo es entrevistar al usuario para comprender profundamente su proyecto hasta alcanzar una confianza superior al 93%.

REGLAS DE LA ENTREVISTA:
1. Haz una pregunta a la vez.
2. Sé profesional, analítico y curioso.
3. Evalúa las respuestas del usuario. Si son vagas, pide más detalles.
4. Cuando sientas que tienes suficiente información (confianza > 93%), debes finalizar la entrevista.
5. Al finalizar, debes generar un resumen del proyecto en formato Markdown que incluya:
   - Nombre del Proyecto
   - Visión General
   - Historias de Usuario Principales
   - Un Tablero Kanban inicial (To Do, In Progress, Done)
   - Sugerencia de agentes necesarios y sus habilidades.

ESTADO ACTUAL:
Debes llevar el control de la "Confianza" (0-100%).
Comienza saludando y preguntando por la idea general del proyecto si es la primera vez.
`;

export const projectOwnerRouter = router({
  /**
   * Inicia o continúa una conversación con el Project Owner
   */
  chat: protectedProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.enum(["user", "assistant", "system"]),
            content: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { messages } = input;

      // Añadir el prompt del sistema al inicio si no está
      const fullMessages: Message[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map(m => ({ role: m.role as any, content: m.content })),
      ];

      try {
        const response = await invokeLLM({
          messages: fullMessages,
          maxTokens: 2000,
        });

        const assistantMessage = response.choices[0].message.content as string;

        // Aquí podríamos implementar una lógica para detectar si la entrevista ha terminado
        // y disparar la creación del proyecto automáticamente.
        // Por ahora, solo devolvemos la respuesta del asistente.

        return {
          message: assistantMessage,
          // Podríamos intentar extraer el nivel de confianza si el LLM lo incluye en un formato específico
          confidence: extractConfidence(assistantMessage),
          isFinished: assistantMessage.includes("ENTREVISTA FINALIZADA") || assistantMessage.includes("# Tablero Kanban"),
        };
      } catch (error) {
        console.error("[ProjectOwner] LLM Error:", error);
        throw new Error("Error al comunicarse con el Agente Project Owner");
      }
    }),

  /**
   * Crea formalmente el proyecto y el sprint inicial basado en el Markdown generado
   */
  finalizeProject: protectedProcedure
    .input(
      z.object({
        projectName: z.string(),
        description: z.string(),
        markdownBoard: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // 1. Crear el Sprint
      const sprintResult = await db.createSprint({
        name: `Sprint 1: ${input.projectName}`,
        description: input.description,
      });

      // Extraer el ID del sprint creado
      const sprintId = (sprintResult as any)[0]?.insertId;

      // 2. Parsear tareas desde el Markdown
      const parsedTasks = parseMarkdownTasks(input.markdownBoard);
      const createdTasks = [];

      // 3. Crear cada tarea en la base de datos vinculada al nuevo sprint
      for (const task of parsedTasks) {
        const result = await db.createTask({
          sprintId,
          title: task.title,
          description: task.description,
          priority: task.priority,
          requiredSkills: task.requiredSkills,
          estimationHours: task.estimationHours,
          acceptanceCriteria: task.acceptanceCriteria,
        });
        createdTasks.push(result);
      }

      return {
        success: true,
        sprintId,
        taskCount: createdTasks.length,
      };
    }),
});

/**
 * Utilidad simple para intentar extraer un porcentaje de confianza del texto
 */
function extractConfidence(text: string): number {
  const match = text.match(/Confianza:\s*(\d+)%/i);
  return match ? parseInt(match[1]) : 0;
}
