import asyncio
import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_BASE_URL = "https://graph.facebook.com/v19.0"
_MAX_RETRIES = 3
_RETRY_BASE_DELAY = 1.0  # segundos


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.whatsapp_token}",
        "Content-Type": "application/json",
    }


async def send_message(phone: str, text: str) -> dict:
    """
    Envia mensagem de texto para um número via WhatsApp Cloud API.
    Realiza retry com backoff exponencial em caso de rate limit (HTTP 429).
    """
    url = f"{_BASE_URL}/{settings.whatsapp_phone_id}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "text",
        "text": {"body": text},
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                response = await client.post(url, json=payload, headers=_headers())

                if response.status_code == 429:
                    wait = _RETRY_BASE_DELAY * (2 ** (attempt - 1))
                    logger.warning(
                        "Rate limit atingido ao enviar para %s. Aguardando %.1fs (tentativa %d/%d)",
                        phone, wait, attempt, _MAX_RETRIES,
                    )
                    await asyncio.sleep(wait)
                    continue

                response.raise_for_status()
                data = response.json()
                logger.info("Mensagem enviada para %s — id: %s", phone, data.get("messages", [{}])[0].get("id"))
                return data

            except httpx.HTTPStatusError as exc:
                logger.error(
                    "Erro HTTP ao enviar mensagem para %s: %s — %s",
                    phone, exc.response.status_code, exc.response.text,
                )
                raise
            except httpx.RequestError as exc:
                logger.error("Erro de conexão ao enviar mensagem para %s: %s", phone, exc)
                if attempt == _MAX_RETRIES:
                    raise
                await asyncio.sleep(_RETRY_BASE_DELAY * (2 ** (attempt - 1)))

    raise RuntimeError(f"Falha ao enviar mensagem para {phone} após {_MAX_RETRIES} tentativas")


async def send_template(
    phone: str,
    template_name: str,
    language: str = "pt_BR",
) -> dict:
    """
    Envia uma mensagem usando template aprovado pela Meta.
    """
    url = f"{_BASE_URL}/{settings.whatsapp_phone_id}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": language},
        },
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                response = await client.post(url, json=payload, headers=_headers())

                if response.status_code == 429:
                    wait = _RETRY_BASE_DELAY * (2 ** (attempt - 1))
                    logger.warning(
                        "Rate limit ao enviar template '%s' para %s. Aguardando %.1fs (tentativa %d/%d)",
                        template_name, phone, wait, attempt, _MAX_RETRIES,
                    )
                    await asyncio.sleep(wait)
                    continue

                response.raise_for_status()
                data = response.json()
                logger.info(
                    "Template '%s' enviado para %s — id: %s",
                    template_name, phone, data.get("messages", [{}])[0].get("id"),
                )
                return data

            except httpx.HTTPStatusError as exc:
                logger.error(
                    "Erro HTTP ao enviar template '%s' para %s: %s — %s",
                    template_name, phone, exc.response.status_code, exc.response.text,
                )
                raise
            except httpx.RequestError as exc:
                logger.error(
                    "Erro de conexão ao enviar template '%s' para %s: %s",
                    template_name, phone, exc,
                )
                if attempt == _MAX_RETRIES:
                    raise
                await asyncio.sleep(_RETRY_BASE_DELAY * (2 ** (attempt - 1)))

    raise RuntimeError(
        f"Falha ao enviar template '{template_name}' para {phone} após {_MAX_RETRIES} tentativas"
    )
