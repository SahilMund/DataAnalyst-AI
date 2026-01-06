from pydantic import BaseModel, Field
from typing import List, Optional


class AskQuestion(BaseModel):
    question: str = Field(...,
                          description="The question you want to ask about the data")
    type: str = Field(..., description="The type of question or analysis")
    selected_tables: Optional[List[str]] = Field(
        None, description="List of selected tables (optional)")
    dataset_id: int = Field(..., description="Primary Dataset ID to query")
    dataset_ids: Optional[List[int]] = Field(None, description="Additional dataset IDs for multi-source analysis")
    conversaction_id: int = Field(..., description="Conversaction ID to query")
    llm_model: str = Field(..., description="Model name for LLM")

    class Config:
        json_schema_extra = {
            "example": {
                "question": "What is the total revenue for each product category?",
                "type": "url",
                "selected_tables": ["sales", "products"],
                "dataset_id": "123",
                "conversaction_id": "123",
                "llm_model":"llama-3.1-8b-instant"
            }
        }


class InitiateCinversaction(BaseModel):
    data_source_id: Optional[int] = 0
    title: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "data_source_id": 1
            }
        }
