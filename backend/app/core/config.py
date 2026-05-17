from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel, PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()

# Project Directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent


class ServerConfig(BaseModel):
    app_path: str
    host: str
    port: int
    reload: bool = True



class JwtConfig(BaseModel):
    access_token_secret: str
    refresh_token_secret: str
    access_token_expires_minutes: int
    refresh_token_expires_days: int
    algorithm: str


class DatabaseConfig(BaseModel):
    url: PostgresDsn
    test_url: PostgresDsn | None = None
    echo: bool = False
    echo_pool: bool = False
    pool_size: int = 50
    max_overflow: int = 10

    naming_convention: dict[str, str] = {
        "ix": "ix_%(column_0_label)s",
        "uq": "uq_%(table_name)s_%(column_0_name)s",
        "ck": "ck_%(table_name)s_%(constraint_name)s",
        "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
        "pk": "pk_%(table_name)s",
    }

class CorsConfig(BaseModel):
    origins: list[str] = ["http://localhost:5173"]
    allow_credentials: bool = True
    allow_methods: list[str] = ["*"]
    allow_headers: list[str] = ["*"]


class AppConfig(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        env_nested_delimiter="__",
        env_prefix="APP_CONFIG__",
        extra="ignore",
    )

    server: ServerConfig
    database: DatabaseConfig
    jwt: JwtConfig
    cors: CorsConfig = CorsConfig()


settings = AppConfig()