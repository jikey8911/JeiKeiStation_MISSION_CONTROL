import os
import requests
import json
from typing import List, Dict, Any, Optional

class JeiKeiClient:
    def __init__(self):
        self.base_url = os.getenv("BASE_URL", "http://localhost:3000/api/trpc")
        self.api_key = os.getenv("API_KEY", "jk_secret_agent_key_2026")
        self.headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json"
        }

    def _call_trpc(self, procedure: str, params: Optional[Dict] = None, method: str = "GET") -> Any:
        url = f"{self.base_url}/{procedure}"
        
        if method == "GET":
            if params:
                # tRPC espera los parámetros en el query string como JSON stringificado bajo la clave 'input'
                url += f"?batch=1&input={json.dumps({'0': params})}"
            else:
                url += "?batch=1&input={}"
            response = requests.get(url, headers=self.headers)
        else:
            # Mutations en tRPC usan POST
            payload = {"0": params} if params else {"0": {}}
            response = requests.post(url, headers=self.headers, json=payload)

        response.raise_for_status()
        data = response.json()
        
        # tRPC devuelve un array cuando se usa batching (que es el default en muchos clientes)
        if isinstance(data, list) and len(data) > 0:
            return data[0].get("result", {}).get("data")
        return data.get("result", {}).get("data")

    def list_tasks(self, sprint_id: Optional[int] = None) -> List[Dict]:
        return self._call_trpc("tasks.list", {"sprintId": sprint_id} if sprint_id else {})

    def get_agents(self) -> List[Dict]:
        return self._call_trpc("agents.list")

    def update_task_status(self, task_id: int, status: str) -> bool:
        return self._call_trpc("tasks.updateStatus", {"taskId": task_id, "status": status}, method="POST")

    def auto_assign(self, task_id: int) -> Dict:
        """Llamada al endpoint de auto-asignación del servidor"""
        return self._call_trpc("tasks.serviceAutoAssign", {"taskId": task_id}, method="POST")

    def get_blocking_tasks(self, task_id: int) -> List[Dict]:
        return self._call_trpc("dependencies.getBlocking", {"taskId": task_id})

    def analyze_skills_match(self, task_id: int) -> Dict[str, Any]:
        """
        Lógica de 'Razonamiento de Habilidades': 
        Compara las habilidades requeridas de la tarea con los agentes disponibles.
        """
        # 1. Obtener detalles de la tarea
        tasks = self.list_tasks()
        task = next((t for t in tasks if t['id'] == task_id), None)
        if not task:
            return {"error": "Task not found"}

        required_skills = task.get("requiredSkills", [])
        
        # 2. Obtener agentes
        agents = self.get_agents()
        
        # 3. Calcular matching
        matches = []
        for agent in agents:
            agent_skills = agent.get("skills", [])
            # Intersección de habilidades
            matching_skills = list(set(required_skills) & set(agent_skills))
            match_score = len(matching_skills) / len(required_skills) if required_skills else 1.0
            
            matches.append({
                "agent_id": agent["id"],
                "agent_name": agent["name"],
                "score": match_score,
                "matching_skills": matching_skills,
                "workload": agent["currentWorkload"],
                "capacity": agent["maxCapacity"]
            })

        # Ordenar por score descendente y carga de trabajo ascendente
        matches.sort(key=lambda x: (-x["score"], x["workload"]))
        
        return {
            "task_id": task_id,
            "task_title": task["title"],
            "required_skills": required_skills,
            "recommendations": matches
        }

if __name__ == "__main__":
    # Ejemplo de uso
    client = JeiKeiClient()
    print("--- Listado de Tareas ---")
    # print(client.list_tasks())
    
    # print("\n--- Análisis de Habilidades para Tarea 1 ---")
    # print(client.analyze_skills_match(1))
