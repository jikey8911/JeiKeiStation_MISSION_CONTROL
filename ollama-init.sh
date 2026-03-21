#!/bin/bash
# ollama-init.sh - Script para inicializar Ollama y descargar modelos

# Iniciar Ollama en segundo plano
ollama serve &

# Esperar a que Ollama esté listo (usando bash para evitar dependencia de curl)
echo "Esperando a que Ollama se inicie en el puerto 11434..."
while ! (echo > /dev/tcp/localhost/11434) >/dev/null 2>&1; do
  sleep 2
done

echo "Ollama está listo. Descargando modelo llama3.2:3b..."
ollama pull llama3.2:3b

# Mantener el proceso en primer plano para que el contenedor no se cierre
echo "Modelo descargado. Manteniendo proceso activo..."
wait
