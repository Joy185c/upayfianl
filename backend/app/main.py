from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import auth, customer, impactiq, analytics

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for Upay ImpactIQ Hackathon Demo",
    version="1.0.0",
)

# Configure CORS — origins are controlled via CORS_ORIGINS env variable
# For Vercel, set CORS_ORIGINS=https://your-app.vercel.app in Vercel dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # allow all Vercel preview URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(customer.router, prefix="/api")
app.include_router(impactiq.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to Upay ImpactIQ API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
