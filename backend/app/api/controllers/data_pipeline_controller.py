from fastapi import UploadFile, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import select, func
from io import BytesIO
import pandas as pd
from app.config.logging_config import get_logger
from app.config.db_config import DB
from app.api.db.data_sources import DataSources
from app.utils.reader_utils import (pdf_to_document, text_to_document)
from app.config.db_config import VectorDB
import uuid
from app.api.validators.data_source_validator import (
    GetSourceTable, AddDataSource)
from app.utils.response_utils import create_response
from app.config.llm_config import LLM
import json

# Set up logging
logger = get_logger(__name__)
vector_db = VectorDB()
 

async def upload_spreadsheet(id: int, file: UploadFile, db: DB) -> JSONResponse:
    buffer = None
    try:
        logger.info(f"Processing file: {file.filename}")
        session = db.create_session()
        # Validate file extension
        if not file.filename.lower().endswith(('.csv', '.xlsx', '.xls')):
            return JSONResponse(status_code=400, content=create_response(
                status_code=400,
                message="Only CSV and Excel files are allowed",
                data={}
            ))

        # Read file contents
        contents = await file.read()
        buffer = BytesIO(contents)

        # Determine file type and read accordingly
        if file.filename.lower().endswith('.csv'):
            df = pd.read_csv(buffer)
        else:
            df = pd.read_excel(buffer)

        # Convert all column names to lowercase and replace spaces with underscores
        df.columns = df.columns.str.lower().str.replace(' ', '_')

        # Generate a unique table name
        base_name = file.filename.rsplit('.', 1)[0].lower()
        table_name = f"{base_name}_{uuid.uuid4().hex[:8]}"

        # Insert data into database
        rows_affected = await db.insert_dataframe(df, table_name)

        # Create DataSources entry
        new_data_source = DataSources(
            name=file.filename,
            type='spreadsheet',
            table_name=table_name,
            user_id=id
        )

        session.add(new_data_source)
        session.commit()
        session.refresh(new_data_source)

        logger.info(f"Successfully processed file. Rows: {rows_affected}")
        return JSONResponse(status_code=201, content=create_response(
            status_code=201,
            message="Data uploaded successfully",
            data={
                "table_name": table_name,
                "rows_processed": rows_affected,
                "data_source_id": new_data_source.id
            }
        ))

    except HTTPException as he:
        return JSONResponse(status_code=500, content=create_response(
            status_code=500,
            message="Something went wrong",
            data={"error": str(he)}
        ))
        
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        return JSONResponse(status_code=500, content=create_response(
            status_code=500,
            message="Database error occurred",
            data={"error": str(e)}
        ))
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return JSONResponse(status_code=500, content=create_response(
            status_code=500,
            message="An unexpected error occurred",
            data={"error": str(e)}
        ))


    finally:
        if buffer:
            buffer.close()
        logger.info("Upload process completed")


async def upload_document(id: int, file: UploadFile, db: DB) -> JSONResponse:
    buffer = None
    try:
        logger.info(f"Processing file: {file.filename}")
        session = db.create_session()
        vector_db.initialize_embedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
        # Validate file extension
        if not file.filename.lower().endswith(('.pdf', '.doc', '.txt')):
            return JSONResponse(status_code=400, content=create_response(
                status_code=400,
                message="Only Pdf, Doc and text files are allowed",
                data={}
            ))
        # Generate a unique table name
        base_name = file.filename.rsplit('.', 1)[0].lower()
        table_name = f"{base_name}_{uuid.uuid4().hex[:8]}"

        # Read file contents
        contents = await file.read()
        buffer = BytesIO(contents)

        if file.filename.lower().endswith((".pdf")):
            documents = pdf_to_document(buffer, table_name)
        elif file.filename.lower().endswith(('.doc', '.txt')):
            documents = text_to_document(buffer, table_name)

        print(documents)
        await vector_db.insert_data(documents, table_name)
        # Create DataSources entry
        new_data_source = DataSources(
            name=file.filename,
            type='document',
            table_name=table_name,
            user_id=id
        )

        session.add(new_data_source)
        session.commit()
        session.refresh(new_data_source)

        return JSONResponse(status_code=201, content=create_response(
            status_code=201,
            message="Data uploaded successfully",
            data={
                "table_name": table_name,
                "data_source_id": new_data_source.id
            },
        ))

    except HTTPException as he:
        return JSONResponse(status_code=500, content=create_response(
            status_code=500,
            message="Something went wrong",
            data={"error": str(he)}
        ))
        
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        return JSONResponse(status_code=500, content=create_response(
            status_code=500,
            message="Database error occurred",
            data={"error": str(e)}
        ))
    except Exception as e:
        logger.exception(f"Unexpected error: {str(e)}")
        return JSONResponse(status_code=500, content=create_response(
            status_code=500,
            message="An unexpected error occurred",
            data={"error": str(e)}
        ))
    finally:
        if buffer:
            buffer.close()
        logger.info("Upload process completed")


