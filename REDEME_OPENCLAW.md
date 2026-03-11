# OpenClaw Docker Setup

Configuración completa de OpenClaw con Docker Compose, incluyendo agentes preconfigurados y skills.

## 📋 Estructura del Proyecto

```
.
├── docker-compose.yml       # Configuración de servicios
├── Dockerfile              # Imagen Docker para OpenClaw
├── openclaw.json           # Configuración principal de OpenClaw
├── agents/
│   └── agents-config.json  # Agentes preconfigurados
├── skills/
│   └── skills-config.json  # Skills disponibles
├── setup.sh               # Script de inicialización
└── .dockerignore          # Archivos a ignorar en build
```

## 🚀 Inicio Rápido

### 1. Construir e Inicializar
```bash
chmod +x setup.sh
./setup.sh
```

O manualmente:
```bash
docker-compose build
```

### 2. Iniciar OpenClaw
```bash
docker-compose up -d
```

### 3. Ver logs
```bash
docker-compose logs -f openclaw
```

### 4. Acceder
- URL: `http://localhost:5000`
- API: `http://localhost:5000/api/v1`

## 📦 Servicios Incluidos

### openclaw
- **Puerto:** 5000 (Web), 8000 (API adicional)
- **Volúmenes:**
  - `openclaw.json` → configuración
  - `agents/` → agentes
  - `skills/` → skills
  - Volúmenes persistentes para datos y caché

### redis (opcional)
- **Puerto:** 6379
- **Uso:** Caché para OpenClaw

## ⚙️ Configuración (openclaw.json)

### Gateway
- Host: `0.0.0.0`
- Puerto: `5000`
- CORS habilitado
- Rate limiting: 100 req/min

### Agentes Preconfigurados

1. **Code Analyzer** - Análisis y revisión de código
2. **Research Agent** - Búsqueda e investigación
3. **Data Processor** - Procesamiento de datos
4. **Content Creator** - Creación de contenido

### Skills Disponibles

1. **web-search** - Búsqueda en internet
2. **file-operations** - Operaciones con archivos
3. **code-execution** - Ejecución segura de código
4. **database-query** - Consultas a bases de datos

## 🔧 Personalización

### Cambiar modelo principal
Edita `openclaw.json`:
```json
"models": {
  "default": "gpt-4"  // Cambiar a tu modelo
}
```

### Agregar nuevos agentes
1. Crea agente en `agents/agents-config.json`
2. Reinicia: `docker-compose restart openclaw`

### Habilitar Docker Model Runner
En `openclaw.json`, cambiar `enabled: false` a `enabled: true`:
```json
"docker-model-runner": {
  "type": "openai-compatible",
  "baseUrl": "http://host.docker.internal:8000/v1",
  "enabled": true
}
```

## 📊 Comandos Útiles

```bash
# Ver estado de servicios
docker-compose ps

# Ejecutar comando en contenedor
docker-compose exec openclaw bash

# Detener servicios
docker-compose down

# Limpiar todo
docker-compose down -v

# Rebuild sin caché
docker-compose build --no-cache

# Ver logs de redis
docker-compose logs redis

# Ver logs específico con filtro
docker-compose logs openclaw | grep ERROR
```

## 🔐 Consideraciones de Seguridad

- Los agentes corren en sandbox
- Límite de ejecución: 300 segundos
- Límite de memoria: 512MB
- Las rutas de archivo están restringidas
- CORS habilitado para `localhost`

## 🐛 Troubleshooting

### OpenClaw no inicia
```bash
docker-compose logs openclaw
```

### Port ya está en uso
```bash
# Cambiar puerto en docker-compose.yml
ports:
  - "5001:5000"  # Cambiar 5001 a puerto disponible
```

### Redis connection error
Asegúrate de que redis esté corriendo:
```bash
docker-compose up redis -d
```

## 📝 Notas

- La configuración se carga desde `openclaw.json`
- Los volúmenes persisten datos entre reinicios
- Log level por defecto: `info`
- Cache TTL: 1 hora

## 🤝 Soporte

Para más información sobre OpenClaw:
- Documentación: https://openclaw.ai
- GitHub: https://github.com/openclaw-dev/openclaw
