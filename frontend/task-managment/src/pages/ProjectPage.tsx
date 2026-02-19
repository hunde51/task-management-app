import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import TaskBoard from "../components/task/TaskBoard";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { FormInput, FormSelect, FormTextArea } from "../components/ui/FormInput";
import Modal from "../components/ui/Modal";
import { EmptyState, InlineNotice, LoadingState } from "../components/ui/StateBlock";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../hooks/useAuth";
import { useWorkspace } from "../hooks/useWorkspace";
import {
  createProject,
  deleteProject,
  listProjects,
  updateProject,
  type Project,
} from "../services/projectService";
import {
  assignTask,
  createTask,
  deleteTask,
  listTasks,
  updateTask,
  updateTaskStatus,
  type Task,
  type TaskStatus,
} from "../services/taskService";
import { listTeamMembers, type TeamMember } from "../services/teamService";
import { formatDateTime } from "../utils/date";

function toDateInput(value: string | null): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function fromDateInput(value: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

type TaskModalState = {
  open: boolean;
  mode: "create" | "edit";
  task: Task | null;
};

export default function ProjectPage() {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const parsedTeamId = Number(teamId);

  const { token } = useAuth();
  const { teams } = useWorkspace();

  const currentTeam = teams.find((team) => team.id === parsedTeamId) ?? null;

  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [pageError, setPageError] = useState("");

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const [taskModal, setTaskModal] = useState<TaskModalState>({ open: false, mode: "create", task: null });
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("todo");
  const [taskAssigneeId, setTaskAssigneeId] = useState<string>("");
  const [savingTask, setSavingTask] = useState(false);

  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const [actionMessage, setActionMessage] = useState("");

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const canAssignTasks = useMemo(() => {
    if (!selectedProject || !currentTeam) return false;
    return selectedProject.can_delete || currentTeam.current_user_role === "owner";
  }, [selectedProject, currentTeam]);

  const loadTeamData = useCallback(async () => {
    if (!token || !Number.isInteger(parsedTeamId) || parsedTeamId <= 0) return;

    setLoadingPage(true);
    setPageError("");

    try {
      const [projectResponse, memberResponse] = await Promise.all([
        listProjects(token, parsedTeamId),
        listTeamMembers(token, parsedTeamId),
      ]);

      setProjects(projectResponse);
      setMembers(memberResponse);
      setSelectedProjectId((prev) => {
        if (!projectResponse.length) return null;
        if (prev && projectResponse.some((project) => project.id === prev)) return prev;
        return projectResponse[0].id;
      });
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to load project workspace");
    } finally {
      setLoadingPage(false);
    }
  }, [token, parsedTeamId]);

  const loadProjectTasks = useCallback(async () => {
    if (!token || !selectedProjectId) {
      setTasks([]);
      return;
    }

    setLoadingTasks(true);
    setPageError("");
    try {
      const response = await listTasks(token, { projectId: selectedProjectId });
      setTasks(response);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to load tasks");
    } finally {
      setLoadingTasks(false);
    }
  }, [token, selectedProjectId]);

  useEffect(() => {
    if (!Number.isInteger(parsedTeamId) || parsedTeamId <= 0) {
      setPageError("Invalid team id in URL");
      setLoadingPage(false);
      return;
    }

    void loadTeamData();
  }, [parsedTeamId, loadTeamData]);

  useEffect(() => {
    void loadProjectTasks();
  }, [loadProjectTasks]);

  function resetTaskForm() {
    setTaskTitle("");
    setTaskDescription("");
    setTaskDueDate("");
    setTaskStatus("todo");
    setTaskAssigneeId("");
  }

  function openCreateTask() {
    resetTaskForm();
    setTaskModal({ open: true, mode: "create", task: null });
  }

  function openEditTask(task: Task) {
    setTaskTitle(task.title);
    setTaskDescription(task.description || "");
    setTaskDueDate(toDateInput(task.due_date));
    setTaskStatus(task.status);
    setTaskAssigneeId(task.assigned_user_id ? String(task.assigned_user_id) : "");
    setTaskModal({ open: true, mode: "edit", task });
  }

  async function handleCreateProject(event: FormEvent) {
    event.preventDefault();
    if (!token) return;

    const trimmedName = projectName.trim();
    if (trimmedName.length < 2) {
      setPageError("Project name must be at least 2 characters");
      return;
    }

    setCreatingProject(true);
    setPageError("");

    try {
      const created = await createProject(token, parsedTeamId, {
        name: trimmedName,
        ...(projectDescription.trim() ? { description: projectDescription.trim() } : {}),
      });
      setProjects((current) => [created, ...current]);
      setSelectedProjectId(created.id);
      setProjectName("");
      setProjectDescription("");
      setActionMessage("Project created");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to create project");
    } finally {
      setCreatingProject(false);
    }
  }

  async function handleSaveProjectEdit() {
    if (!token || !editingProject) return;

    const trimmedName = projectName.trim();
    if (trimmedName.length < 2) {
      setPageError("Project name must be at least 2 characters");
      return;
    }

    try {
      const updated = await updateProject(token, editingProject.id, {
        name: trimmedName,
        description: projectDescription.trim(),
      });

      setProjects((current) => current.map((project) => (project.id === updated.id ? updated : project)));
      setEditingProject(null);
      setProjectName("");
      setProjectDescription("");
      setActionMessage("Project updated");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to update project");
    }
  }

  async function handleConfirmDeleteProject() {
    if (!token || !deletingProject) return;

    try {
      await deleteProject(token, deletingProject.id);
      setProjects((current) => current.filter((project) => project.id !== deletingProject.id));
      setSelectedProjectId((current) => (current === deletingProject.id ? null : current));
      setDeletingProject(null);
      setActionMessage("Project deleted");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to delete project");
    }
  }

  async function handleTaskSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token || !selectedProjectId) return;

    const trimmedTitle = taskTitle.trim();
    if (trimmedTitle.length < 2) {
      setPageError("Task title must be at least 2 characters");
      return;
    }

    setSavingTask(true);
    setPageError("");

    try {
      const dueDate = fromDateInput(taskDueDate);
      const assignee = taskAssigneeId ? Number(taskAssigneeId) : null;

      if (taskModal.mode === "create") {
        const created = await createTask(token, {
          project_id: selectedProjectId,
          title: trimmedTitle,
          description: taskDescription.trim(),
          due_date: dueDate,
          assigned_user_id: assignee,
        });
        setTasks((current) => [created, ...current]);
        setActionMessage("Task created");
      }

      if (taskModal.mode === "edit" && taskModal.task) {
        const original = taskModal.task;

        let updated = await updateTask(token, original.id, {
          title: trimmedTitle,
          description: taskDescription.trim(),
          due_date: dueDate,
        });

        if (taskStatus !== original.status) {
          updated = await updateTaskStatus(token, original.id, taskStatus);
        }

        if (assignee !== original.assigned_user_id) {
          updated = await assignTask(token, original.id, assignee);
        }

        setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setActionMessage("Task updated");
      }

      setTaskModal({ open: false, mode: "create", task: null });
      resetTaskForm();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to save task");
    } finally {
      setSavingTask(false);
    }
  }

  async function handleTaskStatusChange(taskId: number, status: TaskStatus) {
    if (!token) return;

    try {
      const updated = await updateTaskStatus(token, taskId, status);
      setTasks((current) => current.map((task) => (task.id === updated.id ? updated : task)));
      setActionMessage("Task status updated");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to update status");
    }
  }

  async function handleTaskAssign(taskId: number, userId: number | null) {
    if (!token) return;

    try {
      const updated = await assignTask(token, taskId, userId);
      setTasks((current) => current.map((task) => (task.id === updated.id ? updated : task)));
      setActionMessage("Task assignment updated");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to assign task");
    }
  }

  async function handleConfirmDeleteTask() {
    if (!token || !deletingTask) return;

    try {
      await deleteTask(token, deletingTask.id);
      setTasks((current) => current.filter((task) => task.id !== deletingTask.id));
      setDeletingTask(null);
      setActionMessage("Task deleted");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to delete task");
    }
  }

  if (!Number.isInteger(parsedTeamId) || parsedTeamId <= 0) {
    return (
      <MainLayout title="Projects" subtitle="Invalid team route">
        <InlineNotice tone="error" message="Invalid team id in URL" />
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title={currentTeam ? `${currentTeam.name} · Projects` : "Projects"}
      subtitle="Project CRUD, task board workflow, assignment and status controls"
      onRefresh={() => {
        void loadTeamData();
        void loadProjectTasks();
      }}
      actions={
        <Button variant="secondary" size="sm" onClick={() => navigate("/teams")}>
          Back to teams
        </Button>
      }
    >
      <section className="projects-grid">
        <Card>
          <h3>{editingProject ? "Edit project" : "Create project"}</h3>
          <form className="stack-form" onSubmit={editingProject ? (event) => event.preventDefault() : handleCreateProject}>
            <FormInput id="project-name" label="Project name" value={projectName} onChange={setProjectName} required />
            <FormTextArea
              id="project-description"
              label="Description"
              value={projectDescription}
              onChange={setProjectDescription}
            />

            {!editingProject && (
              <Button type="submit" disabled={creatingProject}>
                {creatingProject ? "Creating..." : "Create project"}
              </Button>
            )}

            {editingProject && (
              <div className="button-row">
                <Button onClick={() => void handleSaveProjectEdit()}>Save project</Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingProject(null);
                    setProjectName("");
                    setProjectDescription("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </form>

          <div className="card-divider" />

          <div className="section-head">
            <h3>Projects</h3>
            {currentTeam && currentTeam.current_user_role && (
              <Badge tone={currentTeam.current_user_role === "owner" ? "owner" : "member"}>
                {currentTeam.current_user_role === "owner" ? "Owner" : "Member"}
              </Badge>
            )}
          </div>

          {loadingPage && <LoadingState compact message="Loading projects" />}
          {!loadingPage && !projects.length && (
            <EmptyState title="No projects yet" description="Create the first project to unlock task board features." />
          )}

          {!!projects.length && (
            <ul className="project-list">
              {projects.map((project) => (
                <li key={project.id} className={selectedProjectId === project.id ? "project-item-active" : ""}>
                  <div className="project-item-main">
                    <button type="button" className="project-select" onClick={() => setSelectedProjectId(project.id)}>
                      <h4>{project.name}</h4>
                      <p>{project.description || "No description"}</p>
                      <small>Updated {formatDateTime(project.updated_at || project.created_at)}</small>
                    </button>
                    <div className="project-actions">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingProject(project);
                          setProjectName(project.name);
                          setProjectDescription(project.description || "");
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeletingProject(project)}
                        disabled={!project.can_delete}
                        title={project.can_delete ? "" : "Not allowed"}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="section-head">
            <h3>Task board</h3>
            <Button onClick={openCreateTask} disabled={!selectedProjectId}>
              New task
            </Button>
          </div>

          {!selectedProject && <p className="ui-muted">Select a project to manage tasks.</p>}
          {selectedProject && (
            <div className="task-project-meta">
              <p>
                Active project: <strong>{selectedProject.name}</strong>
              </p>
              <p className="ui-muted">Assignments are restricted to owners. Unauthorized actions show "Not allowed".</p>
            </div>
          )}

          {loadingTasks && <LoadingState compact message="Loading tasks" />}

          {!loadingTasks && selectedProject && !tasks.length && (
            <EmptyState title="No tasks" description="Create tasks to start planning work." />
          )}

          {!loadingTasks && !!tasks.length && selectedProject && (
            <TaskBoard
              tasks={tasks}
              members={members}
              canAssign={canAssignTasks}
              onStatusChange={handleTaskStatusChange}
              onAssign={handleTaskAssign}
              onEdit={openEditTask}
              onDelete={setDeletingTask}
            />
          )}
        </Card>
      </section>

      {actionMessage && <InlineNotice tone="success" message={actionMessage} />}
      {pageError && <InlineNotice tone="error" message={pageError} />}

      <Modal
        open={taskModal.open}
        title={taskModal.mode === "create" ? "Create task" : "Edit task"}
        description="Set scope, due date, status, and assignee"
        onClose={() => setTaskModal({ open: false, mode: "create", task: null })}
      >
        <form className="stack-form" onSubmit={handleTaskSubmit}>
          <FormInput id="task-title" label="Title" value={taskTitle} onChange={setTaskTitle} required />
          <FormTextArea id="task-description" label="Description" value={taskDescription} onChange={setTaskDescription} />

          <FormInput
            id="task-due-date"
            label="Due date"
            type="datetime-local"
            value={taskDueDate}
            onChange={setTaskDueDate}
          />

          <FormSelect
            id="task-status"
            label="Status"
            value={taskStatus}
            onChange={(value) => setTaskStatus(value as TaskStatus)}
            options={[
              { value: "todo", label: "To do" },
              { value: "in-progress", label: "In progress" },
              { value: "done", label: "Done" },
            ]}
            disabled={taskModal.mode === "edit" && !taskModal.task?.can_update}
            helperText={taskModal.mode === "edit" && !taskModal.task?.can_update ? "Not allowed" : undefined}
          />

          <FormSelect
            id="task-assignee"
            label="Assignee"
            value={taskAssigneeId}
            onChange={setTaskAssigneeId}
            options={[
              { value: "", label: "Unassigned" },
              ...members.map((member) => ({
                value: member.user_id,
                label: `${member.first_name} ${member.last_name}`,
              })),
            ]}
            disabled={!canAssignTasks && taskModal.mode === "edit"}
            helperText={!canAssignTasks && taskModal.mode === "edit" ? "Not allowed" : undefined}
          />

          <Button type="submit" disabled={savingTask}>
            {savingTask ? "Saving..." : taskModal.mode === "create" ? "Create task" : "Save task"}
          </Button>
        </form>
      </Modal>

      <Modal
        open={Boolean(deletingProject)}
        title="Delete project"
        description="This action cannot be undone. All tasks under this project will be removed."
        onClose={() => setDeletingProject(null)}
        footer={
          <div className="button-row">
            <Button variant="danger" onClick={() => void handleConfirmDeleteProject()}>
              Confirm delete
            </Button>
            <Button variant="ghost" onClick={() => setDeletingProject(null)}>
              Cancel
            </Button>
          </div>
        }
      >
        <p>
          You are deleting <strong>{deletingProject?.name}</strong>.
        </p>
      </Modal>

      <Modal
        open={Boolean(deletingTask)}
        title="Delete task"
        description="This action cannot be undone."
        onClose={() => setDeletingTask(null)}
        footer={
          <div className="button-row">
            <Button variant="danger" onClick={() => void handleConfirmDeleteTask()}>
              Confirm delete
            </Button>
            <Button variant="ghost" onClick={() => setDeletingTask(null)}>
              Cancel
            </Button>
          </div>
        }
      >
        <p>
          You are deleting <strong>{deletingTask?.title}</strong>.
        </p>
      </Modal>
    </MainLayout>
  );
}
