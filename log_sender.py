import asyncio
import logging
import os
import threading
import time
from concurrent.futures import ThreadPoolExecutor

from dotenv import load_dotenv
from logcenter_sdk import LogCenterConfig, LogCenterSender

load_dotenv()

logger = logging.getLogger("logcenter")
logger.setLevel(logging.DEBUG)
if not logger.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(logging.Formatter("[%(levelname)s] %(name)s: %(message)s"))
    logger.addHandler(_handler)

config = LogCenterConfig(
    base_url=os.getenv("LOG_API", "").rstrip("/"),
    project_id=os.getenv("LOG_PROJECT_ID", ""),
    api_key=os.getenv("LOG_API_KEY"),
    enabled=bool(os.getenv("LOG_API") and os.getenv("LOG_PROJECT_ID")),
)

sender = LogCenterSender(config)

logger.debug(
    "Config LogCenter carregada: base_url=%r project_id=%r api_key=%r enabled=%r",
    config.base_url, config.project_id, config.api_key, config.enabled,
)

_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="logcenter-send")


async def _post(payload: dict) -> bool:
    try:
        resp = await sender.http.post_log(payload)
    except Exception as exc:
        logger.debug("Erro de conexão ao enviar log ao LogCenter: %r", exc)
        return False

    ok = 200 <= resp.status_code < 300
    if not ok:
        logger.debug("LogCenter respondeu %s ao enviar log: %s", resp.status_code, resp.text)
    return ok


def _send(message: str, level: str, status: str | None, tags: list[str] | None, data: dict | None) -> bool:
    if not config.enabled:
        return False

    payload = sender._build_payload(level, message, status=status, tags=tags, data=data)
    logger.debug("Enviando payload ao LogCenter: %s", payload)
    ok = asyncio.run(_post(payload))
    if not ok:
        sender.spool.append(payload)
        logger.debug("Falha ao enviar log %r ao LogCenter, gravado no spool.", message)
    return ok


def log(message: str, *, level: str = "INFO", status: str | None = None,
        tags: list[str] | None = None, data: dict | None = None) -> bool:
    """Envio imediato: bloqueia até a tentativa de envio terminar (sucesso ou spool)."""
    return _send(message, level, status, tags, data)


def log_async(message: str, *, level: str = "INFO", status: str | None = None,
              tags: list[str] | None = None, data: dict | None = None) -> None:
    """Envio assíncrono: despacha em thread separada, não bloqueia quem chamou."""
    _executor.submit(_send, message, level, status, tags, data)


async def _flush_spool_once() -> dict:
    """Reenvia tudo que está no spool. Só remove do spool o que for enviado
    com sucesso; qualquer item que falhar volta para o arquivo (nada é
    descartado por causa de outro item ter falhado)."""
    queued = sender.spool.stats().queued
    if not queued:
        return {"sent": 0, "failed": 0, "remaining": 0}

    batch, _ = sender.spool.pop_batch(queued)

    sent = 0
    failed = 0
    for payload in batch:
        if await _post(payload):
            sent += 1
        else:
            failed += 1
            sender.spool.append(payload)

    return {"sent": sent, "failed": failed, "remaining": sender.spool.stats().queued}


def _flush_spool_loop() -> None:
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    while True:
        try:
            result = loop.run_until_complete(_flush_spool_once())
            if result["sent"] or result["failed"]:
                logger.debug("Flush do spool: %s", result)
        except Exception:
            logger.debug("Falha ao reenviar spool.", exc_info=True)
        time.sleep(config.flush_interval_s)


_flush_thread_started = False


def start_background_flush() -> None:
    """Inicia a thread de reenvio periódico do spool (idempotente)."""
    global _flush_thread_started
    if _flush_thread_started or not config.enabled:
        return
    _flush_thread_started = True
    threading.Thread(target=_flush_spool_loop, daemon=True, name="logcenter-flush").start()
