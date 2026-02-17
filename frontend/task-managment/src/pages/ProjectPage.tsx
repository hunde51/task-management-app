import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createProject,
  deleteProject,
  getTeamProjects,
  updateProject,
  type Project,
} from "../api/projectApi";
import { getTeams, type Team } from "../api/teamApi";
import { useAuth } from "../contexts/AuthContext";
import "../styles/project-ui.css";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

type MetricPoint = {
  label: string;
  value: number;
};

type MiniChartColor = "blue" | "red" | "navy";

type RoadmapItem = {
  key: string;
  title: string;
  note: string;
  active?: boolean;
};

function formatDate(value: string | null): string {
  if (!value) return "No update yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return dateFormatter.format(date);
}

function buildSparkline(data: MetricPoint[]) {
  const width = 260;
  const height = 86;
  const paddingX = 10;
  const paddingY = 12;
  const plotWidth = width - paddingX * 2;
  const plotHeight = height - paddingY * 2;
  const maxValue = Math.max(1, ...data.map((item) => item.value));
  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0;

  const points = data.map((item, index) => ({
    ...item,
    x: paddingX + index * stepX,
    y: paddingY + (1 - item.value / maxValue) * plotHeight,
  }));

  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const baseY = height - paddingY;
  const areaPath = `${path} L ${points[points.length - 1]?.x ?? paddingX} ${baseY} L ${points[0]?.x ?? paddingX} ${baseY} Z`;

  return { width, height, paddingX, baseY, points, path, areaPath };
}

function MiniLineChart({ data, color }: { data: MetricPoint[]; color: MiniChartColor }) {
  const geometry = useMemo(() => buildSparkline(data), [data]);
  const colorSuffix = color === "red" ? "red" : color === "navy" ? "navy" : "blue";

  return (
    <svg className="pj-mini-chart" viewBox={`0 0 ${geometry.width} ${geometry.height}`} role="img" aria-label="Metric trend line chart">
      <line
        className="pj-mini-grid"
        x1={geometry.paddingX}
        y1={geometry.baseY}
        x2={geometry.width - geometry.paddingX}
        y2={geometry.baseY}
      />
      <path d={geometry.areaPath} className={`pj-mini-area pj-mini-area-${colorSuffix}`} />
      <path d={geometry.path} className={`pj-mini-path pj-mini-path-${colorSuffix}`} />
      {geometry.points.map((point) => (
        <circle
          key={`${point.label}-${point.value}`}
          cx={point.x}
          cy={point.y}
          r="3.4"
          className={`pj-mini-dot pj-mini-dot-${colorSuffix}`}
        />
      ))}
    </svg>
  );
}

const appNav: RoadmapItem[] = [
  {
    key: "dashboard",
    title: "Dashboard Overview",
    note: "Live project and task insights",
    active: true,
  },
  {
    key: "teams",
    title: "Teams",
    note: "Team creation, invites, and members",
  },
  {
    key: "projects",
    title: "Projects",
    note: "Create, list, edit, and delete projects",
  },
  {
    key: "tasks",
    title: "Task Board",
    note: "Task CRUD, status flow, assignment",
  },
  {
    key: "my-tasks",
    title: "My Tasks Dashboard",
    note: "Tasks assigned to current user",
  },
  {
    key: "members",
    title: "Members",
    note: "People directory and workload view",
  },
  {
    key: "roles",
    title: "Access & Roles",
    note: "Permission and ownership management",
  },
  {
    key: "reports",
    title: "Reports & Analytics",
    note: "Progress, trends, and delivery metrics",
  },
  {
    key: "settings",
    title: "Settings",
    note: "Workspace preferences and profile",
  },
];

