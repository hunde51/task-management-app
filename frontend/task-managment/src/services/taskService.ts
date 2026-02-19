import { buildQuery, httpRequest } from "./http";

export type TaskStatus = "todo" | "in-progress" | "done";

export type Task = {
  id: number;
  project_id: number;
  project_name: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  due_date: string | null;
  assigned_user_id: number | null;
  assigned_username: string | null;
  assigned_first_name: string | null;
  assigned_last_name: string | null;
  created_by: number;
  created_at: string;
  updated_at: string | null;
  can_update: boolean;
};

export type TaskCreateInput = {
  project_id: number;
  title: string;
  description?: string;
  assigned_user_id?: number | null;
  due_date?: string | null;
};

export type TaskUpdateInput = {
  title?: string;
  description?: string;
  due_date?: string | null;
};

export type TaskSummary = {
  tasks: Task[];
  status_counts: Record<TaskStatus, number>;
  total_projects: number;
};

export async function listTasks(
  token: string,
  filters: { projectId?: number; status?: TaskStatus; assignedUserId?: number } = {}
): Promise<Task[]> {
  const query = buildQuery({
    project_id: filters.projectId,
    status: filters.status,
    assigned_user_id: filters.assignedUserId,
  });

  return httpRequest<Task[]>(`/tasks/${query}`, {
    token,
    fallbackError: "Failed to load tasks",
  });
}

export async function createTask(token: string, input: TaskCreateInput): Promise<Task> {
  return httpRequest<Task>("/tasks/", {
    method: "POST",
    token,
    body: input,
    fallbackError: "Failed to create task",
  });
}

export async function updateTask(token: string, taskId: number, input: TaskUpdateInput): Promise<Task> {
  return httpRequest<Task>(`/tasks/${taskId}`, {
    method: "PATCH",
    token,
    body: input,
    fallbackError: "Failed to update task",
  });
}

export async function updateTaskStatus(token: string, taskId: number, status: TaskStatus): Promise<Task> {
  return httpRequest<Task>(`/tasks/${taskId}/status`, {
    method: "PATCH",
    token,
    body: { status },
    fallbackError: "Failed to update task status",
  });
}

export async function assignTask(token: string, taskId: number, assignedUserId: number | null): Promise<Task> {
  return httpRequest<Task>(`/tasks/${taskId}/assign`, {
    method: "PATCH",
    token,
    body: { assigned_user_id: assignedUserId },
    fallbackError: "Failed to assign task",
  });
}

export async function deleteTask(token: string, taskId: number): Promise<void> {
  return httpRequest<void>(`/tasks/${taskId}`, {
    method: "DELETE",
    token,
    fallbackError: "Failed to delete task",
  });
}

export async function getMyTaskSummary(token: string): Promise<TaskSummary> {
  return httpRequest<TaskSummary>("/tasks/me/summary", {
    token,
    fallbackError: "Failed to load my task summary",
  });
}
