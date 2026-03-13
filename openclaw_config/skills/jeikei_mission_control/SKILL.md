# Skill: JeiKei Station Mission Control
Description: Permite al agente gestionar el tablero SCRUM, asignar tareas basadas en habilidades y resolver bloqueos en el proyecto JeiKeiStation.

## Capacidades
- `list_tasks(sprint_id=None)`: Obtiene la lista de tareas del backlog o de un sprint específico.
- `assign_agent(task_id, agent_id)`: Asigna manualmente un agente a una tarea.
- `update_status(task_id, status)`: Actualiza el estado de una tarea (backlog, in_progress, review, qa, done).
- `analyze_blockage(task_id)`: Identifica tareas bloqueantes que impiden el progreso de una tarea específica.
- `auto_assign_task(task_id)`: Ejecuta la lógica de matching en el servidor para encontrar al mejor agente disponible.
- `get_sprint_status(sprint_id)`: Obtiene un resumen del sprint actual y métricas de velocidad.

## Lógica de Matching de Habilidades
El script de esta skill realiza un razonamiento proactivo comparando el array `requiredSkills` de la tarea con las `skills` de los agentes disponibles en la base de datos para sugerir la mejor asignación antes de ejecutarla.

## Configuración
- `BASE_URL`: URL de la API de JeiKeiStation (ej. `http://localhost:3000/api/trpc`).
- `API_KEY`: Token de acceso para el agente (`x-api-key`).
