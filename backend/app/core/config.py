from pathlib import Path

from pydantic_settings import BaseSettings
from typing import Optional

# .env is in the backend root; load it even when running from backend/app
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
_ENV_FILE = str(_BACKEND_ROOT / ".env")


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    model_config = {"env_file": _ENV_FILE, "extra": "ignore"}


settings = Settings()