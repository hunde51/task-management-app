import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createTeam,
  getTeamMembers,
  getTeams,
  inviteTeamMember,
  type Team,
  type TeamMember,
  type TeamRole,
} from "../api/teamApi";
import { useAuth } from "../contexts/AuthContext";
import "../styles/team-ui.css";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return dateFormatter.format(date);
}

export default function TeamPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteIdentifier, setInviteIdentifier] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("member");

  const [listLoading, setListLoading] = useState(true);
  const [submittingTeam, setSubmittingTeam] = useState(false);
  const [invitingMember, setInvitingMember] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);

  const [listError, setListError] = useState("");
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [membersError, setMembersError] = useState("");

  const { logout } = useAuth();
  const navigate = useNavigate();

  async function loadTeams() {
    setListError("");
    setListLoading(true);
    try {
      const result = await getTeams();
      setTeams(result);
      setSelectedTeamId((prev) => {
        if (result.length === 0) return null;
        if (prev && result.some((team) => team.id === prev)) return prev;
        return result[0].id;
      });
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load teams");
    } finally {
      setListLoading(false);
    }
  }

  async function loadMembers(teamId: number) {
    setMembersError("");
    setMembersLoading(true);
    try {
      const result = await getTeamMembers(teamId);
      setMembers(result);
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : "Failed to load team members");
    } finally {
      setMembersLoading(false);
    }
  }

  useEffect(() => {
    void loadTeams();
  }, []);

  useEffect(() => {
    if (selectedTeamId === null) {
      setMembers([]);
      setMembersError("");
      return;
    }
    void loadMembers(selectedTeamId);
  }, [selectedTeamId]);

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    const teamName = name.trim();
    const teamDescription = description.trim();

    if (teamName.length < 2) {
      setCreateError("Team name must be at least 2 characters.");
      return;
    }

    setSubmittingTeam(true);
    setCreateError("");
    setCreateSuccess("");
    try {
      const team = await createTeam({
        name: teamName,
        ...(teamDescription ? { description: teamDescription } : {}),
      });
      setTeams((prev) => [team, ...prev]);
      setSelectedTeamId(team.id);
      setName("");
      setDescription("");
      setCreateSuccess("Team created.");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      setSubmittingTeam(false);
    }
  }

  async function handleInviteMember(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTeamId) {
      setInviteError("Select a team first.");
      return;
    }

    const identifier = inviteIdentifier.trim();
    if (identifier.length < 2) {
      setInviteError("Use a valid username or email.");
      return;
    }

    setInvitingMember(true);
    setInviteError("");
    setInviteSuccess("");
    try {
      await inviteTeamMember(selectedTeamId, { identifier, role: inviteRole });
      setInviteIdentifier("");
      setInviteSuccess("Member invited.");
      await loadMembers(selectedTeamId);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to invite member");
    } finally {
      setInvitingMember(false);
    }
  }

  return (
    <div className="tm-shell">
      <span className="tm-glow tm-glow-one" />
      <span className="tm-glow tm-glow-two" />
      <div className="tm-container">
        <header className="tm-header">
          <div>
            <p className="tm-brand">Task Management</p>
            <h1 className="tm-title">Teams</h1>
            <p className="tm-subtitle">Build teams, invite people, and launch projects.</p>
          </div>
          <div className="tm-header-actions">
            <button type="button" className="tm-ghost-btn" onClick={() => navigate("/")}>
              Dashboard
            </button>
            <button type="button" className="tm-ghost-btn" onClick={logout}>
              Sign out
            </button>
          </div>
        </header>

        <main className="tm-grid">
          <section className="tm-card">
            <h2 className="tm-section-title">Create Team</h2>
            <p className="tm-section-text">Start with a clear name, then invite members and launch projects.</p>
            <form onSubmit={handleCreateTeam} className="tm-form">
              <label className="tm-label" htmlFor="team-name">
                Team name
              </label>
              <input
                id="team-name"
                className="tm-input"
                type="text"
                placeholder="Product Engineering"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <label className="tm-label" htmlFor="team-description">
                Description
              </label>
              <textarea
                id="team-description"
                className="tm-textarea"
                placeholder="What this team owns..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {createError && <p className="tm-alert tm-alert-error">{createError}</p>}
              {createSuccess && <p className="tm-alert tm-alert-success">{createSuccess}</p>}

              <button type="submit" className="tm-primary-btn" disabled={submittingTeam}>
                {submittingTeam ? "Creating..." : "Create team"}
              </button>
            </form>

            <hr className="tm-divider" />

            <h3 className="tm-subsection-title">Invite Member</h3>
            {teams.length === 0 && <p className="tm-section-text">Create a team first to invite members.</p>}

            {teams.length > 0 && (
              <form onSubmit={handleInviteMember} className="tm-form">
                <label className="tm-label" htmlFor="invite-team">
                  Team
                </label>
                <select
                  id="invite-team"
                  className="tm-select"
                  value={selectedTeamId ?? ""}
                  onChange={(e) => setSelectedTeamId(Number(e.target.value))}
                >
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>

                <label className="tm-label" htmlFor="invite-identifier">
                  Username or email
                </label>
                <input
                  id="invite-identifier"
                  className="tm-input"
                  type="text"
                  placeholder="alex or alex@company.com"
                  value={inviteIdentifier}
                  onChange={(e) => setInviteIdentifier(e.target.value)}
                  required
                />

                <label className="tm-label" htmlFor="invite-role">
                  Role
                </label>
                <select
                  id="invite-role"
                  className="tm-select"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TeamRole)}
                >
                  <option value="member">Member</option>
                  <option value="owner">Owner</option>
                </select>

                {inviteError && <p className="tm-alert tm-alert-error">{inviteError}</p>}
                {inviteSuccess && <p className="tm-alert tm-alert-success">{inviteSuccess}</p>}

                <button type="submit" className="tm-primary-btn" disabled={invitingMember}>
                  {invitingMember ? "Inviting..." : "Invite member"}
                </button>
              </form>
            )}

            <div className="tm-members-panel">
              <div className="tm-members-header">
                <h3 className="tm-subsection-title">Team Members</h3>
                {membersLoading && <span className="tm-muted">Loading...</span>}
              </div>
              {membersError && <p className="tm-alert tm-alert-error">{membersError}</p>}
              {!membersLoading && !membersError && selectedTeamId === null && (
                <p className="tm-section-text">No selected team.</p>
              )}
              {!membersLoading && !membersError && selectedTeamId !== null && members.length === 0 && (
                <p className="tm-section-text">No members in this team yet.</p>
              )}
              {!membersLoading && !membersError && members.length > 0 && (
                <ul className="tm-member-list">
                  {members.map((member) => (
                    <li key={member.id} className="tm-member-item">
                      <div>
                        <p className="tm-member-name">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="tm-member-email">@{member.username} · {member.email}</p>
                      </div>
                      <span className="tm-role-chip">{member.role}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="tm-card">
            <div className="tm-list-header">
              <h2 className="tm-section-title">Your team list</h2>
              <button type="button" className="tm-ghost-btn" onClick={() => void loadTeams()} disabled={listLoading}>
                {listLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {listError && <p className="tm-alert tm-alert-error">{listError}</p>}
            {listLoading && <p className="tm-section-text">Loading teams...</p>}

            {!listLoading && !listError && teams.length === 0 && (
              <div className="tm-empty">
                <p>No teams yet.</p>
                <p>Create your first team from the form.</p>
              </div>
            )}

            {!listLoading && !listError && teams.length > 0 && (
              <ul className="tm-list">
                {teams.map((team) => (
                  <li className="tm-team-item" key={team.id}>
                    <div>
                      <h3>{team.name}</h3>
                      <p>{team.description?.trim() || "No description provided."}</p>
                    </div>
                    <div className="tm-team-meta">
                      <time>{formatDate(team.created_at)}</time>
                      <button
                        type="button"
                        className="tm-ghost-btn tm-small-btn"
                        onClick={() => navigate(`/teams/${team.id}/projects`)}
                      >
                        Open projects
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
