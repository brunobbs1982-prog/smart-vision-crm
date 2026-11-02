from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "SMART V.I.S.I.O.N. API"
    secret_key: str = "dev-secret-change-in-production-ciamakers"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Google OAuth — preencher com credenciais reais do Google Cloud Console
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/v1/channels/gmail/oauth/callback"
    frontend_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
