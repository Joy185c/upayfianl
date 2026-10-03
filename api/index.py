import sys
import os

# Add the root directory and the backend directory to Python path
# so that imports like `from backend.app.main` and `from app.core` work.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from backend.app.main import app  # noqa: F401 - Vercel uses `app` as the ASGI handler

# Ensure all database tables exist on cold start (idempotent)
from backend.app.core.database import Base, engine
from backend.app.models import user, customer, campaign, transaction, experiment, intelligence  # noqa: F401
Base.metadata.create_all(bind=engine)
