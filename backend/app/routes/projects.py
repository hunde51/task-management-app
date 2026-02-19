from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.services.project_service import create_project, delete_project, list_team_projects, update_project

router = APIRouter(tags=["Projects"])


@router.post(
    "/teams/{team_id}/projects",
    response_model=ApiResponse[ProjectResponse],
    status_code=status.HTTP_201_CREATED,
)
def create_project_endpoint(
    team_id: int,
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = create_project(db, team_id=team_id, payload=payload, current_user_id=current_user.id)
    return ApiResponse(message="Project created successfully", data=project)


@router.get("/teams/{team_id}/projects", response_model=ApiResponse[list[ProjectResponse]])
def list_projects_endpoint(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projects = list_team_projects(db, team_id, current_user.id)
    return ApiResponse(message="Projects fetched successfully", data=projects)


@router.patch("/projects/{project_id}", response_model=ApiResponse[ProjectResponse])
def update_project_endpoint(
    project_id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = update_project(db, project_id=project_id, payload=payload, current_user_id=current_user.id)
    return ApiResponse(message="Project updated successfully", data=project)


@router.delete("/projects/{project_id}", response_model=ApiResponse[None])
def delete_project_endpoint(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delete_project(db, project_id=project_id, current_user_id=current_user.id)
    return ApiResponse(message="Project deleted successfully")
