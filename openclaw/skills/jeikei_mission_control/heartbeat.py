import os
import time
import json
import urllib.parse
import requests
from requests.exceptions import ConnectionError

# Obtenemos las variables de entorno inyectadas por Docker
# Apuntamos al contenedor jeikei_api en el puerto 3001
API_URL = os.getenv("JEIKEI_API_URL", "http://jeikei_api:3001/api/trpc")
API_KEY = os.getenv("SERVICE_API_KEY", "jk_secret_agent_key_2026")

def run_heartbeat():
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Iniciando Heartbeat de Monitoreo...")
    
    # 1. Formato estricto para tRPC (Batching)
    # Al usar SuperJSON en el backend, el input debe ir envuelto en {"json": ...}
    # tRPC espera un objeto indexado para batch=1
    input_payload = json.dumps({"0": {"json": {}}}) 
    encoded_input = urllib.parse.quote(input_payload)
    url = f"{API_URL}/tasks.list?batch=1&input={encoded_input}"
    
    # 2. Cabeceras de Autenticación de Máquina a Máquina
    headers = {
        "Content-Type": "application/json",
        "x-api-key": API_KEY
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 400:
            print(f"❌ Error 400 (Bad Request): El servidor rechazó el formato. Detalle: {response.text}")
            return
            
        response.raise_for_status()
        
        # 3. Procesar las tareas
        data = response.json()
        
        # En tRPC batch=1, la respuesta viene en un array
        # Estructura: [{"result": {"data": [...]}}]
        if isinstance(data, list) and len(data) > 0:
            tasks = data[0].get("result", {}).get("data", [])
            print(f"✅ Conexión exitosa. Tareas encontradas: {len(tasks)}")
        else:
            print(f"⚠️ Respuesta inesperada de tRPC: {data}")
        
    except ConnectionError:
        print(f"⏳ Esperando a que la API en {API_URL} esté lista...")
    except Exception as e:
        print(f"⚠️ Error en el heartbeat: {e}")

if __name__ == "__main__":
    print("🤖 Agente OpenClaw inicializado.")
    print(f"Conectando a: {API_URL}")
    
    # Espera inicial para asegurar que la API ha arrancado
    time.sleep(5)
    
    while True:
        run_heartbeat()
        time.sleep(15)  # Escanear el tablero cada 15 segundos
