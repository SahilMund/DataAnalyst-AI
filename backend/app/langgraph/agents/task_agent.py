from typing import Dict, Any, List
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.language_models import BaseLLM
from app.config.logging_config import get_logger

logger = get_logger(__name__)

class TaskAgent:
    def __init__(self, llm: BaseLLM):
        self.llm = llm
        self.json_parser = JsonOutputParser()

    def identify_task_intent(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Check if the user wants to perform a task action"""
        logger.info("======= identify_task_intent =======")
        question = state['question'].lower()
        
        # Simple keyword heuristic first for speed
        task_keywords = ["task", "todo", "remind", "project", "assign", "delete task"]
        if not any(kw in question for kw in task_keywords):
            return {"is_task": False}

        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a Task Management Assistant. Determine if the user wants to create, update, delete, or list tasks (todos).
            
            Return a JSON object:
            {{
                "is_task": boolean,
                "action": "create" | "update" | "delete" | "list" | "none",
                "task_details": {{
                    "title": string | null,
                    "description": string | null,
                    "status": "pending" | "in-progress" | "completed" | null,
                    "priority": "low" | "medium" | "high" | null,
                    "data_source_id": number | null
                }}
            }}
            """),
            ("human", "{question}")
        ])
        
        chain = prompt | self.llm | self.json_parser
        response = chain.invoke({"question": question})
        return response
