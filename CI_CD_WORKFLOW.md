# 🔄 CI/CD Workflow - JeiKei Mission Control

Documentación completa del flujo de integración continua y despliegue automático.

---

## 📊 Arquitectura del Flujo

```
┌─────────────────────────────────────────────────────────────┐
│  JeiKeiStation_MISSION_CONTROL (Principal)                  │
│  https://github.com/jikey8911/JeiKeiStation_MISSION_CONTROL │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Push a rama 'dev'
                     │
                     ▼
        ┌────────────────────────────┐
        │  GitHub Actions Trigger    │
        │  (sync-and-deploy.yml)     │
        └────────────────┬───────────┘
                         │
        ┌────────────────┴───────────┐
        │                            │
        ▼                            ▼
   ┌─────────────┐          ┌──────────────────┐
   │ Merge       │          │ Build & Push     │
   │ dev → main  │          │ Frontend/Backend │
   │ (Sync Repo) │          │ Images           │
   └──────┬──────┘          └────────┬─────────┘
          │                          │
          └──────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  SSH to Oracle Cloud VM    │
        │  147.224.220.58            │
        └────────────────┬───────────┘
                         │
        ┌────────────────┴───────────┐
        │                            │
        ▼                            ▼
   ┌─────────────┐          ┌──────────────────┐
   │ Deploy      │          │ Deploy           │
   │ Frontend    │          │ Backend          │
   │ (3000)      │          │ (3001)           │
   └─────────────┘          └──────────────────┘
```

---

## 🔄 Workflow 1: Sincronización Automática (sync-and-deploy.yml)

### Trigger
```yaml
on:
  push:
    branches:
      - dev
    paths:
      - 'apps/frontend/**'
      - 'apps/backend/**'
      - 'package.json'
      - 'pnpm-lock.yaml'
```

### Acciones
1. **Detecta cambios** en rama `dev` del repo principal
2. **Sincroniza** cambios a rama `main` del repo de despliegue
3. **Reconstruye** imágenes Docker (frontend + backend)
4. **Redeploy** automático en Oracle Cloud
5. **Verifica** salud de servicios

### Flujo Completo

```bash
# 1. Desarrollador hace cambios en repo principal
cd JeiKeiStation_MISSION_CONTROL
git checkout dev
# ... hacer cambios en frontend o backend ...
git add .
git commit -m "✨ Feature: Nueva funcionalidad"
git push origin dev

# 2. GitHub Actions detecta el push
# 3. Automáticamente:
#    - Sincroniza dev → main (repo de despliegue)
#    - Reconstruye frontend
#    - Reconstruye backend
#    - Redeploy en Oracle Cloud

# 4. Verificar despliegue
ssh -i ~/.ssh/jeikei_oracle ubuntu@147.224.220.58
docker ps | grep jeikei
```

---

## 🎛️ Workflow 2: Despliegue Manual (manual-deploy.yml)

Para servicios que **NO se actualizan automáticamente**:
- Ollama
- OpenClaw
- MySQL
- Redis

### Cómo usar

**Opción 1: Desde GitHub UI**
1. Ve a: https://github.com/jikey8911/JeiKeiStattion_DokerDep/actions
2. Selecciona: "Manual Deploy Service"
3. Click en "Run workflow"
4. Elige el servicio (dropdown)
5. Click en "Run workflow"

**Opción 2: Desde CLI (GitHub CLI)**
```bash
gh workflow run manual-deploy.yml \
  -f service=ollama \
  -R jikey8911/JeiKeiStattion_DokerDep
```

### Servicios Disponibles

| Servicio | Comando | Descripción |
|----------|---------|-------------|
| **Ollama** | `service=ollama` | Redeploy LLM + descarga modelo |
| **OpenClaw** | `service=openclaw` | Redeploy agente IA |
| **MySQL** | `service=mysql` | Restart base de datos |
| **Redis** | `service=redis` | Restart cache |

### Ejemplo: Desplegar Ollama

```bash
# Desde GitHub UI
1. Actions → Manual Deploy Service
2. Run workflow
3. Selecciona: ollama
4. Click "Run workflow"

# Desde CLI
gh workflow run manual-deploy.yml \
  -f service=ollama \
  -R jikey8911/JeiKeiStattion_DokerDep
```

---

## 📋 Configuración Requerida

### 1. GitHub Secrets (Ya configurados)
```
✅ ORACLE_CLOUD_HOST = 147.224.220.58
✅ ORACLE_CLOUD_USER = ubuntu
✅ ORACLE_CLOUD_SSH_KEY = (clave privada)
```

### 2. Estructura de Ramas

```
JeiKeiStation_MISSION_CONTROL
├── main (producción)
├── dev (desarrollo)
└── feature/* (características)

JeiKeiStattion_DokerDep
└── main (despliegue)
```

### 3. Archivos Necesarios en Repo Principal

```
JeiKeiStation_MISSION_CONTROL/
├── apps/
│   ├── frontend/
│   │   ├── src/
│   │   ├── package.json
│   │   └── Dockerfile
│   └── backend/
│       ├── src/
│       ├── package.json
│       └── Dockerfile
├── package.json
├── pnpm-lock.yaml
└── docker-compose.prod.yml
```

---

## 🚀 Casos de Uso

### Caso 1: Actualizar Frontend

```bash
# En tu máquina local
cd JeiKeiStation_MISSION_CONTROL
git checkout dev

# Hacer cambios
nano apps/frontend/src/App.tsx

# Commit y push
git add apps/frontend/
git commit -m "✨ Update UI components"
git push origin dev

# ✅ GitHub Actions automáticamente:
# - Sincroniza a repo de despliegue
# - Reconstruye imagen frontend
# - Redeploy en Oracle Cloud
```

### Caso 2: Actualizar Backend

```bash
# En tu máquina local
cd JeiKeiStation_MISSION_CONTROL
git checkout dev

# Hacer cambios
nano apps/backend/src/api.ts

# Commit y push
git add apps/backend/
git commit -m "🔧 Fix API endpoint"
git push origin dev

# ✅ GitHub Actions automáticamente:
# - Sincroniza a repo de despliegue
# - Reconstruye imagen backend
# - Redeploy en Oracle Cloud
```

### Caso 3: Desplegar Ollama Manualmente

```bash
# Opción 1: GitHub UI
# Actions → Manual Deploy Service → Run workflow → ollama

# Opción 2: GitHub CLI
gh workflow run manual-deploy.yml \
  -f service=ollama \
  -R jikey8911/JeiKeiStattion_DokerDep

# ✅ GitHub Actions:
# - Conecta por SSH a Oracle Cloud
# - Descarga imagen Ollama
# - Inicia contenedor
# - Descarga modelo llama3.2
```

### Caso 4: Desplegar OpenClaw Manualmente

```bash
# GitHub UI
# Actions → Manual Deploy Service → Run workflow → openclaw

# ✅ GitHub Actions:
# - Reconstruye imagen OpenClaw
# - Redeploy en Oracle Cloud
# - Verifica healthcheck
```

---

## 🔍 Monitoreo y Debugging

### Ver logs de GitHub Actions

```bash
# Opción 1: GitHub UI
# Actions → Workflow → Click en el run

# Opción 2: GitHub CLI
gh run list -R jikey8911/JeiKeiStattion_DokerDep
gh run view <RUN_ID> --log
```

### Ver logs en la VM

```bash
ssh -i ~/.ssh/jeikei_oracle ubuntu@147.224.220.58

# Ver logs de frontend
docker logs jeikei_vite_frontend -f

# Ver logs de backend
docker logs jeikei_api_server -f

# Ver logs de OpenClaw
docker logs openclaw-app -f

# Ver logs de Ollama
docker logs openclaw-ollama -f
```

### Verificar estado de servicios

```bash
ssh -i ~/.ssh/jeikei_oracle ubuntu@147.224.220.58

# Ver todos los servicios
docker ps

# Ver estado detallado
docker-compose -f /opt/jeikei/docker-compose.prod.yml ps

# Verificar healthchecks
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

## ⚠️ Troubleshooting

### El workflow no se ejecuta

**Problema:** Push a `dev` pero no se ejecuta el workflow

**Soluciones:**
1. Verificar que los cambios están en `apps/frontend/` o `apps/backend/`
2. Verificar que los secrets están configurados
3. Ver logs en: Actions → Workflow → Click en el run

### Despliegue falla

**Problema:** Workflow ejecuta pero falla en SSH

**Soluciones:**
1. Verificar SSH key en secrets
2. Verificar IP de Oracle Cloud
3. Ver logs: `docker logs jeikei_api_server`

### Servicio no inicia

**Problema:** Contenedor se reinicia constantemente

**Soluciones:**
```bash
ssh -i ~/.ssh/jeikei_oracle ubuntu@147.224.220.58

# Ver logs
docker logs <CONTAINER_NAME>

# Reiniciar servicio
docker-compose -f /opt/jeikei/docker-compose.prod.yml restart <SERVICE>

# Reconstruir
docker-compose -f /opt/jeikei/docker-compose.prod.yml build <SERVICE>
```

---

## 📚 Documentación Relacionada

- **README.md** - Instrucciones de despliegue
- **ENV_STRATEGY.md** - Estrategia de configuración
- **DEPLOYMENT_SUMMARY.md** - Resumen del despliegue
- **docker-compose.prod.yml** - Configuración de servicios

---

## 🔐 Seguridad

✅ **Implementado:**
- SSH key-based authentication
- GitHub Secrets encriptados
- No hay credenciales en el repositorio
- Logs no exponen información sensible

---

## 📞 Soporte

**Problemas o preguntas:**
1. Ver logs en GitHub Actions
2. Revisar documentación
3. Contactar al equipo de desarrollo

---

**Última actualización:** 19 de Marzo de 2026  
**Versión:** 1.0.0
