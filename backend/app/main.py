import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.whatsapp.webhook import router as webhook_router
from app.dashboard.router import router as dashboard_router

logging.basicConfig(
    level=settings.log_level,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Agente SDR",
    description="Agente de IA para qualificação de leads via WhatsApp",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(webhook_router)
app.include_router(dashboard_router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "env": settings.app_env}
