/**
 * Sistema de Prompts para el Agente Project Owner
 * Diseñado para conducir una entrevista estructurada hasta alcanzar 93% de confianza
 */

export const SYSTEM_PROMPT = `
Eres el "JeiKei Project Owner", un agente de IA experto en metodologías ágiles y gestión de productos.
Tu objetivo es entrevistar al usuario para comprender profundamente su proyecto hasta alcanzar una confianza superior al 93%.

ESTRUCTURA DE LA ENTREVISTA:
1. FASE 1 (Confianza 0-30%): Idea General
   - Pregunta sobre el concepto general del proyecto
   - Identifica el tipo de proyecto (web, mobile, API, etc.)
   - Entiende el problema que resuelve

2. FASE 2 (Confianza 30-60%): Requisitos Funcionales
   - Pregunta sobre las funcionalidades principales
   - Identifica los usuarios/stakeholders
   - Entiende el flujo de trabajo esperado

3. FASE 3 (Confianza 60-85%): Detalles Técnicos y Restricciones
   - Pregunta sobre tecnologías preferidas
   - Identifica restricciones (presupuesto, tiempo, recursos)
   - Entiende las dependencias externas

4. FASE 4 (Confianza 85-93%): Validación y Refinamiento
   - Confirma tu comprensión del proyecto
   - Pregunta sobre prioridades
   - Identifica riesgos potenciales

REGLAS IMPORTANTES:
- Haz UNA pregunta a la vez, clara y concisa
- Sé profesional, analítico y empático
- Si una respuesta es vaga, pide más detalles
- Mantén un tono conversacional pero experto
- Cuando alcances 93% de confianza, finaliza con: "ENTREVISTA FINALIZADA"
- Al finalizar, SIEMPRE genera un Markdown completo con:
  * # Nombre del Proyecto
  * ## Visión General
  * ## Historias de Usuario (mínimo 3)
  * ## Tareas Técnicas Iniciales
  * ## Tablero Kanban (To Do, In Progress, Done)
  * ## Agentes Sugeridos y Habilidades Requeridas

FORMATO DE CONFIANZA:
En cada respuesta, incluye al final: "Confianza: XX%"
Incrementa la confianza basado en la calidad y completitud de la información recibida.

INICIO:
Saluda al usuario y comienza con la FASE 1.
`;

export const PHASE_1_QUESTIONS = [
  "¡Hola! Soy tu JeiKei Project Owner. Estoy aquí para ayudarte a definir tu próximo proyecto. ¿Cuál es la idea general o el concepto de tu proyecto?",
  "¿Cuál es el problema principal que tu proyecto intenta resolver?",
  "¿Qué tipo de proyecto es? (ej: aplicación web, mobile, API, herramienta de escritorio, etc.)",
  "¿Quiénes serían los usuarios principales de este proyecto?",
];

export const PHASE_2_QUESTIONS = [
  "¿Cuáles serían las 3-5 funcionalidades principales que debe tener tu proyecto?",
  "¿Cómo imaginas que un usuario interactuaría con tu proyecto en un día típico?",
  "¿Hay alguna funcionalidad que sea crítica o de alta prioridad?",
  "¿Necesita integrarse con otros sistemas o servicios externos?",
];

export const PHASE_3_QUESTIONS = [
  "¿Tienes preferencias tecnológicas? (ej: React, Vue, Python, Node.js, etc.)",
  "¿Hay restricciones de tiempo o presupuesto que deba considerar?",
  "¿Cuántos usuarios esperas que use el proyecto inicialmente?",
  "¿Hay requisitos de seguridad o privacidad especiales?",
];

export const PHASE_4_QUESTIONS = [
  "Déjame resumir lo que entiendo: [RESUMEN]. ¿Es correcto?",
  "¿Cuál es la prioridad más importante: velocidad de desarrollo, escalabilidad, o facilidad de uso?",
  "¿Hay riesgos o desafíos específicos que anticipas?",
  "¿Cuándo idealmente te gustaría tener una versión inicial funcional?",
];

export function selectNextQuestion(
  phase: number,
  questionsAsked: number,
  userResponses: string[]
): string {
  const questions = {
    1: PHASE_1_QUESTIONS,
    2: PHASE_2_QUESTIONS,
    3: PHASE_3_QUESTIONS,
    4: PHASE_4_QUESTIONS,
  };

  const phaseQuestions = questions[phase as keyof typeof questions] || [];
  const nextIndex = questionsAsked % phaseQuestions.length;
  
  return phaseQuestions[nextIndex] || "Cuéntame más sobre tu proyecto.";
}

export function calculateConfidence(
  phase: number,
  questionsAsked: number,
  responseQuality: "vague" | "partial" | "complete"
): number {
  const baseConfidence = phase * 20; // 20%, 40%, 60%, 80%
  const questionBonus = Math.min(questionsAsked * 3, 15); // Máximo 15% por preguntas
  const qualityBonus = responseQuality === "complete" ? 10 : responseQuality === "partial" ? 5 : 0;

  return Math.min(baseConfidence + questionBonus + qualityBonus, 93);
}

export function generateMarkdownBoard(projectInfo: {
  name: string;
  vision: string;
  userStories: string[];
  technicalTasks: string[];
  suggestedAgents: Array<{ name: string; skills: string[] }>;
}): string {
  const markdown = `# ${projectInfo.name}

## Visión General
${projectInfo.vision}

## Historias de Usuario

${projectInfo.userStories.map((story, i) => `### HU-${i + 1}: ${story}`).join("\n\n")}

## Tareas Técnicas Iniciales

${projectInfo.technicalTasks.map((task, i) => `### TECH-${i + 1}: ${task}`).join("\n\n")}

## Tablero Kanban

### To Do
${projectInfo.technicalTasks.slice(0, 3).map((task) => `- [ ] ${task}`).join("\n")}

### In Progress

### Done

## Agentes Sugeridos

${projectInfo.suggestedAgents.map((agent) => `- **${agent.name}**: ${agent.skills.join(", ")}`).join("\n")}

---
*Generado por JeiKei Project Owner v1.0*
`;

  return markdown;
}
