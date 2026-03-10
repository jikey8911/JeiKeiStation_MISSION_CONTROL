import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM, Message } from "./_core/llm";
import * as db from "./db";
import { parseMarkdownTasks } from "./utils";
import { SYSTEM_PROMPT, calculateConfidence, generateMarkdownBoard } from "./_core/projectOwnerPrompts";

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
        phase: z.number().optional().default(1),
        questionsAsked: z.number().optional().default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { messages, phase, questionsAsked } = input;

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

        // Extraer confianza del mensaje
        const confidence = extractConfidence(assistantMessage);

        // Detectar si la entrevista ha terminado
        const isFinished = assistantMessage.includes("ENTREVISTA FINALIZADA") ||
          assistantMessage.includes("# Tablero Kanban") ||
          confidence >= 93;

        // Determinar la siguiente fase basada en la confianza
        let nextPhase = phase;
        if (confidence >= 80 && phase < 4) nextPhase = 4;
        else if (confidence >= 60 && phase < 3) nextPhase = 3;
        else if (confidence >= 30 && phase < 2) nextPhase = 2;

        return {
          message: assistantMessage,
          confidence,
          isFinished,
          phase: nextPhase,
          questionsAsked: questionsAsked + 1,
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
