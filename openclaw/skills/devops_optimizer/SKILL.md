# QA & DevOps Optimizer Skill

Este skill permite al agente OpenClaw actuar como un Ingeniero de DevOps interactivo en la terminal local del desarrollador. Puede leer archivos, sugerir optimizaciones a través de la API de JeiKeiStation y automatizar el flujo de trabajo de Git (ramas, commits, PRs).

## Requisitos

- Python 3.10+
- `GitPython`, `PyGithub`, `colorama`, `requests`
- Token de GitHub (`GITHUB_TOKEN`) con permisos de repo.
- Token de Agente de JeiKeiStation (`JEIKEI_AGENT_TOKEN`).

## Instalación de Dependencias

```bash
pip install GitPython PyGithub colorama requests
```

## Uso

1. Configura las variables de entorno:
   ```bash
   export GITHUB_TOKEN="tu_github_token"
   export JEIKEI_AGENT_TOKEN="tu_jwt_token_de_jeikeistation"
   export JEIKEI_BACKEND_URL="http://127.0.0.1:8000" # Opcional, por defecto localhost
   ```

2. Ejecuta el agente desde la raíz de cualquier repositorio Git:
   ```bash
   python -m openclaw.skills.devops_optimizer.cli_agent
   ```

3. Interactúa con el agente:
   - `DevOps > Optimiza el archivo "TaskBoard.tsx"`
   - `DevOps > Refactoriza "main.py" para mejorar el rendimiento`

## Funcionalidades

- **Búsqueda de Contexto:** Encuentra automáticamente archivos mencionados en las instrucciones.
- **Inferencia de IA:** Se conecta al backend de JeiKeiStation para obtener sugerencias de código.
- **Automatización Git:** Crea ramas, aplica cambios, realiza commits y abre Pull Requests automáticamente.
