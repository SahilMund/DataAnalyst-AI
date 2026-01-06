from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from app.api import api_router
from app.api.middleware.auth_middleware import AuthMiddleware
from app.api.db.models import init_db
from app.dependencies.database import get_db
import logging

logger = logging.getLogger(__name__)

app = FastAPI()

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error for {request.url.path}: {exc.errors()}")
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

# Add auth middleware
app.add_middleware(AuthMiddleware)
# CORS setup 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Add your React app's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    init_db()
    db = next(get_db())

# Include API routes
app.include_router(api_router)


@app.get("/")
def read_root():
    return {"message": "Hello, Lumin API is running!"}
