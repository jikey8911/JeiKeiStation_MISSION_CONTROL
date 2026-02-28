import os
import time
import json
import urllib.parse
import requests
import subprocess
from requests.exceptions import ConnectionError

# Configuración desde variables de entorno
API_URL = os.getenv("JEIKEI_API_URL", "http://jeikei_api:3001/api/trpc")
API_KEY = os.getenv("SERVICE_API_KEY", "jk_secret_agent_key_2026")
REPO_URL = "https://github.com/jikey8911/JeiKeiStation_MISSION_CONTROL"
DEV_BRANCH = "devOp"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

class DevOpsAgent:
    def __init__(self):
        self.version = 1
        self.setup_git()

    def setup_git(self):
        """Configura Git con las credenciales necesarias."""
        try:
            subprocess.run(["git", "config", "--global", "user.name", "JeiKei DevOps Agent"], check=True)
            subprocess.run(["git", "config", "--global", "user.email", "devops@jeikeistation.com"], check=True)
            
            # Configurar el remote con el token si está disponible
            if GITHUB_TOKEN:
                authenticated_url = REPO_URL.replace("https://", f"https://x-access-token:{GITHUB_TOKEN}@")
                subprocess.run(["git", "remote", "set-url", "origin", authenticated_url], check=True)
        except Exception as e:
            print(f"⚠️ Error configurando Git: {e}")

    def run_heartbeat(self):
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] DevOps Agent - Escaneando sistema...")
        
        # 1. Consultar tareas para buscar errores o tareas de mantenimiento
        input_payload = json.dumps({"0": {"json": {}}})
        encoded_input = urllib.parse.quote(input_payload)
        url = f"{API_URL}/tasks.list?batch=1&input={encoded_input}"
        
        headers = {
            "Content-Type": "application/json",
            "x-api-key": API_KEY
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=10)

            if response.status_code == 400:
                print(f"❌ Error 400: El servidor rechazó el formato.")
                return

            response.raise_for_status()
            data = response.json()

            if isinstance(data, list) and len(data) > 0:
                tasks = data[0].get("result", {}).get("data", [])
                print(f"✅ Conexión exitosa. Tareas encontradas: {len(tasks)}")

                # Aquí el agente podría ejecutar lógica de detección de errores
                # Por ahora solo monitorea la salud de la API

            else:
                print(f"⚠️ Respuesta inesperada de tRPC: {data}")

        except ConnectionError:
            print(f"⏳ Esperando a que la API en {API_URL} esté lista...")
        except Exception as e:
            print(f"⚠️ Error en el heartbeat: {e}")

    def commit_and_push(self, message, files=["."]):
        """Realiza un commit secuencial y sube los cambios a la rama devOp."""
        if not GITHUB_TOKEN:
            print("🚫 No se puede realizar push: GITHUB_TOKEN no configurado.")
            return

        try:
            # Sincronizar con el remoto antes de operar
            subprocess.run(["git", "fetch", "origin"], check=True)

            # Asegurarse de estar en la rama correcta y actualizada
            checkout_res = subprocess.run(["git", "checkout", DEV_BRANCH], capture_output=True, text=True)
            if checkout_res.returncode != 0:
                subprocess.run(["git", "checkout", "-b", DEV_BRANCH], check=True)
            else:
                subprocess.run(["git", "pull", "origin", DEV_BRANCH], check=True)

            # Añadir archivos
            for f in files:
                subprocess.run(["git", "add", f], check=True)

            # Commit secuencial
            full_message = f"{message} [v{self.version}]"
            result = subprocess.run(["git", "commit", "-m", full_message], capture_output=True, text=True)

            if "nothing to commit" in result.stdout:
                print("ℹ️ Nada que commitear.")
                return

            # Push a la rama devOp
            subprocess.run(["git", "push", "origin", DEV_BRANCH], check=True)
            print(f"🚀 Cambios subidos exitosamente: {full_message}")
            self.version += 1

        except subprocess.CalledProcessError as e:
            print(f"❌ Error en comando Git: {e.cmd} falló con código {e.returncode}")
        except Exception as e:
            print(f"❌ Error inesperado durante el proceso de Git: {e}")

if __name__ == "__main__":
    print("🤖 DevOps Agent inicializado.")
    agent = DevOpsAgent()
    
    # Espera inicial para asegurar arranque de API
    time.sleep(5)
    
    while True:
        agent.run_heartbeat()
        time.sleep(30)
