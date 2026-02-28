#!/bin/sh

echo "Waiting for Postgres to be ready..."
# Esperar a que Postgres esté disponible (el healthcheck de docker-compose ayuda, pero esto es más robusto)
until nc -z postgres 5432; do
  sleep 1
done

echo "Postgres is up - executing migrations..."
# Forzar la sincronización del esquema de Drizzle con la base de datos
pnpm run db:push

echo "Starting API server..."
exec pnpm run dev
