from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.task import (
    MyTasksSummaryResponse,
    TaskAssign,
    TaskCreate,
    TaskResponse,
    TaskStatus,
    TaskStatusUpdate,
    TaskUpdate,
)
from app.services.task_service import (
    assign_task,
    create_task,
    delete_task,
    get_my_tasks_summary,
    list_tasks,
    update_task,
    update_task_status,
)

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get("/me/summary", response_model=ApiResponse[MyTasksSummaryResponse])
def my_tasks_summary_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    summary = get_my_tasks_summary(db, current_user.id)
    return ApiResponse(message="My task summary fetched successfully", data=summary)


@router.post(
    "/",
    response_model=ApiResponse[TaskResponse],
    status_code=status.HTTP_201_CREATED,
)
def create_task_endpoint(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = create_task(db, payload, current_user.id)
    return ApiResponse(message="Task created successfully", data=task)


@router.get("/", response_model=ApiResponse[list[TaskResponse]])
def list_tasks_endpoint(
    project_id: int | None = None,
    status_filter: TaskStatus | None = Query(default=None, alias="status"),
    assigned_user_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tasks = list_tasks(
        db,
        current_user_id=current_user.id,
        project_id=project_id,
        status=status_filter,
        assigned_user_id=assigned_user_id,
    )
    return ApiResponse(message="Tasks fetched successfully", data=tasks)


@router.patch("/{task_id}", response_model=ApiResponse[TaskResponse])
def update_task_endpoint(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = update_task(db, task_id=task_id, payload=payload, current_user_id=current_user.id)
    return ApiResponse(message="Task updated successfully", data=task)


@router.patch("/{task_id}/status", response_model=ApiResponse[TaskResponse])
def update_task_status_endpoint(
    task_id: int,
    payload: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = update_task_status(db, task_id=task_id, payload=payload, current_user_id=current_user.id)
    return ApiResponse(message="Task status updated successfully", data=task)


@router.patch("/{task_id}/assign", response_model=ApiResponse[TaskResponse])
def assign_task_endpoint(
    task_id: int,
    payload: TaskAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = assign_task(db, task_id=task_id, payload=payload, current_user_id=current_user.id)
    return ApiResponse(message="Task assignment updated successfully", data=task)


@router.delete("/{task_id}", response_model=ApiResponse[None])
def delete_task_endpoint(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delete_task(db, task_id=task_id, current_user_id=current_user.id)
    return ApiResponse(message="Task deleted successfully")
