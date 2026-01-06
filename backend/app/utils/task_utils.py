import json
from fastapi.responses import StreamingResponse
from app.langgraph.agents.task_agent import TaskAgent
from app.api.controllers import task_controller
from app.api.validators.task_validator import TaskCreate, TaskUpdate
from app.config.db_config import DB
from app.config.llm_config import LLM
from app.utils.chat_utils import save_message
from app.config.logging_config import get_logger

logger = get_logger(__name__)
llm_instance = LLM()

async def execute_task_workflow(question: str, conversation_id: int, user_id: int, db: DB, llm_model: str):
    try:
        from app.api.db.data_sources import DataSources
        from sqlalchemy import select
        
        # Fetch data sources to help AI link tasks
        with db.session() as session:
            sources = session.execute(select(DataSources).where(DataSources.user_id == user_id)).scalars().all()
            source_context = [{"id": s.id, "name": s.name} for s in sources]

        llm = llm_instance.groq(llm_model)
        agent = TaskAgent(llm)
        
        # 1. Identify intent with dataset context
        extended_question = f"Contextual DataSources: {source_context}\n\nUser Question: {question}"
        intent = agent.identify_task_intent({"question": extended_question})
        
        async def task_stream():
            if intent.get("is_task"):
                action = intent.get("action")
                details = intent.get("task_details", {})
                
                yield json.dumps({"data": {"status": "analyzing_intent", "action": action}}) + "\n"
                
                result_msg = ""
                if action == "create":
                    from app.api.db.tasks import Tasks
                    with db.session() as session:
                        new_task = Tasks(
                            user_id=user_id,
                            title=details.get("title") or question[:50],
                            description=details.get("description"),
                            data_source_id=details.get("data_source_id")
                        )
                        session.add(new_task)
                        session.commit()
                        result_msg = f"✅ Task created: '**{new_task.title}**'. I've added it to your workspace."
                        if new_task.data_source_id:
                            src_name = next((s["name"] for s in source_context if s["id"] == new_task.data_source_id), "selected dataset")
                            result_msg += f" It's linked to the **{src_name}** dataset."
                
                elif action == "update":
                    from app.api.db.tasks import Tasks
                    from sqlalchemy import update
                    
                    target_title = details.get("title") or question
                    with db.session() as session:
                        # Find the task - try exact match or partial match on title
                        task = session.execute(
                            select(Tasks).where(
                                Tasks.user_id == user_id,
                                Tasks.title.ilike(f"%{target_title}%")
                            )
                        ).scalars().first()
                        
                        if task:
                            update_values = {}
                            if details.get("status"): update_values["status"] = details.get("status")
                            if details.get("priority"): update_values["priority"] = details.get("priority")
                            if details.get("description"): update_values["description"] = details.get("description")
                            if details.get("title") and details.get("title") != target_title: 
                                update_values["title"] = details.get("title")
                            
                            if update_values:
                                session.execute(update(Tasks).where(Tasks.id == task.id).values(**update_values))
                                session.commit()
                                result_msg = f"✅ Updated task: '**{task.title}**'. Changes applied."
                            else:
                                result_msg = f"I found the task '**{task.title}**', but I wasn't sure what specific changes to make. Could you clarify if you want to change the status, priority, or description?"
                        else:
                            result_msg = f"🔍 I couldn't find a task matching '**{target_title}**'. Please check the title and try again."

                elif action == "delete":
                    from app.api.db.tasks import Tasks
                    from sqlalchemy import delete
                    
                    target_title = details.get("title") or question
                    with db.session() as session:
                        task = session.execute(
                            select(Tasks).where(
                                Tasks.user_id == user_id,
                                Tasks.title.ilike(f"%{target_title}%")
                            )
                        ).scalars().first()
                        
                        if task:
                            session.execute(delete(Tasks).where(Tasks.id == task.id))
                            session.commit()
                            result_msg = f"🗑️ Deleted task: '**{task.title}**'."
                        else:
                            result_msg = f"🔍 I couldn't find a task matching '**{target_title}**' to delete."

                elif action == "list":
                    from app.api.db.tasks import Tasks
                    with db.session() as session:
                        tasks = session.execute(
                            select(Tasks).where(Tasks.user_id == user_id).order_by(Tasks.created_at.desc()).limit(5)
                        ).scalars().all()
                        
                        if tasks:
                            task_list_str = "\n".join([f"• **{t.title}** ({t.status})" for t in tasks])
                            result_msg = f"📋 Your latest tasks:\n{task_list_str}"
                        else:
                            result_msg = "You don't have any tasks in your workspace yet. Would you like to create one?"

                content = {"answer": result_msg}
                save_message(conversation_id, "assistant", content, db)
                yield json.dumps({"data": {"answer": result_msg}}) + "\n"
            else:
                answer = "I'm your Project Assistant! I can help you create tasks and link them to your data. Try: 'Add a task to review the Sales dataset outliers'."
                yield json.dumps({"data": {"answer": answer}}) + "\n"

        return StreamingResponse(task_stream(), media_type="text/event-stream")

    except Exception as e:
        logger.error(f"Task workflow error: {str(e)}")
        raise