export default function ProjectPage() {
  const { teamId } = useParams();
  const parsedTeamId = Number(teamId);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [team, setTeam] = useState<Team | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(null);

  const stats = useMemo(() => {
    const total = projects.length;
    const withDescription = projects.filter((project) => Boolean(project.description?.trim())).length;
    const recentlyUpdated = projects.filter((project) => Boolean(project.updated_at)).length;
    return { total, withDescription, recentlyUpdated };
  }, [projects]);

  const monthlyMetrics = useMemo(() => {
    const months = 6;
    const now = new Date();
    const buckets = Array.from({ length: months }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleDateString(undefined, { month: "short" }),
        createdCount: 0,
        documentedCreatedCount: 0,
        updatedCount: 0,
      };
    });

    const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

    projects.forEach((project) => {
      const created = new Date(project.created_at);
      if (!Number.isNaN(created.getTime())) {
        const createdKey = `${created.getFullYear()}-${created.getMonth()}`;
        const createdBucket = bucketMap.get(createdKey);
        if (createdBucket) {
          createdBucket.createdCount += 1;
          if (project.description?.trim()) createdBucket.documentedCreatedCount += 1;
        }
      }

      if (project.updated_at) {
        const updated = new Date(project.updated_at);
        if (!Number.isNaN(updated.getTime())) {
          const updatedKey = `${updated.getFullYear()}-${updated.getMonth()}`;
          const updatedBucket = bucketMap.get(updatedKey);
          if (updatedBucket) updatedBucket.updatedCount += 1;
        }
      }
    });

    let runningTotal = 0;
    let runningDocumented = 0;
    return buckets.map((bucket) => {
      runningTotal += bucket.createdCount;
      runningDocumented += bucket.documentedCreatedCount;
      return {
        label: bucket.label,
        total: runningTotal,
        documented: runningDocumented,
        updated: bucket.updatedCount,
      };
    });
  }, [projects]);

  const metricCards = useMemo(
    () => [
      {
        key: "total",
        label: "Total projects",
        value: stats.total,
        color: "blue" as const,
        trend: monthlyMetrics.map((item) => ({ label: item.label, value: item.total })),
      },
      {
        key: "documented",
        label: "Documented",
        value: stats.withDescription,
        color: "red" as const,
        trend: monthlyMetrics.map((item) => ({ label: item.label, value: item.documented })),
      },
      {
        key: "updated",
        label: "Recently updated",
        value: stats.recentlyUpdated,
        color: "navy" as const,
        trend: monthlyMetrics.map((item) => ({ label: item.label, value: item.updated })),
      },
    ],
    [stats, monthlyMetrics]
  );

  const documentation = useMemo(() => {
    const documented = stats.withDescription;
    const undocumented = Math.max(0, stats.total - documented);
    const percent = stats.total > 0 ? Math.round((documented / stats.total) * 100) : 0;
    return { documented, undocumented, percent };
  }, [stats]);

  const recentProjects = useMemo(
    () =>
      [...projects]
        .sort((a, b) => {
          const aTime = new Date(a.updated_at ?? a.created_at).getTime();
          const bTime = new Date(b.updated_at ?? b.created_at).getTime();
          return bTime - aTime;
        })
        .slice(0, 6),
    [projects]
  );

  const loadDashboard = useCallback(async () => {
    if (!Number.isInteger(parsedTeamId) || parsedTeamId <= 0) {
      setPageError("Invalid team id in URL.");
      setLoading(false);
      return;
    }

    setPageError("");
    setLoading(true);
    try {
      const [teamsResult, projectsResult] = await Promise.all([
        getTeams(),
        getTeamProjects(parsedTeamId),
      ]);
      const currentTeam = teamsResult.find((item) => item.id === parsedTeamId) ?? null;
      if (!currentTeam) {
        setPageError("Team not found or access denied.");
        setTeam(null);
        setProjects([]);
        return;
      }
      setTeam(currentTeam);
      setProjects(projectsResult);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to load project dashboard");
    } finally {
      setLoading(false);
    }
  }, [parsedTeamId]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!team) return;

    const name = createName.trim();
    const description = createDescription.trim();
    if (name.length < 2) {
      setCreateError("Project name must be at least 2 characters.");
      return;
    }

    setCreating(true);
    setCreateError("");
    try {
      const newProject = await createProject(team.id, {
        name,
        ...(description ? { description } : {}),
      });
      setProjects((prev) => [newProject, ...prev]);
      setCreateName("");
      setCreateDescription("");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(project: Project) {
    setEditingProjectId(project.id);
    setEditName(project.name);
    setEditDescription(project.description ?? "");
    setUpdateError("");
  }

  function cancelEdit() {
    setEditingProjectId(null);
    setEditName("");
    setEditDescription("");
    setUpdateError("");
  }

  async function handleSaveEdit(projectId: number) {
    const name = editName.trim();
    const description = editDescription.trim();
    if (name.length < 2) {
      setUpdateError("Project name must be at least 2 characters.");
      return;
    }

    setUpdating(true);
    setUpdateError("");
    try {
      const updated = await updateProject(projectId, {
        name,
        description,
      });
      setProjects((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      cancelEdit();
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Failed to update project");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete(projectId: number) {
    const proceed = window.confirm("Delete this project?");
    if (!proceed) return;

    setDeletingProjectId(projectId);
    setPageError("");
    try {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((item) => item.id !== projectId));
      if (editingProjectId === projectId) cancelEdit();
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to delete project");
    } finally {
      setDeletingProjectId(null);
    }
  }

  return (
    <div className="pj-shell">
      <div className="pj-app">
        <aside className="pj-sidebar">
          <div className="pj-brand-block">
            <div className="pj-brand-icon">TM</div>
            <div>
              <p className="pj-side-eyebrow">Workspace</p>
              <p className="pj-side-title">{team ? team.name : "Project Hub"}</p>
            </div>
          </div>

          <nav className="pj-side-nav">
            {appNav.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`pj-side-link${item.active ? " pj-side-link-active" : ""}`}
              >
                <span className="pj-side-link-title">{item.title}</span>
                <span className="pj-side-link-note">{item.note}</span>
              </button>
            ))}
          </nav>

          <div className="pj-side-footer">
            <button type="button" className="pj-soft-btn" onClick={() => navigate("/teams")}>
              All teams
            </button>
            <button type="button" className="pj-soft-btn" onClick={logout}>
              Sign out
            </button>
          </div>
        </aside>

        <section className="pj-main">
          <header className="pj-topbar">
            <div>
              <p className="pj-brand">Task Management</p>
              <h1 className="pj-title">Project Dashboard</h1>
              <p className="pj-subtitle">
                {team ? `${team.name} team workspace` : "Manage team projects"}.
              </p>
            </div>
            <div className="pj-header-actions">
              <button type="button" className="pj-ghost-btn" onClick={() => void loadDashboard()}>
                Refresh data
              </button>
            </div>
          </header>

          {pageError && <p className="pj-alert pj-alert-error">{pageError}</p>}
          {loading && <p className="pj-text">Loading dashboard...</p>}

          {!loading && !pageError && team && (
            <>
              <section className="pj-metric-chips">
                {metricCards.map((item) => (
                  <article key={item.key} className="pj-metric-chip">
                    <div className="pj-metric-head">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                    <MiniLineChart data={item.trend} color={item.color} />
                    <div className="pj-mini-foot">
                      <span>{item.trend[0]?.label}</span>
                      <span>{item.trend[item.trend.length - 1]?.label}</span>
                    </div>
                  </article>
                ))}
              </section>

              <section className="pj-content-grid">
                <section className="pj-card pj-create-card">
                  <h2 className="pj-section-title">Create project</h2>
                  <p className="pj-text">Add a new project with a clear name and ownership notes.</p>
                  <form className="pj-form" onSubmit={handleCreateProject}>
                    <label htmlFor="project-name" className="pj-label">
                      Name
                    </label>
                    <input
                      id="project-name"
                      className="pj-input"
                      type="text"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder="Website Redesign"
                      required
                    />

                    <label htmlFor="project-description" className="pj-label">
                      Description
                    </label>
                    <textarea
                      id="project-description"
                      className="pj-textarea"
                      value={createDescription}
                      onChange={(e) => setCreateDescription(e.target.value)}
                      placeholder="Scope, milestones, and goals..."
                    />

                    {createError && <p className="pj-alert pj-alert-error">{createError}</p>}

                    <button type="submit" className="pj-primary-btn" disabled={creating}>
                      {creating ? "Creating..." : "Create project"}
                    </button>
                  </form>
                </section>

                <section className="pj-card pj-list-card">
                  <div className="pj-list-header">
                    <h2 className="pj-section-title">Projects</h2>
                  </div>

                  {projects.length === 0 && (
                    <div className="pj-empty">
                      <p>No projects yet.</p>
                      <p>Create one to start planning team tasks.</p>
                    </div>
                  )}

                  {projects.length > 0 && (
                    <ul className="pj-list">
                      {projects.map((project) => {
                        const isEditing = editingProjectId === project.id;
                        return (
                          <li className="pj-item" key={project.id}>
                            {!isEditing && (
                              <>
                                <div>
                                  <h3>{project.name}</h3>
                                  <p>{project.description?.trim() || "No description provided."}</p>
                                  <small>Updated: {formatDate(project.updated_at ?? project.created_at)}</small>
                                </div>
                                <div className="pj-item-actions">
                                  <button
                                    type="button"
                                    className="pj-ghost-btn pj-small-btn"
                                    onClick={() => startEdit(project)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="pj-danger-btn pj-small-btn"
                                    onClick={() => void handleDelete(project.id)}
                                    disabled={deletingProjectId === project.id}
                                  >
                                    {deletingProjectId === project.id ? "Deleting..." : "Delete"}
                                  </button>
                                </div>
                              </>
                            )}

                            {isEditing && (
                              <div className="pj-edit-box">
                                <label className="pj-label" htmlFor={`edit-name-${project.id}`}>
                                  Name
                                </label>
                                <input
                                  id={`edit-name-${project.id}`}
                                  className="pj-input"
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                />

                                <label className="pj-label" htmlFor={`edit-description-${project.id}`}>
                                  Description
                                </label>
                                <textarea
                                  id={`edit-description-${project.id}`}
                                  className="pj-textarea"
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                />

                                {updateError && <p className="pj-alert pj-alert-error">{updateError}</p>}

                                <div className="pj-item-actions">
                                  <button
                                    type="button"
                                    className="pj-primary-btn pj-small-btn"
                                    onClick={() => void handleSaveEdit(project.id)}
                                    disabled={updating}
                                  >
                                    {updating ? "Saving..." : "Save"}
                                  </button>
                                  <button type="button" className="pj-ghost-btn pj-small-btn" onClick={cancelEdit}>
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>

                <section className="pj-card pj-insight-card">
                  <h2 className="pj-section-title">Documentation health</h2>
                  <div className="pj-health-block">
                    <div
                      className="pj-health-ring"
                      style={{
                        background: `conic-gradient(#2563eb 0 ${documentation.percent}%, #dbe4f3 ${documentation.percent}% 100%)`,
                      }}
                    >
                      <div className="pj-health-ring-center">
                        <strong>{documentation.percent}%</strong>
                        <span>Documented</span>
                      </div>
                    </div>
                    <div className="pj-health-legend">
                      <p><i className="pj-dot pj-dot-blue" /> Documented: {documentation.documented}</p>
                      <p><i className="pj-dot pj-dot-gray" /> Missing docs: {documentation.undocumented}</p>
                    </div>
                  </div>

                  <h3 className="pj-subhead">Recent activity</h3>
                  {recentProjects.length === 0 && (
                    <p className="pj-text">No activity yet.</p>
                  )}
                  {recentProjects.length > 0 && (
                    <ul className="pj-activity-list">
                      {recentProjects.map((project) => (
                        <li key={project.id}>
                          <div>
                            <p>{project.name}</p>
                            <small>{project.description?.trim() || "No description"}</small>
                          </div>
                          <time>{formatDate(project.updated_at ?? project.created_at)}</time>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </section>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
