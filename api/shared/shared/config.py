"""Application configuration using Pydantic Settings."""
import os
from functools import lru_cache
from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    environment: str = Field(default="development", alias="ENVIRONMENT")
    service_name: str = Field(default="service", alias="SERVICE_NAME")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    debug: bool = Field(default=False, alias="DEBUG")

    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://statuspage:statuspage@localhost:5432/statuspage",
        alias="DATABASE_URL",
    )
    database_pool_size: int = Field(default=20, alias="DATABASE_POOL_SIZE")
    database_max_overflow: int = Field(default=10, alias="DATABASE_MAX_OVERFLOW")
    database_pool_recycle: int = Field(default=3600, alias="DATABASE_POOL_RECYCLE")

    # Redis
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    redis_pool_size: int = Field(default=50, alias="REDIS_POOL_SIZE")

    # JWT
    jwt_secret: str = Field(default="change-me", alias="JWT_SECRET")
    jwt_refresh_secret: str = Field(default="change-me-too", alias="JWT_REFRESH_SECRET")
    jwt_expires_in: int = Field(default=3600, alias="JWT_EXPIRES_IN")
    jwt_refresh_expires_in: int = Field(default=86400, alias="JWT_REFRESH_EXPIRES_IN")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")

    # CORS
    cors_origins: str = Field(default="http://localhost:3000", alias="CORS_ORIGINS")

    # SMTP
    smtp_host: Optional[str] = Field(default=None, alias="SMTP_HOST")
    smtp_port: int = Field(default=587, alias="SMTP_PORT")
    smtp_user: Optional[str] = Field(default=None, alias="SMTP_USER")
    smtp_password: Optional[str] = Field(default=None, alias="SMTP_PASSWORD")
    smtp_from: str = Field(default="noreply@statuspage.local", alias="SMTP_FROM")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str) -> str:
        """Allow comma-separated CORS origins."""
        if isinstance(v, str):
            return v
        return ",".join(v)

    def get_cors_origins(self) -> List[str]:
        """Return CORS origins as a list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
