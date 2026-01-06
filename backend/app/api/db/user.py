from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .base_class import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True,
                index=True)  # Single primary key
    name = Column(String, index=True)  # Changed name to String
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column("created_at", DateTime, default=datetime.utcnow)

    # Add this relationship
    data_sources = relationship("DataSources", back_populates="user")
    conversations = relationship("Conversations", back_populates="user")
    tasks = relationship("Tasks", back_populates="user")
