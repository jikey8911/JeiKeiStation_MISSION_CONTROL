# Estrategia de Configuración de Entornos - JeiKei Station

## 📋 Estructura Correcta

```
Repositorio Git (GitHub)
├── .env.example                 ← Desarrollo LOCAL (localhost)
├── .env.production.example      ← Producción (DOCKER - sin valores reales)
├── docker-compose.yml           ← Desarrollo
├── docker-compose.prod.yml      ← Producción
└── .gitignore                   ← Ignora .env y .env.production
```

## 🔧 Configuración por Entorno

### 1. DESARROLLO LOCAL (.env)
**Ubicación:** Máquina local del desarrollador
**Rutas:** localhost

```env
# Backend
DATABASE_URL=mysql://jeikei_user:jeikei_password@localhost:3306/jeikei_station
PORT=3001
OPENCLAW_BASE_URL=http://localhost:5000

# Frontend
VITE_API_URL=http://localhost:3001
VITE_OAUTH_PORTAL_URL=http://localhost:5000
```

### 2. PRODUCCIÓN EN DOCKER (.env.production)
**Ubicación:** Oracle Cloud VM (NO en el repo)
**Rutas:** Nombres de servicios Docker

```env
# Backend
DATABASE_URL=mysql://jeikei_user:jeikei_password@mysql:3306/jeikei_station
PORT=3001
OPENCLAW_BASE_URL=http://openclaw-app:5000

# Frontend
VITE_API_URL=http://jeikei_api:3001
VITE_OAUTH_PORTAL_URL=http://openclaw-app:5000
```

## 🚀 Flujo de Despliegue

```
1. Desarrollador hace commit a rama 'main'
   ↓
2. GitHub Actions detecta cambio
   ↓
3. Construye imagen Docker
   ↓
4. Push a Docker Registry
   ↓
5. SSH a Oracle Cloud VM
   ↓
6. Descarga docker-compose.prod.yml del repo
   ↓
7. Inyecta variables de .env.production (en la VM)
   ↓
8. docker-compose -f docker-compose.prod.yml up -d
```

## 📝 Cambios Necesarios en el Repositorio

### A. docker-compose.prod.yml (NUEVO)
- Usar variables de entorno: `${VARIABLE_NAME}`
- NO hardcodear valores
- Usar nombres de servicios correctos

### B. .env.production.example (ACTUALIZAR)
- Incluir TODAS las variables necesarias
- Con placeholders seguros
- Documentar cada una

### C. docker-compose.yml (MANTENER)
- Solo para desarrollo local
- Rutas localhost

### D. .gitignore (VERIFICAR)
```
.env
.env.production
.env.local
```

## 🔐 Secretos Sensibles

**NUNCA en el repositorio:**
- API Keys
- Tokens
- Contraseñas

**Inyectar en la VM vía:**
- Archivo `.env.production` (gitignored)
- Variables de entorno del sistema
- Docker secrets (para Swarm)

## ✅ Checklist

- [ ] Crear `docker-compose.prod.yml`
- [ ] Actualizar `.env.production.example`
- [ ] Verificar `.gitignore`
- [ ] Actualizar rutas en docker-compose.prod.yml:
  - [ ] `mysql:3306` (en lugar de localhost)
  - [ ] `openclaw-app:5000` (en lugar de localhost)
  - [ ] `ollama:11434` (en lugar de localhost)
- [ ] Crear GitHub Actions workflow
- [ ] Documentar en README.md

