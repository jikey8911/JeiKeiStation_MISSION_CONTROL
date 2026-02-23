# Dockerfile
FROM node:20-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Instalar pnpm (el gestor de paquetes que usas en el proyecto)
RUN npm install -g pnpm

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias
RUN pnpm install

# Copiar el resto del código del proyecto
COPY . .

# Exponer el puerto de desarrollo
EXPOSE 3000

# Iniciar en modo desarrollo (o cambiar a 'start' para producción)
CMD ["pnpm", "run", "dev"]