async def add_datasource(data: AddDataSource, id: int, db: DB) -> JSONResponse:
    try:
        session = db.create_session()
        # Create DataSources entry
        new_data_source = DataSources(
            name=data.table_name,
            type='url',
            connection_url=data.source_name,
            user_id=id
        )

        session.add(new_data_source)
        session.commit()
        session.refresh(new_data_source)

        return JSONResponse(status_code=201, content=create_response(
            status_code=201,
            message="Data uploaded successfully",
            data={
                "table_name": data.table_name,
                "connection_url": data.source_name,
                "id": new_data_source.id
            }
        ))

    except HTTPException as he:
        return JSONResponse(status_code=500, content=create_response(
            status_code=500,
            message="Something went wrong",
            data={"error": str(he)}
        ))
        
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        return JSONResponse(status_code=500, content=create_response(
            status_code=500,
            message="Database error occurred",
            data={"error": str(e)}
        ))
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return JSONResponse(status_code=500, content=create_response(
            status_code=500,
            message="An unexpected error occurred",
            data={"error": str(e)}
        ))



async def get_data_source_list(id: int, db: DB) -> JSONResponse:
    try:
        with db.session() as session:
            query = select(
                DataSources.id,
                DataSources.name,
                DataSources.type,
                DataSources.connection_url,
                DataSources.table_name,
                func.to_char(DataSources.created_at,
                             'YYYY-MM-DD').label('created_at')
            ).where(DataSources.user_id == id)

            result = session.execute(query)
            data_sources = result.mappings().all()

        # Convert to list of dicts and return
        sources = [dict(row) for row in data_sources]

        return JSONResponse(status_code=200, content=create_response(
            status_code=200,
            message="Data sources fetched successfully",
            data={"data_sources":sources}
        ))

    except HTTPException as he:
        return JSONResponse(status_code=500, content=create_response(
            status_code=500,
            message="Something went wrong",
            data={"error": str(he)}
        ))
        
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        return JSONResponse(status_code=500, content=create_response(
            status_code=500,
            message="Database error occurred",
            data={"error": str(e)}
        ))
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return JSONResponse(status_code=500, content=create_response(
            status_code=500,
            message="An unexpected error occurred",
            data={"error": str(e)}
        ))


async def get_source_tables(source: GetSourceTable) -> JSONResponse:
    try:
        db = DB(source.db_url)
        tables = db.inspector.get_table_names()
        return JSONResponse(status_code=200, content=create_response(
            status_code=200,
            message="Tables fetched successfully",
            data={"tables":tables}
        ))
    except HTTPException as he:
        return JSONResponse(status_code=500, content=create_response(
            status_code=500,
            message="Something went wrong",
            data={"error": str(he)}
        ))
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        return JSONResponse(status_code=500, content=create_response(
            status_code=500,
            message="Database error occurred",
            data={"error": str(e)}
        ))
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return JSONResponse(status_code=500, content=create_response(
            status_code=500,
            message="An unexpected error occurred",
            data={"error": str(e)}
        ))
    finally:
        if 'engine' in locals():
            db.engine.dispose()


async def suggest_questions(source_id: int, db: DB) -> JSONResponse:
    try:
        with db.session() as session:
            data_source = session.execute(select(DataSources).where(
                DataSources.id == source_id)).scalar_one_or_none()

            if not data_source:
                return JSONResponse(status_code=404, content=create_response(
                    status_code=404,
                    message="Data source not found",
                    data={}
                ))

            schema_info = ""
            if data_source.type in ['spreadsheet', 'url']:
                # For spreadsheets or SQL, get the table schema
                target_db = db
                if data_source.type == 'url':
                    target_db = DB(data_source.connection_url)
                
                table_names = [data_source.name if data_source.type == 'url' else data_source.table_name]
                schema = target_db.get_schemas(table_names)
                schema_info = f"Database Schema: {str(schema)}"
            else:
                # For documents, we don't have a fixed schema, but we know the name
                schema_info = f"Document Name: {data_source.name}. This is a text/PDF document."

            # Initialize LLM
            llm_instance = LLM()
            # use a fast model for suggestions
            model = llm_instance.groq("llama-3.3-70b-versatile")

            prompt = f"""
            You are LUMIN, an expert data analyst. Based on the following information about a dataset, suggest 4 interesting and diverse questions a user might want to ask to gain insights.
            
            {schema_info}
            
            Return the response as a JSON list of strings only. No other text.
            Example: ["What is the total sales by month?", "Who is the top performing employee?", ...]
            """
            
            response = model.invoke(prompt)
            content = response.content.strip()
            
            # Basic cleaning if AI includes markdown blocks
            if content.startswith("```json"):
                content = content.replace("```json", "").replace("```", "").strip()
            elif content.startswith("```"):
                content = content.replace("```", "").strip()
            
            try:
                questions = json.loads(content)
            except:
                # Fallback if AI fails to return valid JSON
                questions = [
                    "Tell me more about this data.",
                    "What are the main trends here?",
                    "Give me a summary of everything.",
                    "Show me some interesting patterns."
                ]

            return JSONResponse(status_code=200, content=create_response(
                status_code=200,
                message="Suggested questions generated",
                data={"questions": questions}
            ))

    except Exception as e:
        logger.exception(f"Error suggesting questions: {str(e)}")
        return JSONResponse(status_code=500, content=create_response(
            status_code=500,
            message="Failed to generate suggestions",
            data={"error": str(e)}
        ))


