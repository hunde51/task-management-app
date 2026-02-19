import { httpRequest } from "./http";

export type TeamRole = "owner" | "member";

export type Team = {
  id: number;
  name: string;
  description: string | null;
  created_by: number;
  created_at: string;
  updated_at: string | null;
  current_user_role: TeamRole | null;
};

export type TeamMember = {
  id: number;
  team_id: number;
  user_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: TeamRole;
  joined_at: string;
};

export type CreateTeamInput = {
  name: string;
  description?: string;
};

export type InviteMemberInput = {
  identifier: string;
  role: TeamRole;
};

export async function listTeams(token: string): Promise<Team[]> {
  return httpRequest<Team[]>("/teams/", {
    token,
    fallbackError: "Failed to load teams",
  });
}

export async function createTeam(token: string, input: CreateTeamInput): Promise<Team> {
  return httpRequest<Team>("/teams/", {
    method: "POST",
    token,
    body: input,
    fallbackError: "Failed to create team",
  });
}

export async function listTeamMembers(token: string, teamId: number): Promise<TeamMember[]> {
  return httpRequest<TeamMember[]>(`/teams/${teamId}/members`, {
    token,
    fallbackError: "Failed to load team members",
  });
}

export async function inviteTeamMember(token: string, teamId: number, input: InviteMemberInput): Promise<TeamMember> {
  return httpRequest<TeamMember>(`/teams/${teamId}/members/invite`, {
    method: "POST",
    token,
    body: input,
    fallbackError: "Failed to invite member",
  });
}
