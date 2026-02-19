import type { Task, TaskStatus } from "../../services/taskService";
import type { TeamMember } from "../../services/teamService";
import TaskCard from "./TaskCard";

type TaskBoardProps = {
  tasks: Task[];
  members: TeamMember[];
  canAssign: boolean;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onAssign: (taskId: number, userId: number | null) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

const lanes: Array<{ key: TaskStatus; title: string }> = [
  { key: "todo", title: "To do" },
  { key: "in-progress", title: "In progress" },
  { key: "done", title: "Done" },
];

export default function TaskBoard({
  tasks,
  members,
  canAssign,
  onStatusChange,
  onAssign,
  onEdit,
  onDelete,
}: TaskBoardProps) {
  return (
    <section className="task-board">
      {lanes.map((lane) => {
        const laneTasks = tasks.filter((task) => task.status === lane.key);

        return (
          <section key={lane.key} className="task-lane">
            <header className="task-lane-header">
              <h3>{lane.title}</h3>
              <span>{laneTasks.length}</span>
            </header>

            <div className="task-lane-body">
              {laneTasks.length === 0 && <p className="task-lane-empty">No tasks</p>}
              {laneTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  members={members}
                  canAssign={canAssign}
                  onStatusChange={onStatusChange}
                  onAssign={onAssign}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
}
