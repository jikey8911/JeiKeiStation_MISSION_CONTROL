# JeiKei Station - Docker Deployment

Repositorio centralizado para despliegue automatizado de JeiKei Mission Control en Oracle Cloud.

## 📋 Contenido

- **docker-compose.prod.yml** - Configuración de producción con todos los servicios
- **.env.production.example** - Plantilla de variables de entorno
- **ENV_STRATEGY.md** - Documentación de la estrategia de configuración
- **.github/workflows/** - Automatización CI/CD

## 🚀 Servicios Incluidos

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **MySQL** | 3306 | Base de datos |
| **Redis** | 6379 | Cache y sesiones |
| **Ollama** | 11434 | Motor LLM (Llama 3.2) |
| **OpenClaw** | 5000 | Agente IA |
| **Backend API** | 3001 | Node.js tRPC |
| **Frontend** | 3005 | React + Vite |

## 📦 Despliegue Manual

### Requisitos
- Docker & Docker Compose
- Git
- Acceso a Oracle Cloud VM

### Pasos

1. **Clonar este repositorio**
```bash
git clone https://github.com/jikey8911/JeiKeiStattion_DokerDep.git
cd JeiKeiStattion_DokerDep
```

2. **Crear archivo .env.production**
```bash
cp .env.production.example .env.production
# Editar y completar con valores reales
nano .env.production
```

3. **Desplegar servicios**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

4. **Verificar estado**
```bash
docker-compose -f docker-compose.prod.yml ps
```

## 🔄 CI/CD Automático

El repositorio incluye GitHub Actions que:

1. **Detecta cambios** en la rama `main` del repositorio principal
2. **Construye imágenes Docker** para cada servicio
3. **Push a Docker Registry**
4. **Despliega automáticamente** en Oracle Cloud

### Configuración requerida

En GitHub Settings → Secrets, agregar:

```
ORACLE_CLOUD_HOST=147.224.220.58
ORACLE_CLOUD_USER=ubuntu
ORACLE_CLOUD_SSH_KEY=<contenido de ~/.ssh/jeikei_oracle>
DOCKER_REGISTRY_USERNAME=<tu usuario>
DOCKER_REGISTRY_PASSWORD=<tu token>
```

## 📝 Variables de Entorno

Ver `.env.production.example` para la lista completa de variables.

**Importante:** 
- NUNCA commitear `.env.production` al repositorio
- Usar `.env.production.example` como referencia
- Inyectar valores reales en la VM de producción

## 🔐 Seguridad

- ✅ Secrets no están en el repositorio
- ✅ SSH key-based authentication
- ✅ Variables de entorno inyectadas en tiempo de despliegue
- ✅ Redes Docker aisladas

## 📚 Documentación

- **ENV_STRATEGY.md** - Estrategia de configuración de entornos
- **docker-compose.prod.yml** - Configuración completa de servicios

## 🆘 Troubleshooting

### Los servicios no inician
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Verificar conectividad entre servicios
```bash
docker exec jeikei_api_server curl http://openclaw-app:5000/health
```

### Limpiar y reiniciar
```bash
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
```

## 📞 Contacto

Para preguntas o problemas, contactar al equipo de desarrollo.

---

**Última actualización:** Marzo 2026
**Versión:** 1.0.0
