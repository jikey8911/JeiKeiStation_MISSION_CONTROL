FROM node:20-alpine

# Instalar dependencias necesarias para construir algunos paquetes de node si fuera necesario
RUN apk add --no-cache libc6-compat python3 make g++ netcat-openbsd

WORKDIR /app

# Instalar pnpm con la versión especificada en el package.json
RUN npm install -g pnpm@10.30.1

# Copiar archivos de definición de dependencias
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar el resto del código
COPY . .

# Exponer los puertos posibles
EXPOSE 3000
EXPOSE 3001

# Variables de entorno por defecto
ENV NODE_ENV=development
ENV PORT=3000

# El comando por defecto se sobreescribe en docker-compose.yml
CMD ["pnpm", "run", "dev"]
