from __future__ import annotations

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Table, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base

team_members = Table(
    "team_members",
    Base.metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("team_id", Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    Column("role", String(20), nullable=False, default="member", server_default="member"),
    Column("joined_at", DateTime(timezone=True), server_default=func.now(), nullable=False),
    UniqueConstraint("team_id", "user_id", name="uq_team_members_team_user"),
)


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(80), unique=True, index=True, nullable=False)
    description = Column(String(500), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    creator = relationship("User", back_populates="created_teams")
    members = relationship("User", secondary=team_members, back_populates="teams")
    projects = relationship("Project", back_populates="team", cascade="all, delete-orphan")
