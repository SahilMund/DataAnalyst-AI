# File: app/db/models.py
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Enum, DateTime, ForeignKey, JSON, text, Text
from app.config.env import DATABASE_URL
import logging
from .chat_history import Conversations, Messages
from .user import User
from .data_sources import DataSources
from .tasks import Tasks

logger = logging.getLogger(__name__)

# Create the SQLAlchemy engine
engine = create_engine(DATABASE_URL)
meta = MetaData()

# Define tables
users = Table(
    "users",
    meta,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("name", String(50)),
    Column("email", String(100), unique=True),
    Column("hashed_password", String(400), unique=True),
    Column("created_at", DateTime, server_default=text('CURRENT_TIMESTAMP'))
)

data_sources = Table(
    "data_sources",
    meta,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("user_id", Integer, ForeignKey("users.id")),
    Column("name", String(50)),
    Column("type", String(50)),
    Column("table_name", String(400), nullable=True, unique=True),
    Column("connection_url", String(400), nullable=True, unique=True),
    Column("created_at", DateTime, server_default=text('CURRENT_TIMESTAMP'))
)

conversations = Table(
    "conversations",
    meta,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("user_id", Integer, ForeignKey("users.id")),
    Column("data_source_id", Integer, ForeignKey("data_sources.id")),
    # Auto-generated title or first message snippet
    Column("title", String(200), nullable=True),
    Column("created_at", DateTime, server_default=text('CURRENT_TIMESTAMP')),
    Column("updated_at", DateTime, server_default=text(
        'CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP')),
)

messages = Table(
    "messages",
    meta,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("conversation_id", Integer, ForeignKey("conversations.id")),
    Column("role", Enum('user', 'assistant', 'system', name='message_role')),
    Column("content", JSON),  # The actual message content
    Column("created_at", DateTime, server_default=text('CURRENT_TIMESTAMP')),
    Column("updated_at", DateTime, server_default=text(
        'CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP')),
)

tasks = Table(
    "tasks",
    meta,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("user_id", Integer, ForeignKey("users.id")),
    Column("data_source_id", Integer, ForeignKey("data_sources.id"), nullable=True),
    Column("title", String(200), nullable=False),
    Column("description", Text, nullable=True),
    Column("status", String(50), server_default=text("'pending'")),
    Column("priority", String(50), server_default=text("'medium'")),
    Column("created_at", DateTime, server_default=text('CURRENT_TIMESTAMP')),
    Column("updated_at", DateTime, server_default=text(
        'CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP')),
)


def init_db():
    try:
        # This will create both the enum type and tables
        meta.create_all(engine)
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise
