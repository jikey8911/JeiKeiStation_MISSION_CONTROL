import os
import time
import json
import urllib.parse
import requests
from requests.exceptions import ConnectionError

# Obtenemos las variables de entorno inyectadas por Docker
API_URL = os.getenv("JEIKEI_API_URL", "http://jeikei_platform:3000/api/trpc")
API_KEY = os.getenv("SERVICE_API_KEY", "jk_secret_agent_key_2026")

def run_heartbeat():
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Iniciando Heartbeat de Monitoreo...")
    
    # 1. Formato estricto para tRPC (Batching)
    # tRPC requiere que el input esté indexado cuando se usa batch=1
    input_payload = json.dumps({"0": {}}) 
    encoded_input = urllib.parse.quote(input_payload)
    url = f"{API_URL}/tasks.list?batch=1&input={encoded_input}"
    
    # 2. Cabeceras de Autenticación de Máquina a Máquina
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    
    try:
        response = requests.get(url, headers=headers)
        
        # Manejo de error 400 explícito para depuración
        if response.status_code == 400:
            print(f"❌ Error 400 (Bad Request): El servidor rechazó el formato. Detalle: {response.text}")
            return
            
        response.raise_for_status()
        
        # 3. Procesar las tareas
        data = response.json()
        
        # En tRPC batch=1, la respuesta viene en un array
        tasks = data[0].get("result", {}).get("data", [])
        print(f"✅ Conexión exitosa. Tareas encontradas: {len(tasks)}")
        
        # TODO: Aquí inyectaremos el llamado al devops_agent.py cuando haya tareas nuevas
        
    except ConnectionError:
        print("⏳ Esperando a que la plataforma Node.js esté lista (Conexión rechazada por ahora)...")
    except Exception as e:
        print(f"⚠️ Error en el heartbeat: {e}")

if __name__ == "__main__":
    print("🤖 Agente OpenClaw inicializado.")
    print("Esperando 10 segundos para dar tiempo a que Node.js compile la plataforma...")
    time.sleep(10) # Le damos ventaja a Node.js al arrancar los Dockers
    
    while True:
        run_heartbeat()
        time.sleep(15)  # Escanear el tablero cada 15 segundos
