from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.security import get_current_user
from ..models.team import Team, team_members
from ..models.user import User
from ..schemas.team import (
    TeamCreate,
    TeamMember,
    TeamMemberDetailResponse,
    TeamMemberInvite,
    TeamMemberResponse,
    TeamResponse,
)

router = APIRouter(prefix="/teams", tags=["teams"])


def _get_team_or_404(db: Session, team_id: int) -> Team:
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    return team


def _get_membership(db: Session, team_id: int, user_id: int):
    return db.execute(
        select(team_members).where(
            (team_members.c.team_id == team_id) & (team_members.c.user_id == user_id)
        )
    ).first()


def _require_team_member(db: Session, team_id: int, user_id: int):
    membership = _get_membership(db, team_id, user_id)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this team",
        )
    return membership


def _require_team_owner(db: Session, team_id: int, user_id: int):
    membership = _require_team_member(db, team_id, user_id)
    if membership.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team owners can perform this action",
        )
    return membership


def _insert_membership(db: Session, team_id: int, user_id: int, role: str):
    result = db.execute(
        team_members.insert().values(
            team_id=team_id,
            user_id=user_id,
            role=role,
        )
    )
    db.commit()
    return db.execute(select(team_members).where(team_members.c.id == result.lastrowid)).first()


@router.post("/", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    team: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing_team = db.query(Team).filter(Team.name == team.name).first()
    if existing_team:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Team name already exists")

    db_team = Team(
        name=team.name.strip(),
        description=team.description.strip() if team.description else None,
        created_by=current_user.id,
    )
    db.add(db_team)
    db.commit()
    db.refresh(db_team)

    _insert_membership(db, db_team.id, current_user.id, "owner")
    return db_team


@router.get("/", response_model=List[TeamResponse])
def get_user_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_team_rows = db.execute(
        select(team_members.c.team_id).where(team_members.c.user_id == current_user.id)
    ).all()
    team_ids = [row.team_id for row in user_team_rows]

    if not team_ids:
        return []

    return (
        db.query(Team)
        .filter(Team.id.in_(team_ids))
        .order_by(Team.created_at.desc(), Team.id.desc())
        .all()
    )


@router.get("/{team_id}/members", response_model=List[TeamMemberDetailResponse])
def list_team_members(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_team_or_404(db, team_id)
    _require_team_member(db, team_id, current_user.id)

    rows = db.execute(
        select(
            team_members.c.id,
            team_members.c.team_id,
            team_members.c.user_id,
            User.username,
            User.email,
            User.first_name,
            User.last_name,
            team_members.c.role,
            team_members.c.joined_at,
        )
        .select_from(team_members.join(User, team_members.c.user_id == User.id))
        .where(team_members.c.team_id == team_id)
        .order_by(team_members.c.joined_at.asc(), team_members.c.id.asc())
    ).all()

    return [
        TeamMemberDetailResponse(
            id=row.id,
            team_id=row.team_id,
            user_id=row.user_id,
            username=row.username,
            email=row.email,
            first_name=row.first_name,
            last_name=row.last_name,
            role=row.role,
            joined_at=row.joined_at,
        )
        for row in rows
    ]


@router.post("/{team_id}/members", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED)
def add_user_to_team(
    team_id: int,
    member: TeamMember,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_team_or_404(db, team_id)
    _require_team_owner(db, team_id, current_user.id)

    user = db.query(User).filter(User.id == member.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    existing_member = _get_membership(db, team_id, member.user_id)
    if existing_member:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already a team member")

    return _insert_membership(db, team_id, member.user_id, member.role)


@router.post(
    "/{team_id}/members/invite",
    response_model=TeamMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def invite_user_to_team(
    team_id: int,
    invite: TeamMemberInvite,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_team_or_404(db, team_id)
    _require_team_owner(db, team_id, current_user.id)

    identifier = invite.identifier.strip()
    user = db.query(User).filter(or_(User.username == identifier, User.email == identifier)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Use an existing username or email.",
        )

    existing_member = _get_membership(db, team_id, user.id)
    if existing_member:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already a team member")

    return _insert_membership(db, team_id, user.id, invite.role)
