"""Async-клиент к Dahua RPC2 (логин с MD5-хешем, выборка access-логов)."""

import asyncio
import hashlib
import logging

import httpx

logger = logging.getLogger(__name__)

DEFAULT_RETRY_ATTEMPTS = 3
DEFAULT_RETRY_BACKOFF = 1.0  # секунд: 1, 2, 4 (экспоненциально)


def _md5_upper(s: str) -> str:
    return hashlib.md5(s.encode()).hexdigest().upper()


class DahuaClient:
    """
    Контекстный async-клиент: логинится при входе, разлогинивается при выходе.

        async with DahuaClient(ip, login, password) as dahua:
            records = await dahua.fetch_access_records(start, end)

    Сетевые ошибки автоматически ретраятся с экспоненциальным backoff.
    """

    def __init__(
        self,
        ip: str,
        user: str,
        password: str,
        timeout: float = 30.0,
        retry_attempts: int = DEFAULT_RETRY_ATTEMPTS,
        retry_backoff: float = DEFAULT_RETRY_BACKOFF,
    ):
        self.ip = ip
        self.user = user
        self.password = password
        self.retry_attempts = retry_attempts
        self.retry_backoff = retry_backoff
        self._client = httpx.AsyncClient(timeout=timeout)
        self._session_id: str | None = None
        self._req_id = 1

    async def __aenter__(self):
        await self._login()
        return self

    async def __aexit__(self, *_):
        try:
            await self._rpc("global.logout")
        finally:
            await self._client.aclose()

    @property
    def _login_url(self) -> str:
        return f"http://{self.ip}/RPC2_Login"

    @property
    def _rpc_url(self) -> str:
        return f"http://{self.ip}/RPC2"

    async def _post(self, url: str, payload: dict) -> dict:
        """POST с ретраями при сетевых ошибках. Возвращает JSON-тело."""
        last_exc: Exception | None = None
        for attempt in range(self.retry_attempts):
            try:
                resp = await self._client.post(url, json=payload)
                resp.raise_for_status()
                return resp.json()
            except (httpx.HTTPError, httpx.TimeoutException) as e:
                last_exc = e
                if attempt < self.retry_attempts - 1:
                    wait = self.retry_backoff * (2 ** attempt)
                    logger.warning(
                        "Dahua %s: попытка %d/%d не удалась (%s) — повтор через %.1fс",
                        self.ip, attempt + 1, self.retry_attempts, e, wait,
                    )
                    await asyncio.sleep(wait)
        raise last_exc  # type: ignore[misc]

    async def _login(self) -> None:
        # Шаг 1: получить realm и random
        r = await self._post(self._login_url, {
            "method": "global.login",
            "params": {"userName": self.user, "password": "", "clientType": "Web3.0"},
            "id": 1,
        })
        session_id = r["session"]
        realm = r["params"]["realm"]
        random = r["params"]["random"]

        h1 = _md5_upper(f"{self.user}:{realm}:{self.password}")
        h2 = _md5_upper(f"{self.user}:{random}:{h1}")

        # Шаг 2: с хэшем пароля
        r = await self._post(self._login_url, {
            "method": "global.login",
            "params": {
                "userName": self.user, "password": h2, "clientType": "Web3.0",
                "authorityType": "Default", "passwordType": "Default",
            },
            "session": session_id, "id": 2,
        })
        self._session_id = r["session"]
        self._req_id = 3

    async def _rpc(self, method: str, params: dict | None = None, obj: int | None = None) -> dict:
        payload = {
            "method": method,
            "params": params or {},
            "session": self._session_id,
            "id": self._req_id,
        }
        if obj is not None:
            payload["object"] = obj
        self._req_id += 1
        return await self._post(self._rpc_url, payload)

    async def fetch_access_records(
        self, start_time: str, end_time: str, batch: int = 100
    ) -> list[dict]:
        """Все записи AccessControlCardRec в диапазоне [start_time, end_time]."""
        r = await self._rpc("RecordFinder.factory.create", {"name": "AccessControlCardRec"})
        finder = r["result"]
        try:
            await self._rpc(
                "RecordFinder.startFind",
                {"condition": {"StartTime": start_time, "EndTime": end_time}},
                obj=finder,
            )
            records: list[dict] = []
            while True:
                r = await self._rpc("RecordFinder.doFind", {"count": batch}, obj=finder)
                page = r.get("params", {}).get("records", [])
                if not page:
                    break
                records.extend(page)
                if len(page) < batch:
                    break
            return records
        finally:
            await self._rpc("RecordFinder.destroy", {}, obj=finder)
