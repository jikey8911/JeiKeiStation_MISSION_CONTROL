#!/bin/bash
# ollama-init.sh

echo "Iniciando servidor Ollama en segundo plano..."
ollama serve &
PID=$!

# Le damos 5 segundos de gracia para que el servidor levante completamente
sleep 5

echo "Descargando modelo llama3.2:3b..."
ollama pull llama3.2:3b

echo "¡Modelo descargado y listo! Manteniendo el proceso principal vivo..."
wait $PID