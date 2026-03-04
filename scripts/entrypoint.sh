#!/bin/sh

echo "Waiting for MySQL to be ready..."
# Esperar a que MySQL esté disponible (el healthcheck de docker-compose ayuda, pero esto es más robusto)
until nc -z mysql 3306; do
  sleep 1
done

echo "MySQL is up - executing migrations..."
# Forzar la sincronización del esquema de Drizzle con la base de datos
pnpm run db:push

echo "Starting API server..."
exec pnpm run dev
