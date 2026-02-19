import { useCallback, useEffect, useMemo, useState } from "react";

import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Skeleton from "../components/ui/Skeleton";
import { EmptyState, InlineNotice } from "../components/ui/StateBlock";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../hooks/useAuth";
import { getMyTaskSummary, type Task, type TaskStatus } from "../services/taskService";
import { formatDate, isOverdue } from "../utils/date";

type StatusBreakdown = {
  label: string;
  key: TaskStatus;
  count: number;
};

export default function Dashboard() {
  const { token } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<TaskStatus, number>>({
    todo: 0,
    "in-progress": 0,
    done: 0,
  });
  const [totalProjects, setTotalProjects] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError("");
    try {
      const summary = await getMyTaskSummary(token);
      setTasks(summary.tasks);
      setStatusCounts(summary.status_counts);
      setTotalProjects(summary.total_projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const breakdown = useMemo<StatusBreakdown[]>(
    () => [
      { label: "To do", key: "todo", count: statusCounts.todo ?? 0 },
      { label: "In progress", key: "in-progress", count: statusCounts["in-progress"] ?? 0 },
      { label: "Done", key: "done", count: statusCounts.done ?? 0 },
    ],
    [statusCounts]
  );

  const totalTasks = breakdown.reduce((acc, item) => acc + item.count, 0);
  const donePercent = totalTasks ? Math.round(((statusCounts.done ?? 0) / totalTasks) * 100) : 0;

  return (
    <MainLayout
      title="My Tasks"
      subtitle="Personal delivery dashboard with status analytics and overdue highlights"
      onRefresh={() => {
        void loadSummary();
      }}
      actions={
        <Button variant="secondary" size="sm" onClick={() => void loadSummary()}>
          Reload
        </Button>
      }
    >
      <section className="dashboard-grid">
        <Card>
          <h3>Task status</h3>
          {loading && (
            <div className="dashboard-skeleton-stack">
              <Skeleton className="skeleton-line" />
              <Skeleton className="skeleton-line" />
              <Skeleton className="skeleton-line" />
            </div>
          )}

          {!loading && (
            <>
              <div
                className="donut-chart"
                style={{
                  background: `conic-gradient(var(--color-primary) 0 ${donePercent}%, #e7ecf3 ${donePercent}% 100%)`,
                }}
              >
                <div>
                  <strong>{donePercent}%</strong>
                  <span>Done</span>
                </div>
              </div>

              <ul className="dashboard-bars">
                {breakdown.map((item) => {
                  const width = totalTasks ? Math.max(6, (item.count / totalTasks) * 100) : 0;
                  return (
                    <li key={item.key}>
                      <div>
                        <span>{item.label}</span>
                        <strong>{item.count}</strong>
                      </div>
                      <div className="bar-track">
                        <span style={{ width: `${width}%` }} className={`bar-fill bar-${item.key}`} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </Card>

        <Card>
          <h3>Stats</h3>
          <div className="stats-grid">
            <article>
              <p>Total tasks</p>
              <strong>{loading ? "-" : totalTasks}</strong>
            </article>
            <article>
              <p>Projects</p>
              <strong>{loading ? "-" : totalProjects}</strong>
            </article>
            <article>
              <p>Overdue</p>
              <strong>{loading ? "-" : tasks.filter((task) => isOverdue(task.due_date) && task.status !== "done").length}</strong>
            </article>
          </div>
        </Card>
      </section>

      <Card>
        <div className="section-head">
          <h3>Assigned tasks</h3>
          {!loading && <Badge tone="neutral">{tasks.length} items</Badge>}
        </div>

        {error && <InlineNotice tone="error" message={error} />}

        {loading && (
          <div className="dashboard-task-skeletons">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="task-row-skeleton">
                <Skeleton className="skeleton-line" />
                <Skeleton className="skeleton-line short" />
              </div>
            ))}
          </div>
        )}

        {!loading && !error && !tasks.length && (
          <EmptyState title="No assigned tasks" description="Once tasks are assigned, they will appear here." />
        )}

        {!loading && !error && !!tasks.length && (
          <ul className="dashboard-task-list">
            {tasks.map((task) => {
              const overdue = isOverdue(task.due_date) && task.status !== "done";
              return (
                <li key={task.id} className={overdue ? "dashboard-task-overdue" : ""}>
                  <div>
                    <h4>{task.title}</h4>
                    <p>{task.project_name}</p>
                    {task.description && <small>{task.description}</small>}
                  </div>
                  <div className="dashboard-task-meta">
                    <Badge tone={task.status}>{task.status}</Badge>
                    <time>Due {formatDate(task.due_date)}</time>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </MainLayout>
  );
}
