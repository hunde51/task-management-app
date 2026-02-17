import { getToken } from "../lib/auth";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export type Project = {
  id: number;
  team_id: number;
  name: string;
  description: string | null;
  created_by: number;
  created_at: string;
  updated_at: string | null;
};

export type ProjectCreateInput = {
  name: string;
  description?: string;
};

export type ProjectUpdateInput = {
  name?: string;
  description?: string;
};

type ApiError = {
  detail?: string | Array<{ msg?: string }>;
};

function readErrorMessage(data: ApiError, fallback: string): string {
  if (Array.isArray(data.detail)) return data.detail[0]?.msg ?? fallback;
  if (typeof data.detail === "string") return data.detail;
  return fallback;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  fallbackError = "Request failed"
): Promise<T> {
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

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function getTeamProjects(teamId: number): Promise<Project[]> {
  return request<Project[]>(`/teams/${teamId}/projects`, {}, "Failed to load projects");
}

export function createProject(teamId: number, input: ProjectCreateInput): Promise<Project> {
  return request<Project>(
    `/teams/${teamId}/projects`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    "Failed to create project"
  );
}

export function updateProject(projectId: number, input: ProjectUpdateInput): Promise<Project> {
  return request<Project>(
    `/projects/${projectId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
    "Failed to update project"
  );
}

export function deleteProject(projectId: number): Promise<void> {
  return request<void>(
    `/projects/${projectId}`,
    {
      method: "DELETE",
    },
    "Failed to delete project"
  );
}
