import os
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional

from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel
from jose import JWTError, jwt
from openai import OpenAI
from dotenv import load_dotenv

# --- Configuración Inicial ---
load_dotenv()

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "un-secreto-muy-seguro-para-desarrollo")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 semana

# Inicializa el cliente de OpenAI (asegúrate de tener OPENAI_API_KEY en tu .env)
openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

app = FastAPI(
    title="JeiKeiStation Mission Control API",
    description="Backend para gestionar la autenticación y la inferencia de agentes OpenClaw."
)

# --- Modelos de Datos (Pydantic) ---
class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class InferenceRequest(BaseModel):
    prompt: str
    context: str

# --- Lógica de Autenticación y JWT ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@app.post("/auth/login", response_model=Token, tags=["Authentication"])
async def login_for_access_token(form_data: UserLogin):
    """
    Simula el login de un usuario y devuelve un JWT.
    En una app real, aquí verificarías el email y password contra una base de datos.
    """
    # Simulación: cualquier login es válido por ahora
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- Endpoint de Inferencia para el Agente ---
async def get_current_user(token: str = Header(...)):
    """Dependencia para validar el JWT en endpoints protegidos."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

@app.post("/agent/infer", tags=["Agent"])
async def agent_inference(request: InferenceRequest, current_user: str = Depends(get_current_user)):
    """
    Endpoint protegido que el agente DevOps llamará para obtener optimizaciones.
    """
    print(f"[INFO] Inferencia solicitada por el usuario: {current_user}")
    
    system_prompt = """
    Eres un experto programador de Python. Tu tarea es recibir un fragmento de código
    y una instrucción, y devolver una versión optimizada o refactorizada de ese código.
    Responde únicamente con el código completo y mejorado. No añadas explicaciones.
    """
    
    try:
        completion = openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Instrucción: {request.prompt}\n\nCódigo a mejorar:\n```python\n{request.context}\n```"}
            ]
        )
        new_content = completion.choices[0].message.content
        
        # Limpieza básica para asegurar que solo devolvemos código
        if "```" in new_content:
            new_content = new_content.split("```")[1].strip()
            if new_content.startswith("python"):
                 new_content = new_content[6:].strip()

        return {"new_content": new_content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al contactar con la API de OpenAI: {e}")
