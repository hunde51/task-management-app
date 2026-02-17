from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

TeamRole = Literal["owner", "member"]


class TeamBase(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    description: Optional[str] = Field(default=None, max_length=500)


class TeamCreate(TeamBase):
    pass


class TeamResponse(TeamBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TeamMember(BaseModel):
    user_id: int
    role: TeamRole = "member"


class TeamMemberInvite(BaseModel):
    identifier: str = Field(min_length=2, max_length=255, description="Username or email")
    role: TeamRole = "member"


class TeamMemberResponse(BaseModel):
    id: int
    team_id: int
    user_id: int
    role: TeamRole
    joined_at: datetime

    class Config:
        from_attributes = True


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
