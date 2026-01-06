from typing import List, Dict, Any
from sqlalchemy import create_engine, inspect, text, inspect
from sqlalchemy.orm import sessionmaker, Session
from langchain_huggingface import HuggingFaceEmbeddings
from app.config.logging_config import get_logger
# from langchain_community.vectorstores import PGVector
from langchain_postgres.vectorstores import PGVector
from fastapi import HTTPException
from langchain_core.documents import Document
import pandas as pd
from app.config.env import (DATABASE_URL)
from typing import List, Optional

logger = get_logger(__name__)


class DB:
    def __init__(self, db_url: str):
        """
        Initialize the database connection.

        Args:
            db_url (str): Database URL
        """
        self.engine = create_engine(db_url)
        self.session = sessionmaker(
            autocommit=False, autoflush=False, bind=self.engine)
        self.inspector = inspect(self.engine)

    def execute_query(self, query: str) -> list:
        print(f"DEBUG_SQL: Executing Query: {query}")
        with self.session() as session:
            result = session.execute(text(query))
            if result.returns_rows:
                rows = [row for row in result.fetchall()]
                print(f"DEBUG_SQL: Query returned {len(rows)} rows")
                return rows
            else:
                session.commit()
                print("DEBUG_SQL: Query executed successfully (no rows returned)")
                return []

    def create_session(self) -> Session:
        return self.session()

    def get_schemas(self, table_names: List[str]) -> List[Dict]:
        try:
            # Create an inspector object
            inspector = inspect(self.engine)

            # Initialize an array to hold the schema information for all tables
            schemas_info = []

            for table_name in table_names:
                schema_info = {
                    "table_name": table_name,
                    "schema": []
                }

                # Get the columns for the specified table
                columns = inspector.get_columns(table_name)
                # Collect column information
                for column in columns:
                    schema_info["schema"].append({
                        "name": column['name'],
                        "type": str(column['type']),
                        "nullable": column['nullable']
                    })

                # Append the schema information for the current table to the list
                schemas_info.append(schema_info)

            # Return the schema information for all tables
            return schemas_info

        except Exception as e:
            logger.error(f"An error occurred: {e}")
            return []  # Return an empty list in case of an error

    async def insert_dataframe(self, df: pd.DataFrame, table_name: str) -> Dict[str, Any]:
        """Insert pandas DataFrame into database"""
        try:
            with self.session() as session:
                df.to_sql(
                    name=table_name,
                    con=session.get_bind(),
                    if_exists='replace',
                    index=False
                )
                return {
                    "message": f"Successfully inserted data into table {table_name}",
                    "rows_processed": len(df)
                }
        except Exception as e:
            logger.error(f"Data insertion error: {str(e)}")
            raise HTTPException(
                status_code=500, detail="Failed to insert data into database")

    def drop_table(self, table_name: str):
        """Drop a table from the database"""
        try:
            with self.session() as session:
                session.execute(text(f'DROP TABLE IF EXISTS "{table_name}" CASCADE'))
                session.commit()
                logger.info(f"Dropped table: {table_name}")
        except Exception as e:
            logger.error(f"Error dropping table {table_name}: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Failed to drop table: {str(e)}")


class VectorDB:
    def __init__(self):
        """Initialize VectorDB with connection string"""
        self.connection_string = DATABASE_URL
        self._embedding: Optional[HuggingFaceEmbeddings] = None

    def initialize_embedding(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        """
        Initialize the embedding model.
        """
        if self._embedding is None:
            logger.info(f"Initializing HuggingFaceEmbeddings with model: {model_name}")
            self._embedding = HuggingFaceEmbeddings(model_name=model_name)
            return "Embedding model initialized successfully."
        return "Embedding model already initialized."

    @property
    def embeddings(self):
        if self._embedding is None:
            raise ValueError(
                "Embedding model not initialized. Call initialize_embedding() first.")
        return self._embedding

    async def insert_data(self, documents: List[Document], collection_name: str) -> PGVector:
        """Insert documents into vector store"""
        try:
            return PGVector.from_documents(
                embedding=self.embeddings,
                documents=documents,
                collection_name=collection_name,
                connection=self.connection_string,
                use_jsonb=True,
            )
        except Exception as e:
            logger.exception(f"Vector store insertion error: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Failed to insert documents into vector store: {str(e)}")

    def get_vector_store(self, collection_name: str) -> PGVector:
        """Get existing vector store"""
        try:
            return PGVector(
                connection=self.connection_string,
                embeddings=self.embeddings,
                collection_name=collection_name,
                use_jsonb=True,
            )
        except Exception as e:
            logger.exception(f"Vector store retrieval error: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Failed to retrieve vector store: {str(e)}")

    def get_all_documents(self, collection_name: str) -> List[Document]:
        """Fetch all documents for a collection from the database"""
        try:
            documents = []
            with self._get_engine().connect() as conn:
                # 1. Find the collection UUID
                query_coll = text("SELECT uuid FROM langchain_pg_collection WHERE name = :name")
                res_coll = conn.execute(query_coll, {"name": collection_name}).fetchone()
                
                if not res_coll:
                    return []
                
                collection_uuid = res_coll[0]
                
                # 2. Fetch all embeddings/documents for this collection
                query_docs = text("SELECT document, cmetadata FROM langchain_pg_embedding WHERE collection_id = :id")
                res_docs = conn.execute(query_docs, {"id": collection_uuid}).fetchall()
                
                for row in res_docs:
                    content = row[0]
                    metadata = row[1] if row[1] else {}
                    documents.append(Document(page_content=content, metadata=metadata))
            
            return documents
        except Exception as e:
            logger.error(f"Error fetching documents for {collection_name}: {str(e)}")
            return []

    def delete_collection(self, collection_name: str):
        """Delete a collection from the vector store"""
        try:
            # Manually drop the collection if PGVector doesn't expose it easily
            # langchain_postgres uses langchain_pg_collection and langchain_pg_embedding tables
            with self._get_engine().connect() as conn:
                # Find collection id
                res = conn.execute(text("SELECT uuid FROM langchain_pg_collection WHERE name = :name"), {"name": collection_name}).fetchone()
                if res:
                    collection_uuid = res[0]
                    # Delete embeddings
                    conn.execute(text("DELETE FROM langchain_pg_embedding WHERE collection_id = :id"), {"id": collection_uuid})
                    # Delete collection
                    conn.execute(text("DELETE FROM langchain_pg_collection WHERE uuid = :id"), {"id": collection_uuid})
                    conn.commit()
                    logger.info(f"Deleted vector collection: {collection_name}")
        except Exception as e:
            logger.error(f"Error deleting vector collection {collection_name}: {str(e)}")

    def _get_engine(self):
        # Helper to get engine for manual SQL
        return create_engine(self.connection_string)
