import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "EndoBone-AI Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # ── Authentication Security ───────────────────────────────────────────────
    # JWT_SECRET: default production key if not overridden by .env
    JWT_SECRET: str = "endobone-ai-production-secret-jwt-key-2026"

    # Server configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False

    # Database
    MONGODB_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "bone_health"

    # Google Gemini AI
    GEMINI_API_KEY: str = ""

    # 3D Storage
    STORAGE_DIR: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "storage", "bones",
    )

    # CORS — restrict to known origins; extend via CORS_ORIGINS env var
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://endobone.vercel.app",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="allow",
    )


settings = Settings()
