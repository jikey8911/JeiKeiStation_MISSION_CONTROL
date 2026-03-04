# JeiKei Station - Mission Control (Correcciones Aplicadas)

Este repositorio ha sido actualizado para resolver los problemas de alineación de tablas, errores de API y configuración de Docker.

## Cambios Principales

1.  **Arquitectura Desacoplada:**
    *   La **API** ahora corre de forma independiente en el puerto `3001`.
    *   El **Frontend (Vite)** corre en el puerto `3000` y actúa como proxy hacia la API.
    *   Esto evita que la compilación de Vite bloquee las peticiones del agente.

2.  **Base de Datos (MySQL):**
    *   Se han normalizado todos los nombres de columnas a `snake_case` en `drizzle/schema.ts`.
    *   Se ha corregido el manejo de campos `json` para que MySQL los procese nativamente.
    *   Se ha añadido un script de `entrypoint.sh` que ejecuta `pnpm run db:push` automáticamente al iniciar la API.

3.  **Agente OpenClaw:**
    *   El `heartbeat.py` ha sido actualizado para conectar con el nuevo puerto de la API (`3001`) y manejar correctamente el formato de tRPC con SuperJSON.

4.  **Autenticación (Clerk):**
    *   Se ha mejorado la robustez del middleware de autenticación para evitar caídas del servidor si el token es inválido o expira.

## Cómo ejecutar el proyecto corregido

1.  Asegúrate de tener tu archivo `.env` actualizado (el que me proporcionaste ya es compatible).
2.  Ejecuta el siguiente comando para reconstruir y levantar los contenedores:
    ```bash
    docker-compose up --build
    ```
3.  La aplicación estará disponible en:
    *   **Frontend:** `http://localhost:3000`
    *   **API:** `http://localhost:3001`
    *   **Agente:** `http://localhost:8000`

## Notas sobre el Esquema
Si ves errores de "columna no encontrada" en el navegador, es posible que necesites borrar el volumen de MySQL para que se cree con el nuevo esquema limpio:
```bash
docker-compose down -v
docker-compose up --build
```
