# JeiKeiStation - Project TODO

## Base de Datos y Backend
- [x] Esquema de base de datos: agentes, tareas, sprints, dependencias, asignaciones
- [x] Modelos Drizzle ORM para todas las entidades
- [x] Procedimientos tRPC para CRUD de agentes
- [x] Procedimientos tRPC para CRUD de tareas
- [x] Procedimientos tRPC para CRUD de sprints
- [x] Parser de Markdown para importación de tareas
- [x] Motor de asignación automática de tareas por habilidades
- [x] Sistema de validación de dependencias
- [x] Procedimientos tRPC para gestión de dependencias
- [ ] Tests unitarios para backend

## Frontend - Tablero Kanban
- [x] Componente TaskBoard con 5 columnas SCRUM
- [x] Animaciones FLIP para movimiento de tarjetas
- [x] Drag-and-drop entre columnas
- [x] Transiciones de estado con validación (SCRUM)
- [x] Tarjetas de tareas con metadatos
- [x] Indicadores de prioridad y estimación
- [ ] Visualización de dependencias en tarjetas

## Frontend - Gestión de Agentes
- [x] Tabla/grid de agentes con perfiles
- [x] Avatares especializados por habilidad
- [x] Indicadores de estado en tiempo real
- [x] Visualización de carga de trabajo por agente
- [x] Modal de creación/edición de agentes
- [x] Asignación de habilidades a agentes

## Frontend - Oficina Virtual Animada
- [x] Componente principal de oficina virtual
- [x] Estaciones de trabajo visuales para cada estado SCRUM
- [x] Avatares de agentes en la oficina
- [ ] Animación de tareas moviéndose entre estaciones
- [ ] Efectos de partículas para transiciones
- [x] Indicadores de actividad en tiempo real
- [ ] Líneas de conexión animadas entre agentes y tareas

## Frontend - Panel de Control Enterprise
- [x] Diseño dark/navy elegante
- [x] Dashboard principal con métricas clave
- [x] Velocity chart (gráfico de velocidad)
- [x] Burndown/Burnup chart
- [ ] Distribución de trabajo por tipo de agente
- [ ] Tiempo promedio por estado
- [x] Indicadores de actividad en tiempo real
- [x] Alertas visuales de bloqueos
- [ ] Indicador de salud del sprint

## Frontend - Importador de Markdown
- [x] Componente de carga de archivo Markdown
- [x] Parser de estructura de tareas
- [x] Validación de metadatos
- [ ] Preview de tareas antes de importar
- [x] Importación masiva a base de datos
- [x] Manejo de errores y reportes

## Frontend - Gestión de Dependencias
- [ ] Visualización de grafo de dependencias
- [ ] Modal de edición de dependencias
- [ ] Validación de ciclos circulares
- [x] Prevención de asignación de tareas bloqueadas (TaskBoard validation)
- [ ] Indicadores visuales de tareas bloqueadas

## Frontend - Gestión de Sprints
- [x] Planificación de sprint (selección de tareas)
- [ ] Seguimiento diario (daily standup)
- [ ] Revisión de sprint (demo)
- [ ] Retrospectiva de sprint
- [x] Transiciones de estado de sprint
- [ ] Historial de sprints

## Frontend - Notificaciones
- [x] Sistema de notificaciones en tiempo real
- [x] Alertas de aprobaciones pendientes
- [x] Alertas de tareas bloqueadas
- [x] Notificaciones de finalización de QA
- [x] Notificaciones de cierre de sprints
- [ ] Centro de notificaciones

## Integración General
- [x] Autenticación y autorización (API Key para OpenClaw)
- [ ] Sincronización en tiempo real (WebSocket o polling)
- [ ] Manejo de errores global
- [ ] Logging y monitoreo
- [ ] Optimización de rendimiento

## Documentación y Despliegue
- [ ] README.md con instrucciones de instalación
- [x] Documentación de API tRPC (OpenClaw SKILL.md)
- [ ] Guía de uso de la plataforma
- [ ] Crear repositorio GitHub privado
- [ ] Subir código a GitHub
- [ ] Configurar CI/CD básico

## Centro de Notificaciones Avanzado (Nueva Solicitud)
- [x] Procedimientos tRPC para marcar notificaciones como leídas
- [x] Procedimientos tRPC para archivar notificaciones
- [x] Procedimientos tRPC para filtrar notificaciones por tipo
- [x] Componente NotificationCenter con interfaz elegante
- [x] Filtros por tipo de alerta (aprobaciones, bloqueos, QA, sprints)
- [x] Opciones de marcar como leído/archivar en lote
- [x] Componente NotificationBell en la barra de navegación
- [x] Integración en el Dashboard principal
- [ ] Tests unitarios para notificaciones

## Integración con OpenClaw (Nueva Implementación)
- [x] Autenticación por API Key en tRPC (server/serviceAuth.ts)
- [x] Router de webhooks para notificaciones externas (server/webhooksRouter.ts)
- [x] Definición de SKILL.md con capacidades de la skill
- [x] Script jeikei_skill.py con lógica de matching de habilidades
- [x] Cliente HTTP en Python para consumir endpoints tRPC
- [x] Validación SCRUM en TaskBoard (prevención de movimiento de tareas bloqueadas)
- [x] Indicadores visuales de tareas bloqueadas en TaskCard
- [x] Componente TaskDependencyGraph para visualizar dependencias
- [x] Script heartbeat.py para monitoreo automático cada 30 minutos
- [x] Documentación completa de integración (OPENCLAW_INTEGRATION.md)
- [x] Variables de entorno configuradas (.env.example)
