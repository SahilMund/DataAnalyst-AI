from fastapi import HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import select, update, delete
from app.api.db.tasks import Tasks
from app.api.validators.task_validator import TaskCreate, TaskUpdate
from app.config.db_config import DB
from app.utils.response_utils import create_response
from app.config.logging_config import get_logger

logger = get_logger(__name__)


async def get_user_tasks(user_id: int, db: DB):
    try:
        with db.session() as session:
            query = select(Tasks).where(Tasks.user_id == user_id).order_by(Tasks.created_at.desc())
            result = session.execute(query).scalars().all()
            
            # Manual serialization for simplicity
            tasks_list = []
            for t in result:
                tasks_list.append({
                    "id": t.id,
                    "title": t.title,
                    "description": t.description,
                    "status": t.status,
                    "priority": t.priority,
                    "data_source_id": t.data_source_id,
                    "created_at": t.created_at.isoformat() if t.created_at else None
                })
                
            return JSONResponse(status_code=200, content=create_response(
                status_code=200,
                message="Tasks retrieved successfully",
                data={"tasks": tasks_list}
            ))
    except Exception as e:
        logger.error(f"Error getting tasks: {str(e)}")
        return JSONResponse(status_code=500, content=create_response(status_code=500, message="Failed to retrieve tasks", data={"error": str(e)}))


async def create_task(user_id: int, body: TaskCreate, db: DB):
    try:
        with db.session() as session:
            new_task = Tasks(
                user_id=user_id,
                title=body.title,
                description=body.description,
                status=body.status,
                priority=body.priority,
                data_source_id=body.data_source_id
            )
            session.add(new_task)
            session.commit()
            session.refresh(new_task)
            
            return JSONResponse(status_code=201, content=create_response(
                status_code=201,
                message="Task created successfully",
                data={"task_id": new_task.id}
            ))
    except Exception as e:
        logger.error(f"Error creating task: {str(e)}")
        return JSONResponse(status_code=500, content=create_response(status_code=500, message="Failed to create task", data={"error": str(e)}))


async def update_task(user_id: int, task_id: int, body: TaskUpdate, db: DB):
    try:
        with db.session() as session:
            # check ownership
            task = session.execute(select(Tasks).where(Tasks.id == task_id, Tasks.user_id == user_id)).scalar_one_or_none()
            if not task:
                return JSONResponse(status_code=404, content=create_response(status_code=404, message="Task not found", data={}))
            
            update_data = body.dict(exclude_unset=True)
            if update_data:
                session.execute(update(Tasks).where(Tasks.id == task_id).values(**update_data))
                session.commit()
            
            return JSONResponse(status_code=200, content=create_response(
                status_code=200,
                message="Task updated successfully",
                data={}
            ))
    except Exception as e:
        logger.error(f"Error updating task: {str(e)}")
        return JSONResponse(status_code=500, content=create_response(status_code=500, message="Failed to update task", data={"error": str(e)}))


async def delete_task(user_id: int, task_id: int, db: DB):
    try:
        with db.session() as session:
            task = session.execute(select(Tasks).where(Tasks.id == task_id, Tasks.user_id == user_id)).scalar_one_or_none()
            if not task:
                return JSONResponse(status_code=404, content=create_response(status_code=404, message="Task not found", data={}))
            
            session.execute(delete(Tasks).where(Tasks.id == task_id))
            session.commit()
            
            return JSONResponse(status_code=200, content=create_response(
                status_code=200,
                message="Task deleted successfully",
                data={}
            ))
    except Exception as e:
        logger.error(f"Error deleting task: {str(e)}")
        return JSONResponse(status_code=500, content=create_response(status_code=500, message="Failed to delete task", data={"error": str(e)}))
