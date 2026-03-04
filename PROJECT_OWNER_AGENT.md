# JeiKei Project Owner Agent - Documentación

## Descripción General

El **Agente Project Owner** es un sistema de IA conversacional integrado en JeiKeiStation MISSION CONTROL que guía a los usuarios a través de una entrevista estructurada para definir completamente un nuevo proyecto. El agente utiliza Inteligencia Artificial (Gemini 2.5 Flash) para hacer preguntas inteligentes, evaluar respuestas y generar automáticamente un tablero Kanban con tareas iniciales.

## Arquitectura

### Componentes Principales

#### 1. Backend (Node.js/Express + tRPC)
- **`server/projectOwnerRouter.ts`**: Define los endpoints de tRPC para la conversación
  - `projectOwner.chat`: Maneja la conversación iterativa
  - `projectOwner.finalizeProject`: Crea el sprint y las tareas

- **`server/_core/projectOwnerPrompts.ts`**: Sistema de prompts y lógica de fases
  - `SYSTEM_PROMPT`: Instrucciones para el LLM
  - `PHASE_1_QUESTIONS` a `PHASE_4_QUESTIONS`: Preguntas estructuradas por fase
  - `calculateConfidence()`: Calcula el nivel de confianza
  - `generateMarkdownBoard()`: Genera el tablero en Markdown

- **`server/_core/llm.ts`**: Integración con Gemini 2.5 Flash
  - `invokeLLM()`: Llamada a la API del LLM

#### 2. Frontend (React + TypeScript)
- **`client/src/components/ProjectInterviewV2.tsx`**: Interfaz de entrevista
  - Visualización de progreso (confianza, fase, preguntas)
  - Chat conversacional con el agente
  - Botón para finalizar y desplegar el proyecto

- **`client/src/components/AIChatBox.tsx`**: Componente reutilizable de chat
  - Renderización de mensajes
  - Input de usuario
  - Soporte para Markdown

#### 3. Base de Datos (MySQL + Drizzle ORM)
- **`drizzle/schema.ts`**: Tablas relevantes
  - `sprints`: Almacena los sprints creados
  - `tasks`: Almacena las tareas generadas
  - `agents`: Almacena los agentes disponibles

## Flujo de Funcionamiento

### Fase 1: Idea General (0-30% Confianza)
El agente pregunta sobre:
- Concepto general del proyecto
- Problema que resuelve
- Tipo de proyecto
- Usuarios principales

### Fase 2: Requisitos Funcionales (30-60% Confianza)
El agente pregunta sobre:
- Funcionalidades principales
- Usuarios/stakeholders
- Flujo de trabajo esperado
- Integraciones externas

### Fase 3: Detalles Técnicos (60-85% Confianza)
El agente pregunta sobre:
- Tecnologías preferidas
- Restricciones (presupuesto, tiempo)
- Recursos disponibles
- Dependencias externas

### Fase 4: Validación Final (85-93% Confianza)
El agente:
- Confirma la comprensión del proyecto
- Pregunta sobre prioridades
- Identifica riesgos potenciales
- Genera el Markdown con el tablero

### Finalización (≥93% Confianza)
El agente genera automáticamente:
- Nombre del proyecto
- Visión general
- Historias de usuario (mínimo 3)
- Tareas técnicas iniciales
- Tablero Kanban (To Do, In Progress, Done)
- Sugerencia de agentes y habilidades requeridas

## Uso

### Para Usuarios
1. Navega al Dashboard
2. Selecciona la pestaña "Project Owner"
3. Responde las preguntas del agente de forma clara y detallada
4. Cuando la confianza alcance 93%, haz clic en "Desplegar Misión"
5. El proyecto se crea automáticamente con un sprint inicial y tareas

### Para Desarrolladores

#### Personalizar el Prompt del Sistema
Edita `server/_core/projectOwnerPrompts.ts`:
```typescript
export const SYSTEM_PROMPT = `
Tu prompt personalizado aquí
`;
```

#### Añadir Nuevas Preguntas
Modifica las constantes de preguntas:
```typescript
export const PHASE_1_QUESTIONS = [
  "Tu pregunta aquí",
  // ...
];
```

#### Cambiar el Modelo de IA
En `server/_core/llm.ts`, cambia:
```typescript
model: "gemini-2.5-flash" // Cambia a otro modelo
```

## Endpoints de tRPC

### `projectOwner.chat`
**Tipo**: Mutation (protegido)

**Input**:
```typescript
{
  messages: Array<{
    role: "user" | "assistant" | "system",
    content: string
  }>,
  phase?: number,        // 1-4
  questionsAsked?: number
}
```

**Output**:
```typescript
{
  message: string,       // Respuesta del agente
  confidence: number,    // 0-100
  isFinished: boolean,   // ¿Entrevista terminada?
  phase: number,         // Fase actual
  questionsAsked: number // Total de preguntas
}
```

### `projectOwner.finalizeProject`
**Tipo**: Mutation (protegido)

**Input**:
```typescript
{
  projectName: string,
  description: string,
  markdownBoard: string  // Markdown generado por el agente
}
```

**Output**:
```typescript
{
  success: boolean,
  sprintId: number,
  taskCount: number
}
```

## Integración con OpenClaw (Futuro)

En futuras versiones, el Agente Project Owner puede:
1. Recomendar automáticamente agentes específicos basados en habilidades
2. Crear agentes dinámicamente si no existen
3. Asignar tareas a agentes automáticamente
4. Iniciar un sprint automáticamente

## Mejoras Futuras

1. **Persistencia de Sesiones**: Guardar el estado de la entrevista para reanudar después
2. **Análisis de Sentimiento**: Detectar frustración o confusión del usuario
3. **Generación de Documentación**: Crear documentos adicionales (especificaciones, roadmap)
4. **Integración con Jira/Trello**: Exportar tareas a otras plataformas
5. **Soporte Multiidioma**: Entrevistas en español, inglés, etc.
6. **Análisis de Riesgos**: Identificar automáticamente riesgos del proyecto
7. **Estimación Automática**: Calcular horas de estimación basadas en complejidad

## Troubleshooting

### El agente no responde
- Verifica que `OPENAI_API_KEY` esté configurada correctamente
- Revisa los logs del servidor en `server/index.ts`

### Las tareas no se crean
- Verifica que la base de datos esté conectada
- Revisa que el Markdown sea válido (formato de encabezados)

### La confianza no aumenta
- Asegúrate de que el LLM incluya "Confianza: XX%" en la respuesta
- Revisa la función `extractConfidence()` en `projectOwnerRouter.ts`

## Créditos de Desarrollo

- **Análisis del Código Existente**: 50 créditos
- **Implementación del Router**: 50 créditos
- **Interfaz de Usuario**: 50 créditos
- **Sistema de Prompts y Fases**: 50 créditos
- **Total**: 200 créditos

## Licencia

Parte del proyecto JeiKeiStation MISSION CONTROL © 2026
