import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import TaskProgressChart from "../components/charts/TaskProgressChart";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import Skeleton from "../components/ui/Skeleton";
import { InlineNotice } from "../components/ui/StateBlock";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../hooks/useAuth";
import { useWorkspace } from "../hooks/useWorkspace";
import { getMyTaskSummary, type Task, type TaskStatus } from "../services/taskService";
import { isOverdue } from "../utils/date";

export default function Home() {
  const { user, token } = useAuth();
  const { teams } = useWorkspace();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<TaskStatus, number>>({
    todo: 0,
    "in-progress": 0,
    done: 0,
  });
  const [loading, setLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");

  const loadSummary = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setTasks([]);
      setStatusCounts({
        todo: 0,
        "in-progress": 0,
        done: 0,
      });
      return;
    }

    setLoading(true);
    setSummaryError("");
    try {
      const summary = await getMyTaskSummary(token);
      setTasks(summary.tasks);
      setStatusCounts(summary.status_counts);
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : "Failed to load task progression");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const totalTasks = useMemo(
    () => (statusCounts.todo ?? 0) + (statusCounts["in-progress"] ?? 0) + (statusCounts.done ?? 0),
    [statusCounts]
  );
  const todoCount = statusCounts.todo ?? 0;
  const inProgressCount = statusCounts["in-progress"] ?? 0;
  const doneCount = statusCounts.done ?? 0;

  const overdueCount = useMemo(
    () => tasks.filter((task) => isOverdue(task.due_date) && task.status !== "done").length,
    [tasks]
  );
  const completedRate = useMemo(
    () => (totalTasks ? Math.round((doneCount / totalTasks) * 100) : 0),
    [doneCount, totalTasks]
  );
  const activeCount = todoCount + inProgressCount;
  const displayName = user?.first_name || "Collaborator";

  return (
    <MainLayout
      title="Workspace Home"
      subtitle="Overview of team health, ownership, and task execution"
      onRefresh={() => {
        void loadSummary();
      }}
    >
      <section className="home-shell">
        <Card className="home-hero">
          <div className="home-hero-main">
            <p className="home-hero-eyebrow">Workspace Overview</p>
            <h3>Welcome back, {displayName}</h3>
            <p className="ui-muted">
              Keep your delivery flow clear with a focused status view and quick access to teams and tasks.
            </p>
          </div>
          <div className="home-hero-actions">
            <Link to="/teams" className="home-hero-link">
              Teams
            </Link>
            <Link to="/dashboard" className="home-hero-link">
              My Tasks
            </Link>
          </div>
        </Card>

        {summaryError && <InlineNotice tone="error" message={summaryError} />}

        <div className="home-kpi-grid">
          <Card className="home-kpi home-kpi-todo">
            <p>To do</p>
            <strong>{loading ? "-" : todoCount}</strong>
            <small>Not started yet</small>
          </Card>
          <Card className="home-kpi home-kpi-progress">
            <p>In progress</p>
            <strong>{loading ? "-" : inProgressCount}</strong>
            <small>Currently active</small>
          </Card>
          <Card className="home-kpi home-kpi-done">
            <p>Done</p>
            <strong>{loading ? "-" : doneCount}</strong>
            <small>Completed items</small>
          </Card>
          <Card className="home-kpi home-kpi-overdue">
            <p>Overdue</p>
            <strong>{loading ? "-" : overdueCount}</strong>
            <small>Need attention</small>
          </Card>
        </div>

        <div className="home-main-grid">
          <Card className="home-progress-card">
            <div className="section-head">
              <h3>Progress Trend</h3>
              <Badge tone="neutral">{loading ? "Syncing..." : `${totalTasks} tasks`}</Badge>
            </div>
            <p className="ui-muted">Cumulative view of your assigned tasks for the recent months.</p>

            {loading && (
              <div className="dashboard-skeleton-stack home-progress-skeletons">
                <Skeleton className="skeleton-line" />
                <Skeleton className="home-progress-skeleton-chart" />
                <Skeleton className="skeleton-line short" />
              </div>
            )}

            {!loading && !summaryError && <TaskProgressChart tasks={tasks} />}
          </Card>

          <Card className="home-summary-card">
            <h3>Workspace Snapshot</h3>
            <p className="ui-muted">High-level metrics to track health and delivery pace.</p>
            <div className="home-summary-grid">
              <article>
                <p>Teams</p>
                <strong>{teams.length}</strong>
              </article>
              <article>
                <p>Total tasks</p>
                <strong>{loading ? "-" : totalTasks}</strong>
              </article>
              <article>
                <p>Active work</p>
                <strong>{loading ? "-" : activeCount}</strong>
              </article>
              <article>
                <p>Completion rate</p>
                <strong>{loading ? "-" : `${completedRate}%`}</strong>
              </article>
            </div>
            <div className="home-summary-note">
              <p>Use <strong>My Tasks</strong> to review due dates and close active work quickly.</p>
            </div>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
