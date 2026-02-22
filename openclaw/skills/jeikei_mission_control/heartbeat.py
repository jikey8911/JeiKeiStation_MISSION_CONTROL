import os
import time
import requests
import json
from jeikei_skill import JeiKeiClient

def run_heartbeat():
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Iniciando Heartbeat de Monitoreo...")
    client = JeiKeiClient()
    
    try:
        # 1. Obtener todas las tareas
        tasks = client.list_tasks()
        
        # 2. Identificar 'Tareas Huérfanas' (sin agente asignado)
        orphan_tasks = [t for t in tasks if t.get('assignedAgentId') is None and t.get('status') != 'done']
        
        if not orphan_tasks:
            print("No se encontraron tareas huérfanas.")
            return

        print(f"Se encontraron {len(orphan_tasks)} tareas huérfanas. Intentando auto-asignación...")
        
        # 3. Llamar a autoAssign para cada tarea huérfana
        for task in orphan_tasks:
            try:
                result = client.auto_assign(task['id'])
                print(f"✓ Tarea '{task['title']}' (ID: {task['id']}) asignada a {result['agentName']}")
            except Exception as e:
                print(f"✗ Error al asignar tarea {task['id']}: {str(e)}")
                
    except Exception as e:
        print(f"Error crítico en el heartbeat: {str(e)}")

if __name__ == "__main__":
    # En una implementación real, esto se ejecutaría mediante un cron real
    # o un loop con sleep si es un proceso daemon.
    run_heartbeat()
