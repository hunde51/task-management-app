from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class TeamRole(str, Enum):
    OWNER = "owner"
    MEMBER = "member"


class TeamBase(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    description: str | None = Field(default=None, max_length=500)


class TeamCreate(TeamBase):
    pass


class TeamResponse(TeamBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime | None = None
    current_user_role: TeamRole | None = None

    model_config = ConfigDict(from_attributes=True)


class TeamMemberCreate(BaseModel):
    user_id: int
    role: TeamRole = TeamRole.MEMBER


class TeamMemberInvite(BaseModel):
    identifier: str = Field(min_length=2, max_length=255, description="Username or email")
    role: TeamRole = TeamRole.MEMBER


class TeamMemberResponse(BaseModel):
    id: int
    team_id: int
    user_id: int
    role: TeamRole
    joined_at: datetime
    username: str
    email: str
    first_name: str
    last_name: str


class TeamMemberDetailResponse(BaseModel):
    id: int
    team_id: int
    user_id: int
    username: str
    email: str
    first_name: str
    last_name: str
    role: TeamRole
    joined_at: datetime
