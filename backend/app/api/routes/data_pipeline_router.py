from fastapi import Depends, APIRouter, UploadFile, Request
from app.api.controllers import data_pipeline_controller
from app.dependencies.database import get_db
from app.config.db_config import DB
from app.api.validators.data_source_validator import (
    AddDataSource, GetSourceTable)

# instance of APIRouter
data_pipeline_router = APIRouter()


@data_pipeline_router.post("/upload-spreadsheet")
async def upload_spreadsheet(request: Request, file: UploadFile, db: DB = Depends(get_db)):
    user_id = request.state.user_id
    return await data_pipeline_controller.upload_spreadsheet(user_id, file, db)


@data_pipeline_router.post("/upload-document")
async def upload_document(request: Request, file: UploadFile, db: DB = Depends(get_db)):
    user_id = request.state.user_id
    return await data_pipeline_controller.upload_document(user_id, file, db)


@data_pipeline_router.post("/add-data-source")
async def add_datasource(request: Request, data: AddDataSource, db: DB = Depends(get_db)):
    user_id = request.state.user_id
    return await data_pipeline_controller.add_datasource(data, user_id, db)


@data_pipeline_router.get("/get-data-sources")
async def get_data_source_list(request: Request, db: DB = Depends(get_db)):
    user_id = request.state.user_id
    return await data_pipeline_controller.get_data_source_list(user_id, db)


@data_pipeline_router.post("/get-source-tables")
async def get_source_tables(source: GetSourceTable):
    return await data_pipeline_controller.get_source_tables(source)


@data_pipeline_router.get("/suggest-questions/{source_id}")
async def suggest_questions(source_id: int, db: DB = Depends(get_db)):
    return await data_pipeline_controller.suggest_questions(source_id, db)


@data_pipeline_router.delete("/delete-data-source/{source_id}")
async def delete_datasource(request: Request, source_id: int, db: DB = Depends(get_db)):
    user_id = request.state.user_id
    return await data_pipeline_controller.delete_datasource(source_id, user_id, db)
