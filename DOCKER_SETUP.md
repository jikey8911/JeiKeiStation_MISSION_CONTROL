# OpenClaw Docker Setup - Composiciones Completamente Separadas

## Archivos

- **docker-compose.ollama.yml** - Solo Ollama (NUNCA reconstruir en desarrollo)
- **docker-compose.redis.yml** - Solo Redis (NUNCA reconstruir en desarrollo)
- **docker-compose.openclaw.yml** - Solo OpenClaw (reconstruible sin afectar infra)

## Primer inicio (ONE TIME)

```bash
# 1. Levantar Ollama
docker compose -f docker-compose.ollama.yml up -d

# 2. Levantar Redis
docker compose -f docker-compose.redis.yml up -d

# 3. Descargar modelo en Ollama (primera vez toma ~5min)
docker exec openclaw-ollama ollama pull llama3.2:latest

# 4. Levantar OpenClaw
docker compose -f docker-compose.openclaw.yml up -d
```

## Ciclo de desarrollo (NORMAL)

### Reconstruir solo OpenClaw
```bash
docker compose -f docker-compose.openclaw.yml down
docker compose -f docker-compose.openclaw.yml build --no-cache
docker compose -f docker-compose.openclaw.yml up -d
```

**Ollama y Redis siguen corriendo sin problemas** ✅
**Modelo no se descarga nuevamente** ✅

### Solo reiniciar OpenClaw
```bash
docker compose -f docker-compose.openclaw.yml restart
```

## Operaciones con infraestructura

### Reiniciar Ollama (RARO - solo si hay problema)
```bash
docker compose -f docker-compose.ollama.yml restart
```

### Reiniciar Redis (RARO - solo si hay problema)
```bash
docker compose -f docker-compose.redis.yml restart
```

### Ver estado
```bash
docker compose -f docker-compose.ollama.yml ps
docker compose -f docker-compose.redis.yml ps
docker compose -f docker-compose.openclaw.yml ps
```

### Ver logs
```bash
# Ollama
docker compose -f docker-compose.ollama.yml logs -f

# Redis
docker compose -f docker-compose.redis.yml logs -f

# OpenClaw
docker compose -f docker-compose.openclaw.yml logs -f openclaw
```

## Limpieza

### PARCIAL (solo OpenClaw, infra se mantiene)
```bash
docker compose -f docker-compose.openclaw.yml down
```

### TOTAL (elimina TODO incluyendo volúmenes)
```bash
docker compose -f docker-compose.openclaw.yml down
docker compose -f docker-compose.redis.yml down -v
docker compose -f docker-compose.ollama.yml down -v
```

## Ventajas

✅ Ollama nunca se reconstruye (modelo persistente)
✅ Redis nunca se reconstruye (datos persistentes)
✅ Reconstruyes OpenClaw SIN AFECTAR infraestructura
✅ Ollama y Redis son independientes
✅ Más rápido en ciclos de desarrollo
✅ Fácil mantener versiones estables de dependencias
