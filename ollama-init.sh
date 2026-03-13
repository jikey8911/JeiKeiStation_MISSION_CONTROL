#!/bin/sh
set -e

# Iniciar ollama en background
echo "[*] Iniciando Ollama..."
ollama serve &
OLLAMA_PID=$!

# Esperar a que Ollama esté listo
echo "[*] Esperando a que Ollama esté disponible..."
sleep 5
for i in {1..30}; do
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "[✓] Ollama está listo"
        break
    fi
    echo "[*] Intento $i/30..."
    sleep 2
done

# Verificar si el modelo ya está descargado
echo "[*] Verificando modelos disponibles..."
if curl -s http://localhost:11434/api/tags | grep -q "llama3.2"; then
    echo "[✓] Modelo llama3.2 ya está descargado"
else
    echo "[*] Descargando modelo llama3.2:latest (primera vez)..."
    echo "[*] Esto puede tomar varios minutos..."
    ollama pull llama3.2:latest
    echo "[✓] Modelo descargado correctamente"
fi

# Mantener el proceso de ollama en primer plano
echo "[✓] OpenClaw Ollama listo y disponible en :11434"
wait $OLLAMA_PID
