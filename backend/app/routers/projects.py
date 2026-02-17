from typing import List

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from ..services.project_service import (
    create_project,
    delete_project,
    list_team_projects,
    update_project,
)

router = APIRouter(tags=["projects"])


@router.post(
    "/teams/{team_id}/projects",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_team_project(
    team_id: int,
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_project(db, team_id, payload, current_user.id)


@router.get("/teams/{team_id}/projects", response_model=List[ProjectResponse])
def list_projects_for_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_team_projects(db, team_id, current_user.id)


@router.patch("/projects/{project_id}", response_model=ProjectResponse)
def update_project_by_id(
    project_id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_project(db, project_id, payload, current_user.id)


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_by_id(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delete_project(db, project_id, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
