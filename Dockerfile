# Dockerfile - Optimizado para desarrollo con Docker Compose
FROM node:20-alpine

# Instalar dependencias necesarias para construir algunos paquetes de node si fuera necesario
RUN apk add --no-cache libc6-compat python3 make g++ netcat-openbsd

# Establecer directorio de trabajo
WORKDIR /app

RUN corepack enable pnpm && corepack prepare pnpm@10.30.3 --activate

# Copiar archivos de definición de dependencias
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Instalar dependencias (incluyendo devDependencies para tsx, drizzle, vite)
RUN pnpm install --prod=false

# Copiar el resto del código del proyecto
COPY . .

RUN chmod +x /app/scripts/entrypoint.sh

# Exponer los puertos posibles
EXPOSE 3000
EXPOSE 3001

# Variables de entorno por defecto
ENV NODE_ENV=development
ENV PORT=3001

# El comando por defecto se sobreescribe en docker-compose.yml
CMD pnpm run dev:frontend
