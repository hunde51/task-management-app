from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in-progress"
    DONE = "done"


class TaskCreate(BaseModel):
    project_id: int
    title: str = Field(min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    assigned_user_id: int | None = None
    due_date: datetime | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    due_date: datetime | None = None


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskAssign(BaseModel):
    assigned_user_id: int | None = None


class TaskResponse(BaseModel):
    id: int
    project_id: int
    project_name: str
    title: str
    description: str | None = None
    status: TaskStatus
    due_date: datetime | None = None
    assigned_user_id: int | None = None
    assigned_username: str | None = None
    assigned_first_name: str | None = None
    assigned_last_name: str | None = None
    created_by: int
    created_at: datetime
    updated_at: datetime | None = None
    can_update: bool = False

    model_config = ConfigDict(from_attributes=True)


class MyTasksSummaryResponse(BaseModel):
    tasks: list[TaskResponse]
    status_counts: dict[TaskStatus, int]
    total_projects: int
