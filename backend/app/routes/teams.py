from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.team import (
    TeamCreate,
    TeamMemberCreate,
    TeamMemberDetailResponse,
    TeamMemberInvite,
    TeamMemberResponse,
    TeamResponse,
)
from app.services.team_service import add_member, create_team, get_team_members, get_user_teams, invite_member

router = APIRouter(prefix="/teams", tags=["Teams"])


@router.post(
    "/",
    response_model=ApiResponse[TeamResponse],
    status_code=status.HTTP_201_CREATED,
)
def create_team_endpoint(
    payload: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    team = create_team(db, payload, current_user.id)
    return ApiResponse(message="Team created successfully", data=team)


@router.get("/", response_model=ApiResponse[list[TeamResponse]])
def list_teams_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    teams = get_user_teams(db, current_user.id)
    return ApiResponse(message="Teams fetched successfully", data=teams)


@router.get("/{team_id}/members", response_model=ApiResponse[list[TeamMemberDetailResponse]])
def list_team_members_endpoint(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    members = get_team_members(db, team_id, current_user.id)
    return ApiResponse(message="Team members fetched successfully", data=members)


@router.post(
    "/{team_id}/members",
    response_model=ApiResponse[TeamMemberResponse],
    status_code=status.HTTP_201_CREATED,
)
def add_team_member_endpoint(
    team_id: int,
    payload: TeamMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member = add_member(db, team_id, payload, current_user.id)
    return ApiResponse(message="Member added successfully", data=member)


@router.post(
    "/{team_id}/members/invite",
    response_model=ApiResponse[TeamMemberResponse],
    status_code=status.HTTP_201_CREATED,
)
def invite_team_member_endpoint(
    team_id: int,
    payload: TeamMemberInvite,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member = invite_member(db, team_id, payload, current_user.id)
    return ApiResponse(message="Member invited successfully", data=member)
