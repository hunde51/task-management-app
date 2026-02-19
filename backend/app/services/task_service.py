from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenException, NotFoundException
from app.models.project import Project
from app.models.task import Task
from app.models.team import team_members
from app.models.user import User
from app.schemas.task import (
    MyTasksSummaryResponse,
    TaskAssign,
    TaskCreate,
    TaskResponse,
    TaskStatus,
    TaskStatusUpdate,
    TaskUpdate,
)
from app.services.project_service import get_project_or_404
from app.services.team_service import ensure_user_in_team, require_team_member


def _serialize_task(
    task: Task,
    *,
    project_name: str,
    assigned_user: User | None,
    current_user_id: int,
) -> TaskResponse:
    return TaskResponse(
        id=task.id,
        project_id=task.project_id,
        project_name=project_name,
        title=task.title,
        description=task.description,
        status=TaskStatus(task.status),
        due_date=task.due_date,
        assigned_user_id=task.assigned_user_id,
        assigned_username=assigned_user.username if assigned_user else None,
        assigned_first_name=assigned_user.first_name if assigned_user else None,
        assigned_last_name=assigned_user.last_name if assigned_user else None,
        created_by=task.created_by,
        created_at=task.created_at,
        updated_at=task.updated_at,
        can_update=task.assigned_user_id == current_user_id,
    )


def _get_task_or_404(db: Session, task_id: int) -> Task:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise NotFoundException("Task not found")
    return task


def _get_assigned_user(db: Session, assigned_user_id: int | None) -> User | None:
    if assigned_user_id is None:
        return None
    return db.query(User).filter(User.id == assigned_user_id).first()


def _can_manage_task_assignment(db: Session, task: Task, current_user_id: int) -> bool:
    project = get_project_or_404(db, task.project_id)
    membership = require_team_member(db, project.team_id, current_user_id)

    return bool(
        project.created_by == current_user_id
        or membership.role == "owner"
        or task.created_by == current_user_id
    )


