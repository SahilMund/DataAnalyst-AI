from fastapi import APIRouter, Depends, Request
from app.api.controllers import task_controller
from app.api.validators.task_validator import TaskCreate, TaskUpdate
from app.config.db_config import DB
from app.api.routes.chat_router import get_db

task_router = APIRouter()


@task_router.get("/get-tasks")
async def get_tasks(request: Request, db: DB = Depends(get_db)):
    user_id = request.state.user_id
    return await task_controller.get_user_tasks(user_id, db)


@task_router.post("/create-task")
async def create_task(request: Request, body: TaskCreate, db: DB = Depends(get_db)):
    user_id = request.state.user_id
    return await task_controller.create_task(user_id, body, db)


@task_router.put("/update-task/{task_id}")
async def update_task(request: Request, task_id: int, body: TaskUpdate, db: DB = Depends(get_db)):
    user_id = request.state.user_id
    return await task_controller.update_task(user_id, task_id, body, db)


@task_router.delete("/delete-task/{task_id}")
async def delete_task(request: Request, task_id: int, db: DB = Depends(get_db)):
    user_id = request.state.user_id
    return await task_controller.delete_task(user_id, task_id, db)
