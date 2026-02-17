from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models.project import Project
from ..models.team import Team, team_members
from ..schemas.project import ProjectCreate, ProjectUpdate


def get_team_or_404(db: Session, team_id: int) -> Team:
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    return team


def require_team_member(db: Session, team_id: int, user_id: int):
    membership = db.execute(
        select(team_members).where(
            (team_members.c.team_id == team_id) & (team_members.c.user_id == user_id)
        )
    ).first()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this team",
        )
    return membership


def get_project_or_404(db: Session, project_id: int) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


def create_project(db: Session, team_id: int, payload: ProjectCreate, current_user_id: int) -> Project:
    get_team_or_404(db, team_id)
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
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project name already exists in this team",
        )

    project = Project(
        team_id=team_id,
        name=payload.name.strip(),
        description=payload.description.strip() if payload.description else None,
        created_by=current_user_id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def list_team_projects(db: Session, team_id: int, current_user_id: int):
    get_team_or_404(db, team_id)
    require_team_member(db, team_id, current_user_id)
    return (
        db.query(Project)
        .filter(Project.team_id == team_id)
        .order_by(Project.created_at.desc(), Project.id.desc())
        .all()
    )


def update_project(db: Session, project_id: int, payload: ProjectUpdate, current_user_id: int) -> Project:
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
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Project name already exists in this team",
            )
        project.name = name

    if payload.description is not None:
        desc = payload.description.strip()
        project.description = desc or None

    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project_id: int, current_user_id: int):
    project = get_project_or_404(db, project_id)
    require_team_member(db, project.team_id, current_user_id)
    db.delete(project)
    db.commit()
