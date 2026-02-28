# Integración de OpenClaw con JeiKeiStation

Este documento describe la integración completa del agente OpenClaw con la plataforma JeiKeiStation para la gestión automática de tareas SCRUM.

## Arquitectura General

La integración consta de cuatro componentes principales:

### 1. Backend (Node.js + tRPC)

El backend expone endpoints protegidos por API Key que permiten a OpenClaw acceder a los datos y ejecutar acciones sobre el tablero SCRUM.

**Archivos clave:**
- `server/serviceAuth.ts`: Middleware de autenticación por API Key
- `server/webhooksRouter.ts`: Router para registrar webhooks de notificación
- `server/routers.ts`: Endpoints protegidos con `serviceProcedure`

**Endpoints disponibles para OpenClaw:**

| Procedimiento | Tipo | Descripción |
|---|---|---|
| `tasks.list` | Query | Obtiene todas las tareas (opcional: filtrar por sprint) |
| `tasks.get` | Query | Obtiene detalles de una tarea específica |
| `tasks.serviceAutoAssign` | Mutation | Asigna automáticamente una tarea al mejor agente disponible |
| `dependencies.getBlocking` | Query | Obtiene tareas que bloquean una tarea específica |
| `agents.list` | Query | Obtiene lista de agentes disponibles |
| `sprints.get` | Query | Obtiene detalles de un sprint |
| `webhooks.register` | Mutation | Registra una URL de webhook para notificaciones |

### 2. Skill de OpenClaw

La skill define las capacidades del agente y actúa como contrato entre OpenClaw y JeiKeiStation.

**Archivo:** `openclaw/skills/jeikei_mission_control/SKILL.md`

**Capacidades principales:**
- `list_tasks`: Obtiene tareas del backlog o sprint
- `auto_assign_task`: Ejecuta lógica de matching de habilidades
- `update_status`: Cambia el estado de una tarea
- `analyze_blockage`: Identifica tareas bloqueantes
- `get_sprint_status`: Obtiene métricas del sprint

### 3. Script Python (Cliente de la Skill)

El script implementa la lógica de razonamiento de habilidades comparando `requiredSkills` de las tareas con las `skills` de los agentes.

**Archivo:** `openclaw/skills/jeikei_mission_control/jeikei_skill.py`

**Clase principal:** `JeiKeiClient`

**Métodos clave:**
```python
client = JeiKeiClient()
tasks = client.list_tasks()
agents = client.get_agents()
match_analysis = client.analyze_skills_match(task_id=1)
result = client.auto_assign(task_id=1)
blocking = client.get_blocking_tasks(task_id=1)
```

### 4. Frontend (React + TypeScript)

El frontend implementa validaciones SCRUM y visualización de dependencias.

**Componentes nuevos:**
- `TaskDependencyGraph.tsx`: Grafo visual de dependencias
- `TaskCard.tsx` (actualizado): Indicador visual de tareas bloqueadas
- `TaskBoard.tsx` (actualizado): Validación de bloqueos antes de mover tareas

## Configuración

### Variables de Entorno

Copiar `.env.example` a `.env` y configurar:

```bash
# Backend
DATABASE_URL=mysql://user:password@localhost:3306/jeikei_station
SERVICE_API_KEY=jk_secret_agent_key_2026

# OpenClaw Integration
OPENCLAW_BASE_URL=http://localhost:3000/api/trpc
OPENCLAW_API_KEY=jk_secret_agent_key_2026
```

### Instalación de Dependencias

El proyecto ya incluye `axios` en `package.json`. Para el script Python, instalar:

```bash
pip install requests
```

## Flujo de Integración

### 1. Autenticación

OpenClaw debe enviar la cabecera `x-api-key` en todas las solicitudes:

```bash
curl -H "x-api-key: jk_secret_agent_key_2026" \
  http://localhost:3000/api/trpc/tasks/list
```

### 2. Obtención de Tareas Huérfanas

El agente ejecuta el script `heartbeat.py` cada 30 minutos:

```python
from jeikei_skill import JeiKeiClient

client = JeiKeiClient()
tasks = client.list_tasks()
orphan_tasks = [t for t in tasks if not t.get('assignedAgentId') and t['status'] != 'done']
```

### 3. Análisis de Matching de Habilidades

Para cada tarea huérfana, analizar qué agentes pueden ejecutarla:

```python
analysis = client.analyze_skills_match(task_id=1)
# Retorna:
# {
#   "task_id": 1,
#   "task_title": "Implementar API REST",
#   "required_skills": ["BACKEND", "DB"],
#   "recommendations": [
#     {
#       "agent_id": 2,
#       "agent_name": "Agent Backend Pro",
#       "score": 1.0,
#       "matching_skills": ["BACKEND", "DB"],
#       "workload": 2,
#       "capacity": 10
#     }
#   ]
# }
```

