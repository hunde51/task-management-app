import { getToken } from "../lib/auth";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export type Team = {
  id: number;
  name: string;
  description: string | null;
  created_by: number;
  created_at: string;
  updated_at: string | null;
};

export type TeamCreateInput = {
  name: string;
  description?: string;
};

export type TeamRole = "owner" | "member";

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

export type TeamMembership = {
  id: number;
  team_id: number;
  user_id: number;
  role: TeamRole;
  joined_at: string;
};

export type TeamMemberInviteInput = {
  identifier: string;
  role?: TeamRole;
};

type ApiError = {
  detail?: string | Array<{ msg?: string }>;
};

function readErrorMessage(data: ApiError, fallback: string): string {
  if (Array.isArray(data.detail)) return data.detail[0]?.msg ?? fallback;
  if (typeof data.detail === "string") return data.detail;
  return fallback;
}

async function request<T>(path: string, init: RequestInit = {}, fallbackError = "Request failed"): Promise<T> {
  const token = getToken();
  if (!token) throw new Error("You are not signed in");

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...init.headers,
  };

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch {
    throw new Error(
      "Cannot reach server. Is the backend running? Start it with: uvicorn app.main:app --reload (in the backend folder)"
    );
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({} as ApiError));
    throw new Error(readErrorMessage(data, fallbackError));
  }

  return res.json() as Promise<T>;
}

export function getTeams(): Promise<Team[]> {
  return request<Team[]>("/teams/", {}, "Failed to load teams");
}

export function createTeam(input: TeamCreateInput): Promise<Team> {
  return request<Team>(
    "/teams/",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    "Failed to create team"
  );
}

export function getTeamMembers(teamId: number): Promise<TeamMember[]> {
  return request<TeamMember[]>(`/teams/${teamId}/members`, {}, "Failed to load team members");
}

export function inviteTeamMember(teamId: number, input: TeamMemberInviteInput): Promise<TeamMembership> {
  return request<TeamMembership>(
    `/teams/${teamId}/members/invite`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    "Failed to invite member"
  );
}
