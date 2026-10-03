from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional
import os

# Get absolute path to the backend directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(BASE_DIR, "upay_demo.db")

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # In production, set DATABASE_URL to your Supabase PostgreSQL connection string
    # e.g. postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
    DATABASE_URL: str = f"sqlite:///{DB_PATH}"
    SECRET_KEY: str = "upay-hackathon-secret-key-change-in-prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    GROQ_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None

    DEBUG: bool = True
    ENVIRONMENT: str = "demo"
    APP_NAME: str = "Upay ImpactIQ Platform"

    # CORS: comma-separated list of allowed origins
    # In production set via CORS_ORIGINS env var, e.g.:
    # CORS_ORIGINS=https://your-app.vercel.app,https://upay-impactiq.vercel.app
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def allowed_origins(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
