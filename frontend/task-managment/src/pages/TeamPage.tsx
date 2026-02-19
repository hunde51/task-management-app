import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { FormInput, FormSelect, FormTextArea } from "../components/ui/FormInput";
import { EmptyState, InlineNotice, LoadingState } from "../components/ui/StateBlock";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../hooks/useAuth";
import { useWorkspace } from "../hooks/useWorkspace";
import {
  createTeam,
  inviteTeamMember,
  listTeamMembers,
  type TeamMember,
  type TeamRole,
} from "../services/teamService";
import { formatDate } from "../utils/date";

export default function TeamPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { teams, loadingTeams, teamsError, refreshTeams, prependTeam } = useWorkspace();

  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState("");
  const [createError, setCreateError] = useState("");

  const [inviteIdentifier, setInviteIdentifier] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("member");
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteError, setInviteError] = useState("");

  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId) ?? null,
    [teams, selectedTeamId]
  );

  useEffect(() => {
    if (!teams.length) {
      setSelectedTeamId(null);
      return;
    }

    if (selectedTeamId && teams.some((team) => team.id === selectedTeamId)) return;
    setSelectedTeamId(teams[0].id);
  }, [teams, selectedTeamId]);

  useEffect(() => {
    if (!token || !selectedTeamId) {
      setMembers([]);
      setMembersError("");
      return;
    }

    const fetchMembers = async () => {
      setMembersLoading(true);
      setMembersError("");
      try {
        const response = await listTeamMembers(token, selectedTeamId);
        setMembers(response);
      } catch (error) {
        setMembersError(error instanceof Error ? error.message : "Failed to load team members");
      } finally {
        setMembersLoading(false);
      }
    };

    void fetchMembers();
  }, [token, selectedTeamId]);

  async function handleCreateTeam(event: FormEvent) {
    event.preventDefault();
    if (!token) return;

    setCreateError("");
    setCreateMessage("");

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setCreateError("Team name must be at least 2 characters");
      return;
    }

    setCreating(true);
    try {
      const team = await createTeam(token, {
        name: trimmedName,
        ...(description.trim() ? { description: description.trim() } : {}),
      });
      prependTeam(team);
      setSelectedTeamId(team.id);
      setName("");
      setDescription("");
      setCreateMessage("Team created successfully");
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Failed to create team");
    } finally {
      setCreating(false);
    }
  }

  async function handleInvite(event: FormEvent) {
    event.preventDefault();
    if (!token || !selectedTeamId) return;

    setInviteError("");
    setInviteMessage("");

    const identifier = inviteIdentifier.trim();
    if (identifier.length < 2) {
      setInviteError("Please enter a valid username or email");
      return;
    }

    setInviting(true);
    try {
      await inviteTeamMember(token, selectedTeamId, {
        identifier,
        role: inviteRole,
      });
      setInviteIdentifier("");
      setInviteRole("member");
      setInviteMessage("Member invited successfully");
      const response = await listTeamMembers(token, selectedTeamId);
      setMembers(response);
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : "Failed to invite member");
    } finally {
      setInviting(false);
    }
  }

  return (
    <MainLayout
      title="Teams"
      subtitle="Create teams, invite members, and manage ownership roles"
      onRefresh={() => {
        void refreshTeams();
      }}
    >
      <section className="teams-grid">
        <Card>
          <h3>Create Team</h3>
          <p className="ui-muted">A team owner can invite members and manage project-level assignments.</p>

          <form className="stack-form" onSubmit={handleCreateTeam}>
            <FormInput id="team-name" label="Team name" value={name} onChange={setName} required />
            <FormTextArea
              id="team-description"
              label="Description"
              value={description}
              onChange={setDescription}
              helperText="Optional summary of scope and responsibility"
            />

            {createError && <InlineNotice tone="error" message={createError} />}
            {createMessage && <InlineNotice tone="success" message={createMessage} />}

            <Button type="submit" disabled={creating}>
              {creating ? "Creating..." : "Create team"}
            </Button>
          </form>

          <div className="card-divider" />

          <h3>Invite Member</h3>
          {!selectedTeam && <p className="ui-muted">Select or create a team to invite members.</p>}
          {selectedTeam && (
            <form className="stack-form" onSubmit={handleInvite}>
              <FormInput
                id="invite-identifier"
                label="Username or email"
                value={inviteIdentifier}
                onChange={setInviteIdentifier}
                required
              />
              <FormSelect
                id="invite-role"
                label="Role"
                value={inviteRole}
                onChange={(value) => setInviteRole(value as TeamRole)}
                options={[
                  { label: "Member", value: "member" },
                  { label: "Owner", value: "owner" },
                ]}
              />

              {inviteError && <InlineNotice tone="error" message={inviteError} />}
              {inviteMessage && <InlineNotice tone="success" message={inviteMessage} />}

              <Button type="submit" disabled={inviting}>
                {inviting ? "Inviting..." : "Invite member"}
              </Button>
            </form>
          )}
        </Card>

        <Card>
          <div className="section-head">
            <h3>Teams</h3>
            {loadingTeams && <span className="ui-muted">Syncing...</span>}
          </div>

          {teamsError && <InlineNotice tone="error" message={teamsError} />}
          {!teamsError && loadingTeams && <LoadingState compact message="Loading teams" />}

          {!loadingTeams && !teams.length && (
            <EmptyState title="No teams yet" description="Create your first team using the form on the left." />
          )}

          {!!teams.length && (
            <ul className="list-grid">
              {teams.map((team) => (
                <li key={team.id} className={`team-item${selectedTeamId === team.id ? " team-item-active" : ""}`}>
                  <div className="team-item-content">
                    <button type="button" className="team-select" onClick={() => setSelectedTeamId(team.id)}>
                      <h4>{team.name}</h4>
                      <p>{team.description || "No description"}</p>
                      <small>Created {formatDate(team.created_at)}</small>
                    </button>
                    <div className="team-item-meta">
                      <Badge tone={team.current_user_role === "owner" ? "owner" : "member"}>
                        {team.current_user_role === "owner" ? "Owner" : "Member"}
                      </Badge>
                      <Button variant="secondary" size="sm" onClick={() => navigate(`/teams/${team.id}/projects`)}>
                        Open
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="card-divider" />

          <div className="section-head">
            <h3>Members</h3>
            {selectedTeam && selectedTeam.current_user_role && (
              <Badge tone={selectedTeam.current_user_role === "owner" ? "owner" : "member"}>
                Your role: {selectedTeam.current_user_role === "owner" ? "Owner" : "Member"}
              </Badge>
            )}
          </div>

          {!selectedTeam && <p className="ui-muted">Select a team to view members.</p>}
          {selectedTeam && membersLoading && <LoadingState compact message="Loading members" />}
          {selectedTeam && membersError && <InlineNotice tone="error" message={membersError} />}
          {selectedTeam && !membersLoading && !membersError && !members.length && (
            <EmptyState title="No members" description="Invite members to start collaborating." />
          )}

          {selectedTeam && !membersLoading && !membersError && !!members.length && (
            <ul className="member-list">
              {members.map((member) => (
                <li key={member.id}>
                  <div>
                    <p>
                      {member.first_name} {member.last_name}
                    </p>
                    <small>
                      @{member.username} · {member.email}
                    </small>
                  </div>
                  <Badge tone={member.role === "owner" ? "owner" : "member"}>
                    {member.role === "owner" ? "Owner" : "Member"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </MainLayout>
  );
}
