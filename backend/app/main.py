from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.routers.search import router as search_router

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="AI Job Aggregator",
    description="Search multiple job boards in parallel using AI web agents",
    version="1.0.0",
)

# CORS configuration - allow frontend to connect
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        frontend_url,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(search_router, prefix="/api", tags=["search"])


@app.get("/")
async def root():
    """Root endpoint - API info."""
    return {
        "name": "AI Job Aggregator API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
