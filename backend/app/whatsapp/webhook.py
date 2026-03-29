import logging

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, Request
from fastapi.responses import PlainTextResponse

from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhook", tags=["webhook"])


# ---------------------------------------------------------------------------
# GET /webhook — verificação do webhook pela Meta
# ---------------------------------------------------------------------------
@router.get("", response_class=PlainTextResponse)
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    if hub_mode == "subscribe" and hub_verify_token == settings.whatsapp_verify_token:
        logger.info("Webhook verificado com sucesso pela Meta")
        return hub_challenge

    logger.warning("Falha na verificação do webhook — token inválido")
    raise HTTPException(status_code=403, detail="Token de verificação inválido")


# ---------------------------------------------------------------------------
# POST /webhook — receber mensagens do WhatsApp
# ---------------------------------------------------------------------------
@router.post("")
async def receive_message(request: Request, background_tasks: BackgroundTasks):
    """
    Recebe eventos da Meta, extrai mensagens de texto e processa em background.
    Responde 200 imediatamente para evitar reenvios.
    """
    body = await request.json()
    logger.debug("Payload recebido: %s", body)

    try:
        for entry in body.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})

                # Ignorar eventos sem mensagens (status de entrega, read receipts, etc.)
                if "messages" not in value:
                    continue

                for message in value["messages"]:
                    if message.get("type") != "text":
                        logger.debug(
                            "Mensagem não-texto ignorada (tipo: %s)", message.get("type")
                        )
                        continue

                    phone = message["from"]
                    text = message["text"]["body"]
                    message_id = message["id"]

                    logger.info("Mensagem recebida de %s: %s", phone, text)

                    background_tasks.add_task(
                        _process_message,
                        phone=phone,
                        text=text,
                        whatsapp_message_id=message_id,
                    )

    except Exception as exc:
        logger.exception("Erro ao processar payload do webhook: %s", exc)

    # Sempre retorna 200 para a Meta não reenviar o evento
    return {"status": "ok"}


async def _process_message(phone: str, text: str, whatsapp_message_id: str) -> None:
    """
    Delega para o orquestrador (lead_manager) — implementado na Fase 5.
    """
    try:
        from app.services.lead_manager import handle_incoming_message
        await handle_incoming_message(
            phone=phone,
            text=text,
            whatsapp_message_id=whatsapp_message_id,
        )
    except ImportError:
        logger.warning(
            "lead_manager ainda não implementado — mensagem de %s descartada", phone
        )
    except Exception as exc:
        logger.exception("Erro ao processar mensagem de %s: %s", phone, exc)
