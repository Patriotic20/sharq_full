"""Async SQLAlchemy engine + session factory. Reads config from environment."""

import os
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)


class DatabaseHelper:
    def __init__(
        self,
        url: str,
        echo: bool = False,
        pool_size: int = 5,
        max_overflow: int = 10,
    ):
        self.engine = create_async_engine(
            url=url,
            echo=echo,
            pool_size=pool_size,
            max_overflow=max_overflow,
            pool_pre_ping=True,
        )
        self.session_factory = async_sessionmaker(
            bind=self.engine,
            autoflush=False,
            autocommit=False,
            expire_on_commit=False,
        )

    async def dispose(self) -> None:
        await self.engine.dispose()

    async def session_dependency(self) -> AsyncGenerator[AsyncSession, None]:
        async with self.session_factory() as session:
            yield session

    def session_context(self):
        return self.session_factory()


def _build_database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if url:
        return url

    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "postgres")
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = os.getenv("POSTGRES_PORT", "5432")
    db = os.getenv("POSTGRES_DB", "postgres")
    return f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{db}"


db_helper = DatabaseHelper(
    url=_build_database_url(),
    echo=os.getenv("DB_ECHO", "false").lower() == "true",
    pool_size=int(os.getenv("DB_POOL_SIZE", "5")),
    max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "10")),
)
