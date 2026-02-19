from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProjectBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=2000)


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=2000)


class ProjectResponse(ProjectBase):
    id: int
    team_id: int
    created_by: int
    created_at: datetime
    updated_at: datetime | None = None
    can_delete: bool = False

    model_config = ConfigDict(from_attributes=True)
