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
- [ ] Transiciones de estado con validación
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
- [ ] Prevención de asignación de tareas bloqueadas
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
- [ ] Autenticación y autorización
- [ ] Sincronización en tiempo real (WebSocket o polling)
- [ ] Manejo de errores global
- [ ] Logging y monitoreo
- [ ] Optimización de rendimiento

## Documentación y Despliegue
- [ ] README.md con instrucciones de instalación
- [ ] Documentación de API tRPC
- [ ] Guía de uso de la plataforma
- [ ] Crear repositorio GitHub privado
- [ ] Subir código a GitHub
- [ ] Configurar CI/CD básico
