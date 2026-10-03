import os
import shutil
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

IS_VERCEL = os.getenv("VERCEL") == "1" or os.getenv("VERCEL_ENV") is not None
database_url = settings.DATABASE_URL

if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

# On Vercel serverless functions, SQLite DB in current directory is read-only.
# Copy database to /tmp if using SQLite on Vercel.
if IS_VERCEL and database_url.startswith("sqlite"):
    tmp_db_path = "/tmp/upay_demo.db"
    local_db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "upay_demo.db")
    if not os.path.exists(local_db_path):
        local_db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "backend", "upay_demo.db")

    if os.path.exists(local_db_path) and not os.path.exists(tmp_db_path):
        try:
            shutil.copy2(local_db_path, tmp_db_path)
        except Exception:
            pass

    if os.path.exists(tmp_db_path):
        database_url = f"sqlite:///{tmp_db_path}"
    else:
        database_url = "sqlite:///:memory:"

IS_SQLITE = database_url.startswith("sqlite")
IS_POSTGRES = database_url.startswith("postgres")

connect_args = {}
if IS_SQLITE:
    connect_args = {"check_same_thread": False}

engine = create_engine(
    database_url,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_size=5 if IS_POSTGRES else 1,
    max_overflow=10 if IS_POSTGRES else 0,
)

if IS_SQLITE and not database_url.endswith(":memory:"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
        except Exception:
            pass

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        pass
    finally:
        try:
            db.close()
        except Exception:
            pass
