import os
import re
import requests
import time
from colorama import init, Fore, Style

from .devops_agent import DevOpsAgent

# Inicializar colorama para que funcione en todas las terminales
init(autoreset=True)

# El token del agente ahora se lee desde una variable de entorno
# Este token es el JWT que el usuario obtiene del frontend de JeiKeiStation
AGENT_TOKEN = os.environ.get("JEIKEI_AGENT_TOKEN")
BACKEND_URL = os.environ.get("JEIKEI_BACKEND_URL", "http://127.0.0.1:8000")

def find_file_in_repo(filename: str, repo_path: str):
    """
    Busca un archivo de forma recursiva en el repositorio.
    """
    print(f"{Fore.CYAN}[INFO] Buscando archivo '{filename}' en el repositorio...{Style.RESET_ALL}")
    for root, _, files in os.walk(repo_path):
        if filename in files:
            if '.git' in root.split(os.sep):
                continue
            
            full_path = os.path.join(root, filename)
            relative_path = os.path.relpath(full_path, repo_path)
            print(f"{Fore.GREEN}[SUCCESS] Archivo encontrado en: {relative_path}{Style.RESET_ALL}")
            return relative_path
    print(f"{Fore.YELLOW}[WARN] Archivo '{filename}' no encontrado.{Style.RESET_ALL}")
    return None

def call_llm_real(prompt: str, context: str, file_path: str):
    """
    Función REAL que llama al endpoint de inferencia del backend de JeiKeiStation.
    """
    if not AGENT_TOKEN:
        print(f"{Fore.RED}[ERROR] La variable de entorno 'JEIKEI_AGENT_TOKEN' no está configurada.{Style.RESET_ALL}")
        return None

    print(f"\n{Fore.CYAN}--- Contactando al Backend de JeiKeiStation ---{Style.RESET_ALL}")
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/agent/infer",
            headers={"token": AGENT_TOKEN},
            json={"prompt": prompt, "context": context}
        )
        response.raise_for_status() # Lanza un error para códigos 4xx/5xx
        
        data = response.json()
        print(f"{Fore.GREEN}--- Respuesta de IA recibida ---{Style.RESET_ALL}\n")
        
        return {
            "file_path": file_path,
            "new_content": data["new_content"],
            "commit_message": f"feat: Optimiza {os.path.basename(file_path)} con IA",
            "pr_title": f"✨ Optimización automática de {os.path.basename(file_path)}",
            "pr_body": f"Este Pull Request fue generado automáticamente por el agente DevOps de OpenClaw.\n\n**Cambios propuestos:**\n- Se ha refactorizado el archivo `{file_path}` para mejorar su rendimiento y legibilidad."
        }
    except requests.exceptions.RequestException as e:
        print(f"{Fore.RED}[ERROR] No se pudo contactar al backend: {e}{Style.RESET_ALL}")
        return None

def main_loop():
    """Bucle principal de la consola interactiva."""
    print(f"{Fore.YELLOW}--- Asistente 'QA & DevOps Optimizer' de OpenClaw ---{Style.RESET_ALL}")
    print("Escribe tu petición (ej. 'Optimiza el archivo TaskBoard.tsx') o 'salir' para terminar.")
    
    try:
        agent = DevOpsAgent()
    except Exception:
        print(f"{Fore.RED}No se pudo inicializar el agente. Asegúrate de estar en un repositorio Git.{Style.RESET_ALL}")
        return

    while True:
        try:
            user_input = input(f"{Style.BRIGHT}{Fore.GREEN}DevOps > {Style.RESET_ALL}").strip()

            if user_input.lower() in ["salir", "exit", "quit"]:
                print(f"{Fore.YELLOW}Cerrando el asistente. ¡Hasta luego!{Style.RESET_ALL}")
                break
            
            if not user_input:
                continue

            # 1. Búsqueda de Contexto (extracción de nombre de archivo)
            filename_match = re.search(r"['\"]?([\w.-]+\.[\w]+)['\"]?", user_input)
            if not filename_match:
                print(f"{Fore.YELLOW}[WARN] No pude identificar un nombre de archivo en tu petición. Intenta de nuevo, ej: 'Refactoriza \"main.py\"'.{Style.RESET_ALL}")
                continue
            
            filename = filename_match.group(1)
            relative_path = find_file_in_repo(filename, agent.repo_path)

            if not relative_path:
                continue

            # 2. Lectura de contenido
            full_path = os.path.join(agent.repo_path, relative_path)
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    file_content = f.read()
            except Exception as e:
                print(f"{Fore.RED}[ERROR] No se pudo leer el archivo '{relative_path}': {e}{Style.RESET_ALL}")
                continue

            # 3. Llamada REAL al LLM a través del Backend
            llm_response = call_llm_real(user_input, file_content, relative_path)
            
            if not llm_response:
                continue

            # 4. Ejecución de la automatización
            branch_name = f"feature/ai-optim-{os.path.basename(llm_response['file_path']).split('.')[0]}"
            
            if not agent.create_branch(branch_name):
                continue
            
            if not agent.apply_changes(llm_response['file_path'], llm_response['new_content']):
                continue

            if not agent.commit_and_push(llm_response['commit_message']):
                continue

            agent.open_pull_request(
                title=llm_response['pr_title'],
                body=llm_response['pr_body']
            )

        except KeyboardInterrupt:
            print(f"\n{Fore.YELLOW}Operación cancelada por el usuario.{Style.RESET_ALL}")
        except Exception as e:
            print(f"{Fore.RED}[FATAL] Ocurrió un error inesperado: {e}{Style.RESET_ALL}")

if __name__ == "__main__":
    main_loop()
