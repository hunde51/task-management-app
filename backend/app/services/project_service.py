from __future__ import annotations

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.services.team_service import require_team_member


def get_project_or_404(db: Session, project_id: int) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundException("Project not found")
    return project


def _project_to_response(project: Project, current_user_id: int) -> ProjectResponse:
    return ProjectResponse.model_validate(project).model_copy(
        update={"can_delete": project.created_by == current_user_id}
    )


def create_project(
    db: Session,
    *,
    team_id: int,
    payload: ProjectCreate,
    current_user_id: int,
) -> ProjectResponse:
    require_team_member(db, team_id, current_user_id)

    existing = (
        db.query(Project)
        .filter(
            Project.team_id == team_id,
            Project.name == payload.name.strip(),
        )
        .first()
    )
    if existing:
        raise BadRequestException("Project name already exists in this team")

    project = Project(
        team_id=team_id,
        name=payload.name.strip(),
        description=payload.description.strip() if payload.description else None,
        created_by=current_user_id,
    )
    try:
        db.add(project)
        db.commit()
        db.refresh(project)
    except SQLAlchemyError:
        db.rollback()
        raise

    return _project_to_response(project, current_user_id)


def list_team_projects(db: Session, team_id: int, current_user_id: int) -> list[ProjectResponse]:
    require_team_member(db, team_id, current_user_id)
    projects = (
        db.query(Project)
        .filter(Project.team_id == team_id)
        .order_by(Project.created_at.desc(), Project.id.desc())
        .all()
    )
    return [_project_to_response(project, current_user_id) for project in projects]


def update_project(
    db: Session,
    *,
    project_id: int,
    payload: ProjectUpdate,
    current_user_id: int,
) -> ProjectResponse:
    project = get_project_or_404(db, project_id)
    require_team_member(db, project.team_id, current_user_id)

    if payload.name is not None:
        name = payload.name.strip()
        existing = (
            db.query(Project)
            .filter(
                Project.team_id == project.team_id,
                Project.name == name,
                Project.id != project.id,
            )
            .first()
        )
        if existing:
            raise BadRequestException("Project name already exists in this team")
        project.name = name

    if payload.description is not None:
        description = payload.description.strip()
        project.description = description or None

    try:
        db.commit()
        db.refresh(project)
    except SQLAlchemyError:
        db.rollback()
        raise
    return _project_to_response(project, current_user_id)


def delete_project(db: Session, *, project_id: int, current_user_id: int) -> None:
    project = get_project_or_404(db, project_id)
    require_team_member(db, project.team_id, current_user_id)

    if project.created_by != current_user_id:
        raise ForbiddenException("Only project owner can delete this project")

    try:
        db.delete(project)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise
