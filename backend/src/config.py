from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "AuthZ Platform"
    DEBUG: bool = False
    API_PREFIX: str = "/api"

    DATABASE_URL: str

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # OAuth settings
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    OAUTH_REDIRECT_URL: str = "http://localhost:3000/auth/callback"

    CORS_ORIGINS: str = '["https://authz-liard.vercel.app","http://localhost:3000","http://localhost:5173"]'

    @property
    def JWT_SECRET(self) -> str:
        """Alias for JWT_SECRET_KEY for compatibility."""
        return self.JWT_SECRET_KEY

    @property
    def ASYNC_DATABASE_URL(self) -> str:
        """Convert database URL to async format for SQLAlchemy."""
        url = self.DATABASE_URL
        # Already async format - return as is
        if url.startswith("postgresql+asyncpg://"):
            return url
        # Render provides postgres:// but SQLAlchemy async needs postgresql+asyncpg://
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+asyncpg://", 1)
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url


settings = Settings()
