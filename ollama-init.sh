#!/bin/bash
# ollama-init.sh - Script para inicializar Ollama y descargar modelos

# Iniciar Ollama en segundo plano
ollama serve &
# Esperar a que Ollama esté listo
echo "Esperando a que Ollama se inicie..."
until curl -s http://localhost:11434/api/tags > /dev/null; do
  sleep 2
done

echo "Ollama está listo. Descargando modelo llama3.2:3b..."
ollama pull llama3.2:3b

# Mantener el proceso en primer plano para que el contenedor no se cierre
wait