### 4. Asignación Automática

Una vez identificado el mejor agente, ejecutar la asignación:

```python
result = client.auto_assign(task_id=1)
# Retorna: {"agentId": 2, "agentName": "Agent Backend Pro"}
```

### 5. Notificaciones de Bloqueo

Cuando una tarea cambia a estado "qa" o "blocked", el servidor dispara un webhook:

```python
# En el backend, después de updateTaskStatus:
await notifyOpenClaw("task_blocked", {
  "taskId": task.id,
  "taskTitle": task.title,
  "blockingTasks": blocking_tasks
})
```

## Validaciones SCRUM en el Frontend

### Prevención de Movimiento de Tareas Bloqueadas

En `TaskBoard.tsx`, antes de permitir que una tarea pase a "in_progress":

```typescript
const blockingTasks = await utils.dependencies.getBlocking.fetch({ 
  taskId: draggedTask.id 
});

if (blockingTasks && blockingTasks.length > 0) {
  toast.error("Tarea bloqueada", {
    description: `Depende de: ${blockingTitles}`
  });
  return; // No permitir el movimiento
}
```

### Indicadores Visuales

En `TaskCard.tsx`, las tareas bloqueadas muestran:
- Borde izquierdo rojo en lugar de azul
- Icono de candado con tooltip
- Opacidad reducida

## Heartbeat de Monitoreo

El script `heartbeat.py` ejecuta automáticamente cada 30 minutos:

```bash
# Configurar cron job (Linux/Mac)
*/30 * * * * cd /path/to/JeiKeiStation && python openclaw/skills/jeikei_mission_control/heartbeat.py

# O ejecutar manualmente
python openclaw/skills/jeikei_mission_control/heartbeat.py
```

**Lógica del heartbeat:**
1. Obtener todas las tareas
2. Filtrar tareas huérfanas (sin agente, no finalizadas)
3. Para cada tarea huérfana, llamar a `auto_assign`
4. Registrar resultados en logs

## Ejemplo de Uso Completo

```python
from jeikei_skill import JeiKeiClient

# Inicializar cliente
client = JeiKeiClient()

# 1. Obtener tareas del sprint actual
tasks = client.list_tasks(sprint_id=1)
print(f"Total de tareas: {len(tasks)}")

# 2. Identificar tareas sin asignar
unassigned = [t for t in tasks if not t.get('assignedAgentId')]
print(f"Tareas sin asignar: {len(unassigned)}")

# 3. Para cada tarea, analizar matching de habilidades
for task in unassigned:
    analysis = client.analyze_skills_match(task['id'])
    best_match = analysis['recommendations'][0]
    
    print(f"Tarea: {task['title']}")
    print(f"  Habilidades requeridas: {task['requiredSkills']}")
    print(f"  Mejor agente: {best_match['agent_name']} (score: {best_match['score']})")
    
    # 4. Asignar tarea
    result = client.auto_assign(task['id'])
    print(f"  Asignado a: {result['agentName']}")

# 5. Verificar bloqueos
for task in tasks:
    blocking = client.get_blocking_tasks(task['id'])
    if blocking:
        print(f"Tarea {task['title']} está bloqueada por: {[b['title'] for b in blocking]}")
```

## Troubleshooting

### Error: "Invalid or missing API Key"
- Verificar que `SERVICE_API_KEY` está configurado en `.env`
- Confirmar que OpenClaw envía la cabecera `x-api-key` correctamente
- Verificar que la clave coincide exactamente (sensible a mayúsculas/minúsculas)

### Error: "No available agent with required skills"
- Verificar que existen agentes en la base de datos
- Confirmar que los agentes tienen las habilidades requeridas
- Revisar que los agentes no están en estado "offline"
- Verificar que no han alcanzado su capacidad máxima

### Tareas no se asignan automáticamente
- Verificar que el heartbeat está ejecutándose
- Revisar logs del script `heartbeat.py`
- Confirmar que las tareas tienen `requiredSkills` definidas
- Verificar que hay agentes disponibles con esas habilidades

## Referencias

- [tRPC Documentation](https://trpc.io/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [OpenClaw Documentation](https://openclaw.io/)

- https://didactic-eureka-x5qp5745p5xvfwqj-3000.app.github.dev/

<!-- - https://didactic-eureka-x5qp5745p5xvfwqj-3306.app.github.dev/ -->

- https://didactic-eureka-x5qp5745p5xvfwqj-5173.app.github.dev/

- https://didactic-eureka-x5qp5745p5xvfwqj-40249.app.github.dev/

- https://didactic-eureka-x5qp5745p5xvfwqj-42829.app.github.dev/