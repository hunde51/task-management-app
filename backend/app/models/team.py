from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Table, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

# Association table for team members (many-to-many relationship)
team_members = Table(
    'team_members',
    Base.metadata,
    Column('id', Integer, primary_key=True, index=True),
    Column('team_id', Integer, ForeignKey('teams.id'), nullable=False),
    Column('user_id', Integer, ForeignKey('users.id'), nullable=False),
    Column('role', String, default='member', nullable=False),  # owner, member
    Column('joined_at', DateTime(timezone=True), server_default=func.now()),
    UniqueConstraint('team_id', 'user_id', name='uq_team_members_team_user'),
)

class Team(Base):
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", back_populates="created_teams")
    members = relationship("User", secondary=team_members, back_populates="teams")
    projects = relationship("Project", back_populates="team", cascade="all, delete-orphan")
