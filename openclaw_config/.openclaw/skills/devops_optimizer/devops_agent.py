import os
import subprocess
import time

class DevOpsAgent:
    def __init__(self):
        # El directorio base es /app porque así lo montamos en Docker
        self.workspace_dir = "/app"
        self.github_token = os.getenv("GITHUB_TOKEN", "") # Se leerá del archivo .env

    def run_git_command(self, command_list):
        """Ejecuta comandos de git dentro del contenedor de manera segura"""
        try:
            result = subprocess.run(
                command_list, 
                cwd=self.workspace_dir, 
                capture_output=True, 
                text=True, 
                check=True
            )
            return result.stdout.strip()
        except subprocess.CalledProcessError as e:
            # Imprimimos el error pero no detenemos el script abruptamente
            print(f"❌ Error ejecutando Git ({' '.join(command_list)}): {e.stderr.strip()}")
            return None

    def setup_git_auth(self):
        """Configura la identidad del bot y el token de acceso para poder hacer push"""
        if not self.github_token:
            print("⚠️ [DevOps Agent] No se encontró GITHUB_TOKEN en el entorno. Los pushes fallarán.")
            return

        print("🔑 [DevOps Agent] Configurando credenciales e identidad de Git...")
        
        # 1. Configurar identidad del Agente IA para los commits
        self.run_git_command(["git", "config", "user.name", "Agente DevOps IA"])
        self.run_git_command(["git", "config", "user.email", "devops@jeikeistation.ai"])
        
        # 2. Configurar el token en la URL remota de origin
        repo_url = self.run_git_command(["git", "config", "--get", "remote.origin.url"])
        if repo_url and repo_url.startswith("https://"):
            # Limpiamos credenciales previas si existieran
            clean_url = repo_url.split("@")[-1] if "@" in repo_url else repo_url.replace("https://", "")
            # Inyectamos el token en la URL
            auth_url = f"https://oauth2:{self.github_token}@{clean_url}"
            self.run_git_command(["git", "remote", "set-url", "origin", auth_url])
            print("✅ [DevOps Agent] Autenticación configurada en el repositorio remoto.")

    def analyze_and_fix(self, task_id, task_description):
        print(f"\n🛠️ [DevOps Agent] Iniciando operación técnica...")
        print(f"📋 Tarea asignada: [{task_id}] {task_description}")
        
        # Preparar autenticación antes de interactuar con el repositorio remoto
        self.setup_git_auth()
        
        # 1. Usar siempre la misma rama: agdevop
        branch_name = "agdevop"
        print(f"🌿 [DevOps Agent] Asegurando la rama de trabajo: {branch_name}")
        
        # Intentar cambiar a la rama, si falla (no existe), la creamos
        checkout_result = self.run_git_command(["git", "checkout", branch_name])
        if checkout_result is None:
            print(f"🌿 [DevOps Agent] La rama {branch_name} no existe. Creándola...")
            self.run_git_command(["git", "checkout", "-b", branch_name])
        else:
            # Si ya existía, intentamos traer los últimos cambios del remoto para no tener conflictos
            print(f"🔄 [DevOps Agent] Actualizando rama {branch_name} con remoto...")
            self.run_git_command(["git", "pull", "origin", branch_name])
        
        # 2. Fase de Análisis (Aquí conectaremos el LLM)
        print("🧠 [DevOps Agent] Analizando el código fuente en busca del error...")
        time.sleep(2) # Simulando tiempo de lectura de IA
        
        # TODO: Aquí inyectaremos el código donde el LLM de OpenClaw 
        # lee los archivos .ts / .tsx / .py y reescribe el contenido
        print("💻 [DevOps Agent] LLM generó el parche. Aplicando cambios a los archivos...")
        
        # -- SIMULACIÓN DE CAMBIO PARA LA PRUEBA --
        # Escribimos un pequeño log para que Git tenga algo que commitear en esta prueba
        with open(os.path.join(self.workspace_dir, "ai_fix_log.txt"), "a") as f:
            f.write(f"Parche aplicado para la tarea {task_id}: {task_description}\n")
        
        # 3. Fase de Commit y Push
        print("📦 [DevOps Agent] Preparando el commit...")
        self.run_git_command(["git", "add", "."])
        
        # Comprobar si realmente hubo modificaciones en el código
        status = self.run_git_command(["git", "status", "--porcelain"])
        if status: # Si la cadena no está vacía, hay cambios
            self.run_git_command(["git", "commit", "-m", f"DevOps IA: Solución automática para tarea {task_id}"])
            print("🚀 [DevOps Agent] Haciendo Push a GitHub...")
            
            push_result = self.run_git_command(["git", "push", "--set-upstream", "origin", branch_name])
            if push_result is not None:
                print(f"✅ [DevOps Agent] Push exitoso a la rama '{branch_name}'.")
        else:
            print("ℹ️ [DevOps Agent] No se detectaron cambios en el código. No hay nada que commitear.")
        
        print("✅ [DevOps Agent] Operación completada con éxito. Esperando revisión humana (Pull Request).")

# Para probarlo de forma independiente
if __name__ == "__main__":
    agent = DevOpsAgent()
    agent.analyze_and_fix("999", "Arreglar el TRPCClientError en el TaskBoard enviando un objeto vacío al useQuery")