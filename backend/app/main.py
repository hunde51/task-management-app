from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth
from app.core.database import engine, Base
from app.models.user import User  # noqa: F401 - register model so Base.metadata has tables

app = FastAPI(title="Task Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create DB tables if they don't exist (e.g. first run without migrations)
Base.metadata.create_all(bind=engine)

app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "Task Management API"}
