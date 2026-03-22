# 🚀 Estrategia de Despliegue y Actualización en Oracle Cloud

Documentación de la nueva estrategia de despliegue automático en Oracle Cloud con actualización continua.

---

## 📊 Cambios Implementados

### 1. **docker-compose.prod.yml - Watchtower Agregado**

Se agregó el servicio **Watchtower** para automatizar las actualizaciones de contenedores:

```yaml
watchtower:
  image: containrrr/watchtower
  container_name: watchtower
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
  environment:
    - WATCHTOWER_CLEANUP=true          # Elimina imágenes antiguas
    - WATCHTOWER_POLL_INTERVAL=300     # Verifica cada 5 minutos
    - WATCHTOWER_INCLUDE_RESTARTING=true
  networks:
    - jeikei-net
  restart: always
```

**¿Qué hace Watchtower?**

| Función | Descripción |
|---------|-------------|
| **Monitoreo** | Verifica cada 5 minutos si hay nuevas versiones de imágenes |
| **Actualización** | Descarga e inicia automáticamente nuevas versiones |
| **Limpieza** | Elimina imágenes antiguas para ahorrar espacio en disco |
| **Reinicio** | Reinicia contenedores con la nueva imagen |

---

### 2. **Direct-to-Oracle.yml - Workflow Mejorado**

#### Cambios principales:

**Antes:**
```bash
sudo docker compose -f docker-compose.prod.yml down
sudo docker compose -f docker-compose.prod.yml up -d --build
```

**Ahora:**
```bash
sudo docker compose -f docker-compose.prod.yml build
sudo docker compose -f docker-compose.prod.yml up -d
```

**Ventajas:**
- ✅ **Sin downtime completo** - Los servicios no se detienen todos a la vez
- ✅ **Reconstrucción inteligente** - Solo reconstruye lo que cambió
- ✅ **Mejor manejo de dependencias** - Respeta el orden de `depends_on`

---

## 🔄 Flujo de Actualización Automática

### Escenario 1: Cambios en Código (GitHub Push)

```
1. Desarrollador hace push a rama 'depl'
   ↓
2. GitHub Actions dispara Direct-to-Oracle.yml
   ↓
3. SSH a Oracle Cloud
   ↓
4. git pull origin depl
   ↓
5. docker compose build (reconstruye imágenes)
   ↓
6. docker compose up -d (inicia/actualiza servicios)
   ↓
7. Watchtower monitorea cambios
```

### Escenario 2: Actualización de Imagen Base (Automática)

```
1. Watchtower verifica cada 5 minutos
   ↓
2. Detecta nueva versión de postgres:15-alpine
   ↓
3. Descarga la nueva imagen
   ↓
4. Reinicia el contenedor con la nueva imagen
   ↓
5. Limpia imágenes antiguas
```

---

## 🛠️ Configuración en Oracle Cloud

### Paso 1: Clonar el repositorio (primera vez)

```bash
cd /home/ubuntu
git clone -b depl https://github.com/jikey8911/JeiKeiStation_MISSION_CONTROL.git
cd JeiKeiStation_MISSION_CONTROL
```

### Paso 2: Crear archivo .env.production

```bash
# Copiar el archivo de ejemplo
cp .env.production.example .env.production

# Editar con credenciales reales
nano .env.production
```

**Variables requeridas:**
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<tu_contraseña_segura>
POSTGRES_DB=jeikei_station
TELEGRAM_BOT_TOKEN=<tu_token>
VITE_API_URL=http://147.224.220.58:3001
```

### Paso 3: Iniciar servicios

```bash
sudo docker compose -f docker-compose.prod.yml up -d
```

### Paso 4: Verificar estado

```bash
# Ver todos los contenedores
sudo docker ps

# Ver logs de un servicio específico
sudo docker logs jeikei_api_server_prod -f

# Ver estado de Watchtower
sudo docker logs watchtower -f
```

---

## 📋 Monitoreo de Actualizaciones

### Ver logs de Watchtower

```bash
sudo docker logs watchtower -f

# Ejemplo de salida:
# 2026-03-22T10:30:15Z - Found new postgres:15-alpine image
# 2026-03-22T10:30:45Z - Restarting container jeikei_postgres_prod
# 2026-03-22T10:31:00Z - Cleanup: Removed old image postgres:15-alpine@sha256:abc123
```

### Desactivar actualizaciones automáticas (si es necesario)

Para un servicio específico, agregar etiqueta en docker-compose:

```yaml
jeikei_api:
  build:
    context: .
    dockerfile: Dockerfile
  labels:
    - "com.centurylinklabs.watchtower.enable=false"
```

### Configurar intervalo de verificación

En docker-compose.prod.yml, cambiar `WATCHTOWER_POLL_INTERVAL`:

```yaml
environment:
  - WATCHTOWER_POLL_INTERVAL=600  # Cambiar a 10 minutos
```

---

## ⚠️ Consideraciones de Seguridad

| Aspecto | Recomendación |
|--------|---------------|
| **Credenciales** | Usar `.env.production` (no en repo) |
| **SSH Key** | Almacenar en GitHub Secrets |
| **Deploy Token** | Usar token con permisos limitados |
| **Watchtower** | Monitorear logs regularmente |

---

## 🚨 Troubleshooting

### Problema: Watchtower no actualiza servicios

**Solución:**
```bash
# Verificar que Watchtower está corriendo
sudo docker ps | grep watchtower

# Ver logs
sudo docker logs watchtower

# Reiniciar Watchtower
sudo docker restart watchtower
```

### Problema: Despliegue falla en GitHub Actions

**Solución:**
```bash
# En Oracle Cloud, verificar logs
sudo docker logs jeikei_api_server_prod

# Verificar conectividad SSH desde GitHub
ssh -i ~/.ssh/id_rsa ubuntu@147.224.220.58 "docker ps"
```

### Problema: Disco lleno en Oracle Cloud

**Solución:**
```bash
# Limpiar imágenes sin usar
sudo docker image prune -a -f

# Limpiar volúmenes sin usar
sudo docker volume prune -f

# Ver uso de disco
df -h
```

---

## 📊 Comparativa: Antes vs Después

| Aspecto | Antes | Después |
|--------|-------|---------|
| **Actualizaciones** | Manual (push a depl) | Automática (GitHub + Watchtower) |
| **Downtime** | Completo (down + up) | Mínimo (up -d) |
| **Reconstrucción** | Siempre | Solo si cambió |
| **Limpieza de imágenes** | Manual | Automática |
| **Intervalo de actualización** | Cada push | Cada 5 minutos (configurable) |
| **Imágenes base** | Manual | Automática |

---

## 🎯 Próximos Pasos

1. **Probar en staging** - Desplegar en una VM de prueba primero
2. **Configurar alertas** - Monitorear logs de Watchtower
3. **Documentar runbooks** - Procedimientos de rollback
4. **Automatizar backups** - Antes de actualizaciones

---

## 📞 Comandos Útiles

```bash
# SSH a Oracle Cloud
ssh -i ~/.ssh/jeikei_oracle ubuntu@147.224.220.58

# Actualizar manualmente
cd /home/ubuntu/JeiKeiStation_MISSION_CONTROL
git pull origin depl
sudo docker compose -f docker-compose.prod.yml up -d

# Ver estado completo
sudo docker compose -f docker-compose.prod.yml ps

# Rollback a imagen anterior
sudo docker compose -f docker-compose.prod.yml up -d --no-build
```

---

**Última actualización:** 22 de Marzo de 2026  
**Versión:** 2.0.0 (Con Watchtower)
