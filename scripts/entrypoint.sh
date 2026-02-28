#!/bin/sh

# =============================================================================
# JEIKEI STATION - ENTRYPOINT (PRODUCCIÓN & DESARROLLO)
# =============================================================================

# 1. Esperar a que Postgres esté disponible si estamos en Docker
if [ -n "$POSTGRES_HOST" ]; then
  echo "Waiting for Postgres to be ready at $POSTGRES_HOST:5432..."
  until nc -z $POSTGRES_HOST 5432; do
    sleep 1
  done
  echo "Postgres is up!"
fi

# 2. Ejecutar migraciones de base de datos antes de arrancar
echo "Executing Drizzle schema synchronization..."
# 'pnpm run db:push' es ideal para este tipo de despliegues ágiles
pnpm run db:push

# 3. Arrancar servidor según el entorno
if [ "$NODE_ENV" = "production" ]; then
  echo "Starting JEIKEI STATION in PRODUCTION mode..."
  # 'pnpm run start' arranca el bundle generado en dist/index.js
  exec pnpm run start
else
  echo "Starting JEIKEI STATION in DEVELOPMENT mode..."
  # 'pnpm run dev' arranca el servidor con tsx watch
  exec pnpm run dev
fi
