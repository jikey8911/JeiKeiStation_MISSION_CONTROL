# OpenClaw Docker Setup - Infraestructura Separada

## Estructura

- **docker-compose.infra.yml** - Ollama + Redis (infraestructura persistente)
- **docker-compose.openclaw.yml** - OpenClaw app (reconstruible sin afectar infra)

## Primer inicio (ONE TIME)

```bash
# 1. Levantar infraestructura (Ollama + Redis)
docker compose -f docker-compose.infra.yml up -d

# 2. Descargar modelo en Ollama (primera vez toma tiempo)
docker exec openclaw-ollama ollama pull llama3.2:latest

# 3. Levantar OpenClaw
docker compose -f docker-compose.openclaw.yml up -d
```

## Reinicios y reconstrucciones

### Reiniciar OpenClaw (sin tocar Ollama)
```bash
docker compose -f docker-compose.openclaw.yml restart
```

### Reconstruir imagen de OpenClaw
```bash
docker compose -f docker-compose.openclaw.yml down
docker compose -f docker-compose.openclaw.yml build --no-cache
docker compose -f docker-compose.openclaw.yml up -d
```

### Reiniciar TODO (incluyendo Ollama)
```bash
docker compose -f docker-compose.infra.yml restart
docker compose -f docker-compose.openclaw.yml restart
```

### Limpieza COMPLETA (elimina TODOS los volúmenes)
```bash
docker compose -f docker-compose.openclaw.yml down
docker compose -f docker-compose.infra.yml down -v
```

### Limpieza PARCIAL (solo OpenClaw, Ollama se mantiene)
```bash
docker compose -f docker-compose.openclaw.yml down
```

## Estado

```bash
# Ver contenedores de infraestructura
docker compose -f docker-compose.infra.yml ps

# Ver contenedores de OpenClaw
docker compose -f docker-compose.openclaw.yml ps

# Ver logs de Ollama
docker compose -f docker-compose.infra.yml logs openclaw-ollama

# Ver logs de OpenClaw
docker compose -f docker-compose.openclaw.yml logs openclaw-app
```

## Ventajas

✅ Ollama y Redis nunca se reconstruyen (modelo persistente)
✅ Puedes reconstruir OpenClaw sin descargar modelo nuevamente
✅ Infraestructura estable y separada
✅ Más rápido en ciclos de desarrollo
