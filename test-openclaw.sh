#!/bin/bash

# Script para probar OpenClaw y medir tiempo de respuesta del primer mensaje

set -e

OPENCLAW_URL="http://localhost:5000"
TIMEOUT=60
START_TIME=$(date +%s%N)

echo "⏱️  Iniciando prueba de OpenClaw..."
echo "📡 URL: $OPENCLAW_URL"
echo "⏳ Esperando que OpenClaw esté listo..."

# Esperar a que OpenClaw esté disponible
for i in {1..30}; do
    if curl -s "$OPENCLAW_URL/health" > /dev/null 2>&1; then
        echo "✅ OpenClaw está listo!"
        break
    fi
    echo "⏳ Intento $i/30..."
    sleep 2
done

# Enviar mensaje de prueba
echo ""
echo "📤 Enviando mensaje de prueba..."

RESPONSE=$(curl -s -X POST "$OPENCLAW_URL/api/chat" \
    -H "Content-Type: application/json" \
    -d '{
        "message": "Hola, ¿cuál es tu nombre y qué puedes hacer?",
        "agent_id": "user-assistant",
        "session_id": "test-session-'$(date +%s)'"
    }' \
    --max-time $TIMEOUT)

END_TIME=$(date +%s%N)
ELAPSED_MS=$(( (END_TIME - START_TIME) / 1000000 ))

echo ""
echo "✅ Respuesta recibida:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⏱️  TIEMPO DE RESPUESTA: ${ELAPSED_MS}ms (${ELAPSED_MS}ms)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ELAPSED_MS -lt 5000 ]; then
    echo "⚡ Respuesta RÁPIDA - Excelente rendimiento"
elif [ $ELAPSED_MS -lt 15000 ]; then
    echo "✅ Respuesta NORMAL - Rendimiento aceptable"
elif [ $ELAPSED_MS -lt 30000 ]; then
    echo "⚠️  Respuesta LENTA - Considera optimizar"
else
    echo "❌ Respuesta MUY LENTA - Problemas de rendimiento"
fi
