# =============================================================================
# JEIKEI STATION - DOCKERFILE PRODUCCIÓN (OPTIMIZADO PARA RENDER)
# =============================================================================
FROM node:20-alpine AS builder

# Instalar dependencias necesarias para construcción
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Configurar pnpm
RUN npm install -g pnpm@10.30.1

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Instalar dependencias de construcción
RUN pnpm install --frozen-lockfile

# Copiar el resto del código y construir
COPY . .
RUN pnpm run build

# --- ESTADIO DE PRODUCCIÓN ---
FROM node:20-alpine AS runner

WORKDIR /app

# Configurar variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Instalamos solo pnpm y netcat para el entrypoint
RUN npm install -g pnpm@10.30.1 && apk add --no-cache netcat-openbsd

# Copiar solo los artefactos necesarios desde el builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/tsconfig.json ./drizzle.config.ts ./

# Instalar solo dependencias de producción
RUN pnpm install --prod --frozen-lockfile

# Exponer el puerto de producción
EXPOSE 3000

# Entrypoint para manejar migraciones y arranque
RUN chmod +x scripts/entrypoint.sh
CMD ["./scripts/entrypoint.sh"]
