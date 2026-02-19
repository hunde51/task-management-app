from __future__ import annotations

from sqlalchemy import or_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.models.team import Team, team_members
from app.models.user import User
from app.schemas.team import (
    TeamCreate,
    TeamMemberCreate,
    TeamMemberDetailResponse,
    TeamMemberInvite,
    TeamMemberResponse,
    TeamResponse,
    TeamRole,
)


def _get_team_or_404(db: Session, team_id: int) -> Team:
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise NotFoundException("Team not found")
    return team


def _get_membership(db: Session, team_id: int, user_id: int):
    return db.execute(
        select(team_members).where(
            (team_members.c.team_id == team_id) & (team_members.c.user_id == user_id)
        )
    ).first()


def require_team_member(db: Session, team_id: int, user_id: int):
    _get_team_or_404(db, team_id)
    membership = _get_membership(db, team_id, user_id)
    if not membership:
        raise ForbiddenException("Only team members can access this team")
    return membership


def require_team_owner(db: Session, team_id: int, user_id: int):
    membership = require_team_member(db, team_id, user_id)
    if membership.role != TeamRole.OWNER.value:
        raise ForbiddenException("Only team owners can perform this action")
    return membership


def _insert_membership(db: Session, team_id: int, user_id: int, role: TeamRole):
    try:
        db.execute(
            team_members.insert().values(
                team_id=team_id,
                user_id=user_id,
                role=role.value,
            )
        )
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise

    row = db.execute(
        select(
            team_members.c.id,
            team_members.c.team_id,
            team_members.c.user_id,
            team_members.c.role,
            team_members.c.joined_at,
            User.username,
            User.email,
            User.first_name,
            User.last_name,
        )
        .select_from(team_members.join(User, team_members.c.user_id == User.id))
        .where((team_members.c.team_id == team_id) & (team_members.c.user_id == user_id))
    ).first()

    if not row:
        raise NotFoundException("Team membership not found")

    return TeamMemberResponse(
        id=row.id,
        team_id=row.team_id,
        user_id=row.user_id,
        role=TeamRole(row.role),
        joined_at=row.joined_at,
        username=row.username,
        email=row.email,
        first_name=row.first_name,
        last_name=row.last_name,
    )


def create_team(db: Session, payload: TeamCreate, current_user_id: int) -> TeamResponse:
    existing_team = db.query(Team).filter(Team.name == payload.name.strip()).first()
    if existing_team:
        raise BadRequestException("Team name already exists")

    team = Team(
        name=payload.name.strip(),
        description=payload.description.strip() if payload.description else None,
        created_by=current_user_id,
    )
    try:
        db.add(team)
        db.commit()
        db.refresh(team)
    except SQLAlchemyError:
        db.rollback()
        raise

    _insert_membership(db, team.id, current_user_id, TeamRole.OWNER)

    return TeamResponse.model_validate(team).model_copy(update={"current_user_role": TeamRole.OWNER})


def get_user_teams(db: Session, current_user_id: int) -> list[TeamResponse]:
    rows = db.execute(
        select(Team, team_members.c.role)
        .join(team_members, team_members.c.team_id == Team.id)
        .where(team_members.c.user_id == current_user_id)
        .order_by(Team.created_at.desc(), Team.id.desc())
    ).all()

    teams: list[TeamResponse] = []
    for row in rows:
        team = TeamResponse.model_validate(row[0])
        teams.append(team.model_copy(update={"current_user_role": TeamRole(row.role)}))

    return teams


def get_team_members(db: Session, team_id: int, current_user_id: int) -> list[TeamMemberDetailResponse]:
    _get_team_or_404(db, team_id)
    require_team_member(db, team_id, current_user_id)

    rows = db.execute(
        select(
            team_members.c.id,
            team_members.c.team_id,
            team_members.c.user_id,
            team_members.c.role,
            team_members.c.joined_at,
            User.username,
            User.email,
            User.first_name,
            User.last_name,
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
            role=TeamRole(row.role),
            joined_at=row.joined_at,
        )
        for row in rows
    ]


def add_member(db: Session, team_id: int, payload: TeamMemberCreate, current_user_id: int) -> TeamMemberResponse:
    _get_team_or_404(db, team_id)
    require_team_owner(db, team_id, current_user_id)

    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise NotFoundException("User not found")

    existing_member = _get_membership(db, team_id, payload.user_id)
    if existing_member:
        raise BadRequestException("User is already a team member")

    return _insert_membership(db, team_id, payload.user_id, payload.role)


def invite_member(db: Session, team_id: int, payload: TeamMemberInvite, current_user_id: int) -> TeamMemberResponse:
    _get_team_or_404(db, team_id)
    require_team_owner(db, team_id, current_user_id)

    identifier = payload.identifier.strip()
    user = db.query(User).filter(or_(User.username == identifier, User.email == identifier)).first()
    if not user:
        raise NotFoundException("User not found. Use an existing username or email")

    existing_member = _get_membership(db, team_id, user.id)
    if existing_member:
        raise BadRequestException("User is already a team member")

    return _insert_membership(db, team_id, user.id, payload.role)


def ensure_user_in_team(db: Session, team_id: int, user_id: int) -> None:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("Assignee user not found")

    membership = _get_membership(db, team_id, user_id)
    if not membership:
        raise BadRequestException("User is not a member of this team")