def create_task(db: Session, payload: TaskCreate, current_user_id: int) -> TaskResponse:
    project = get_project_or_404(db, payload.project_id)
    require_team_member(db, project.team_id, current_user_id)

    if payload.assigned_user_id is not None:
        ensure_user_in_team(db, project.team_id, payload.assigned_user_id)

    task = Task(
        project_id=project.id,
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        status=TaskStatus.TODO.value,
        assigned_user_id=payload.assigned_user_id,
        due_date=payload.due_date,
        created_by=current_user_id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    assigned_user = _get_assigned_user(db, task.assigned_user_id)
    return _serialize_task(
        task,
        project_name=project.name,
        assigned_user=assigned_user,
        current_user_id=current_user_id,
    )


def list_tasks(
    db: Session,
    *,
    current_user_id: int,
    project_id: int | None,
    status: TaskStatus | None,
    assigned_user_id: int | None,
) -> list[TaskResponse]:
    if project_id is not None:
        project = get_project_or_404(db, project_id)
        require_team_member(db, project.team_id, current_user_id)

    stmt = (
        select(Task, Project.name, User)
        .select_from(Task)
        .join(Project, Task.project_id == Project.id)
        .join(team_members, team_members.c.team_id == Project.team_id)
        .outerjoin(User, Task.assigned_user_id == User.id)
        .where(team_members.c.user_id == current_user_id)
        .order_by(Task.created_at.desc(), Task.id.desc())
    )

    if project_id is not None:
        stmt = stmt.where(Task.project_id == project_id)

    if status is not None:
        stmt = stmt.where(Task.status == status.value)

    if assigned_user_id is not None:
        stmt = stmt.where(Task.assigned_user_id == assigned_user_id)

    rows = db.execute(stmt).all()
    return [
        _serialize_task(
            row[0],
            project_name=row[1],
            assigned_user=row[2],
            current_user_id=current_user_id,
        )
        for row in rows
    ]


def update_task(db: Session, *, task_id: int, payload: TaskUpdate, current_user_id: int) -> TaskResponse:
    task = _get_task_or_404(db, task_id)

    if task.assigned_user_id != current_user_id:
        raise ForbiddenException("Only assigned user can update this task")

    if payload.title is not None:
        task.title = payload.title.strip()

    if payload.description is not None:
        description = payload.description.strip()
        task.description = description or None

    if payload.due_date is not None:
        task.due_date = payload.due_date

    db.commit()
    db.refresh(task)

    project = get_project_or_404(db, task.project_id)
    assigned_user = _get_assigned_user(db, task.assigned_user_id)
    return _serialize_task(
        task,
        project_name=project.name,
        assigned_user=assigned_user,
        current_user_id=current_user_id,
    )


def update_task_status(
    db: Session,
    *,
    task_id: int,
    payload: TaskStatusUpdate,
    current_user_id: int,
) -> TaskResponse:
    task = _get_task_or_404(db, task_id)

    if task.assigned_user_id != current_user_id:
        raise ForbiddenException("Only assigned user can update task status")

    task.status = payload.status.value
    db.commit()
    db.refresh(task)

    project = get_project_or_404(db, task.project_id)
    assigned_user = _get_assigned_user(db, task.assigned_user_id)
    return _serialize_task(
        task,
        project_name=project.name,
        assigned_user=assigned_user,
        current_user_id=current_user_id,
    )


def assign_task(db: Session, *, task_id: int, payload: TaskAssign, current_user_id: int) -> TaskResponse:
    task = _get_task_or_404(db, task_id)
    project = get_project_or_404(db, task.project_id)

    if not _can_manage_task_assignment(db, task, current_user_id):
        raise ForbiddenException("Only team owner or project owner can assign task")

    if payload.assigned_user_id is not None:
        ensure_user_in_team(db, project.team_id, payload.assigned_user_id)

    task.assigned_user_id = payload.assigned_user_id
    db.commit()
    db.refresh(task)

    assigned_user = _get_assigned_user(db, task.assigned_user_id)
    return _serialize_task(
        task,
        project_name=project.name,
        assigned_user=assigned_user,
        current_user_id=current_user_id,
    )


def delete_task(db: Session, *, task_id: int, current_user_id: int) -> None:
    task = _get_task_or_404(db, task_id)
    project = get_project_or_404(db, task.project_id)
    membership = require_team_member(db, project.team_id, current_user_id)

    can_delete = (
        task.created_by == current_user_id
        or project.created_by == current_user_id
        or membership.role == "owner"
    )
    if not can_delete:
        raise ForbiddenException("You do not have permission to delete this task")

    db.delete(task)
    db.commit()


def get_my_tasks_summary(db: Session, current_user_id: int) -> MyTasksSummaryResponse:
    rows = db.execute(
        select(Task, Project.name, User)
        .select_from(Task)
        .join(Project, Task.project_id == Project.id)
        .outerjoin(User, Task.assigned_user_id == User.id)
        .where(Task.assigned_user_id == current_user_id)
        .order_by(Task.due_date.asc().nulls_last(), Task.created_at.desc())
    ).all()

    tasks = [
        _serialize_task(
            row[0],
            project_name=row[1],
            assigned_user=row[2],
            current_user_id=current_user_id,
        )
        for row in rows
    ]

    status_counts = {
        TaskStatus.TODO: 0,
        TaskStatus.IN_PROGRESS: 0,
        TaskStatus.DONE: 0,
    }

    for task in tasks:
        status_counts[task.status] = status_counts[task.status] + 1

    total_projects = db.execute(
        select(func.count(func.distinct(Task.project_id))).where(Task.assigned_user_id == current_user_id)
    ).scalar_one()

    return MyTasksSummaryResponse(
        tasks=tasks,
        status_counts=status_counts,
        total_projects=total_projects,
    )
