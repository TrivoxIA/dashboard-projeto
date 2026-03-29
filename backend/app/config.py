from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # WhatsApp
    whatsapp_token: str
    whatsapp_phone_id: str
    whatsapp_verify_token: str

    # Anthropic
    anthropic_api_key: str

    # Supabase
    supabase_url: str
    supabase_key: str

    # App
    app_env: str = "development"
    log_level: str = "INFO"


settings = Settings()
