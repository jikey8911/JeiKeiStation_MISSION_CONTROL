#!/bin/bash
# =============================================================================
# ENTRYPOINT: AGENTE OPENCLAW CON SSH Y API
# =============================================================================

# 1. Configurar contraseña de root si se provee
if [ ! -z "$ROOT_PASSWORD" ]; then
    echo "root:$ROOT_PASSWORD" | chpasswd
else
    echo "root:openclaw" | chpasswd
    echo "WARNING: No ROOT_PASSWORD provided, using default: openclaw"
fi

# 2. Iniciar el servicio SSH
echo "Starting SSH server..."
service ssh start

# 3. Iniciar el Heartbeat en segundo plano
echo "Starting OpenClaw Heartbeat..."
python openclaw/skills/jeikei_mission_control/heartbeat.py &

# 4. Iniciar el servidor FastAPI (Inferencia)
echo "Starting OpenClaw API Server (Uvicorn)..."
exec uvicorn server.agent_backend.main:app --host 0.0.0.0 --port 8000
