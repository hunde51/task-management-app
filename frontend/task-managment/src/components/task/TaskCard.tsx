import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { formatDate, isOverdue } from "../../utils/date";
import type { Task, TaskStatus } from "../../services/taskService";
import type { TeamMember } from "../../services/teamService";

type TaskCardProps = {
  task: Task;
  members: TeamMember[];
  canAssign: boolean;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onAssign: (taskId: number, userId: number | null) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

const statusOptions: Array<{ label: string; value: TaskStatus }> = [
  { label: "To do", value: "todo" },
  { label: "In progress", value: "in-progress" },
  { label: "Done", value: "done" },
];

function statusLabel(status: TaskStatus): string {
  if (status === "in-progress") return "In progress";
  if (status === "done") return "Done";
  return "To do";
}

function fullName(task: Task): string {
  const first = task.assigned_first_name || "";
  const last = task.assigned_last_name || "";
  const full = `${first} ${last}`.trim();
  if (full) return full;
  if (task.assigned_username) return `@${task.assigned_username}`;
  return "Unassigned";
}

export default function TaskCard({
  task,
  members,
  canAssign,
  onStatusChange,
  onAssign,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const overdue = isOverdue(task.due_date) && task.status !== "done";

  return (
    <article className={`task-card${overdue ? " task-card-overdue" : ""}`}>
      <div className="task-card-head">
        <h4>{task.title}</h4>
        <Badge tone={task.status}>{statusLabel(task.status)}</Badge>
      </div>

      <p className="task-card-project">{task.project_name}</p>
      {task.description && <p className="task-card-description">{task.description}</p>}

      <div className="task-card-meta">
        <span className={overdue ? "task-overdue" : ""}>Due: {formatDate(task.due_date)}</span>
        <span>Assigned: {fullName(task)}</span>
      </div>

      <div className="task-card-controls">
        <label>
          Status
          <select
            value={task.status}
            onChange={(event) => onStatusChange(task.id, event.target.value as TaskStatus)}
            disabled={!task.can_update}
            title={task.can_update ? "" : "Not allowed"}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Assignee
          <select
            value={task.assigned_user_id ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              onAssign(task.id, value ? Number(value) : null);
            }}
            disabled={!canAssign}
            title={canAssign ? "" : "Not allowed"}
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.user_id}>
                {member.first_name} {member.last_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="task-card-actions">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onEdit(task)}
          disabled={!task.can_update}
          title={task.can_update ? "" : "Not allowed"}
        >
          Edit
        </Button>
        <Button variant="danger" size="sm" onClick={() => onDelete(task)}>
          Delete
        </Button>
      </div>
    </article>
  );
}
