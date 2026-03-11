#!/bin/bash

# Script para limpiar e inicializar el proyecto OpenClaw con Docker

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║        OpenClaw Setup - Docker Compose                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

# Verificar si docker-compose está disponible
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose no está disponible."
    exit 1
fi

echo "✅ Docker detectado"
echo ""

# Construir la imagen
echo "📦 Construyendo imagen Docker..."
docker compose build --no-cache

echo ""
echo "✅ Imagen construida exitosamente"
echo ""

# Crear volúmenes si es necesario
echo "📁 Preparando volúmenes..."
docker compose config --volumes

echo ""
echo "✅ Configuración completada"
echo ""

# Mostrar instrucciones
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              Próximos pasos                              ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Para iniciar OpenClaw, ejecuta:"
echo ""
echo "  docker compose up -d"
echo ""
echo "Para ver los logs:"
echo ""
echo "  docker compose logs -f openclaw"
echo ""
echo "Para acceder a OpenClaw:"
echo ""
echo "  http://localhost:5000"
echo ""
echo "Para detener:"
echo ""
echo "  docker compose down"
echo ""
echo "Para eliminar todo (incluidos volúmenes):"
echo ""
echo "  docker compose down -v"
echo ""