async def analyze_health(source_id: int, db: DB) -> JSONResponse:
    try:
        with db.session() as session:
            data_source = session.execute(select(DataSources).where(
                DataSources.id == source_id)).scalar_one_or_none()

            if not data_source:
                return JSONResponse(status_code=404, content=create_response(status_code=404, message="Data source not found", data={}))

            # 1. Fetch a sample of data for profiling
            sample_data = ""
            if data_source.type in ['spreadsheet', 'url']:
                target_db = db
                if data_source.type == 'url':
                    target_db = DB(data_source.connection_url)
                
                table_name = data_source.name if data_source.type == 'url' else data_source.table_name
                # Get first 10 rows
                df = pd.read_sql(f'SELECT * FROM "{table_name}" LIMIT 10', target_db.engine)
                sample_data = df.to_string()
            else:
                return JSONResponse(status_code=200, content=create_response(status_code=200, message="Document health check not yet implemented", data={"suggestions": []}))

            # 2. Use LLM to find data quality issues
            llm_instance = LLM()
            model = llm_instance.groq("llama-3.3-70b-versatile")

            prompt = f"""
            You are a Data Quality Agent. Analyze this sample of data and provide 3-5 specific suggestions for cleaning or normalizing it to improve analysis.
            Focus on inconsistencies, null patterns, or formatting issues.
            
            Data Sample:
            {sample_data}
            
            Return ONLY a JSON object with a key 'suggestions' containing a list of objects with 'issue' and 'fix' keys.
            Example: {{"suggestions": [{{"issue": "Inconsistent city names", "fix": "Normalize NYC/New York"}}]}}
            """
            
            response = model.invoke(prompt)
            content = response.content.strip()
            
            # Clean JSON blocks
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            
            try:
                suggestions_data = json.loads(content)
            except:
                suggestions_data = {"suggestions": [{"issue": "General check", "fix": "Ensure all columns have consistent data types"}]}

            return JSONResponse(status_code=200, content=create_response(
                status_code=200,
                message="Data health analyzed",
                data=suggestions_data
            ))

    except Exception as e:
        logger.exception(f"Error analyzing health: {str(e)}")
        return JSONResponse(status_code=500, content=create_response(status_code=500, message="Failed to analyze health", data={"error": str(e)}))

async def delete_datasource(source_id: int, user_id: int, db: DB) -> JSONResponse:
    try:
        with db.session() as session:
            # 1. Fetch data source
            data_source = session.execute(select(DataSources).where(
                DataSources.id == source_id,
                DataSources.user_id == user_id
            )).scalar_one_or_none()

            if not data_source:
                return JSONResponse(status_code=404, content=create_response(
                    status_code=404,
                    message="Data source not found",
                    data={}
                ))

            # 2. Cleanup underlying storage
            if data_source.type == 'spreadsheet':
                if data_source.table_name:
                    db.drop_table(data_source.table_name)
            elif data_source.type == 'document':
                if data_source.table_name:
                    vector_db.delete_collection(data_source.table_name)
            # For 'url' (SQL), we don't drop the user's external database tables!

            # 3. Delete Metadata
            session.delete(data_source)
            session.commit()

            return JSONResponse(status_code=200, content=create_response(
                status_code=200,
                message="Data source deleted successfully",
                data={"id": source_id}
            ))

    except Exception as e:
        logger.exception(f"Error deleting data source: {str(e)}")
        return JSONResponse(status_code=500, content=create_response(
            status_code=500,
            message="Failed to delete data source",
            data={"error": str(e)}
        ))
