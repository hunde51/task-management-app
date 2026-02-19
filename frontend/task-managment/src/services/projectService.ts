import { httpRequest } from "./http";

export type Project = {
  id: number;
  team_id: number;
  name: string;
  description: string | null;
  created_by: number;
  created_at: string;
  updated_at: string | null;
  can_delete: boolean;
};

export type ProjectInput = {
  name: string;
  description?: string;
};

export async function listProjects(token: string, teamId: number): Promise<Project[]> {
  return httpRequest<Project[]>(`/teams/${teamId}/projects`, {
    token,
    fallbackError: "Failed to load projects",
  });
}

export async function createProject(token: string, teamId: number, input: ProjectInput): Promise<Project> {
  return httpRequest<Project>(`/teams/${teamId}/projects`, {
    method: "POST",
    token,
    body: input,
    fallbackError: "Failed to create project",
  });
}

export async function updateProject(token: string, projectId: number, input: ProjectInput): Promise<Project> {
  return httpRequest<Project>(`/projects/${projectId}`, {
    method: "PATCH",
    token,
    body: input,
    fallbackError: "Failed to update project",
  });
}

export async function deleteProject(token: string, projectId: number): Promise<void> {
  return httpRequest<void>(`/projects/${projectId}`, {
    method: "DELETE",
    token,
    fallbackError: "Failed to delete project",
  });
}
