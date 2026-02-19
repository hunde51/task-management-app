import { useMemo } from "react";

import type { Task, TaskStatus } from "../../services/taskService";

type TaskProgressChartProps = {
  tasks: Task[];
};

type ProgressPoint = {
  label: string;
  todo: number;
  inProgress: number;
  done: number;
};

const MONTH_WINDOW = 6;

function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function emptyStatusBucket(): Record<TaskStatus, number> {
  return {
    todo: 0,
    "in-progress": 0,
    done: 0,
  };
}

function buildProgressPoints(tasks: Task[]): ProgressPoint[] {
  const now = new Date();
  const months: Date[] = [];

  for (let offset = MONTH_WINDOW - 1; offset >= 0; offset -= 1) {
    months.push(new Date(now.getFullYear(), now.getMonth() - offset, 1));
  }

  const monthlyCounts = new Map<string, Record<TaskStatus, number>>();
  months.forEach((month) => monthlyCounts.set(toMonthKey(month), emptyStatusBucket()));
  const rangeStart = months[0];
  const baseline = emptyStatusBucket();

  tasks.forEach((task) => {
    const createdAt = new Date(task.created_at);
    if (Number.isNaN(createdAt.getTime())) return;

    if (createdAt < rangeStart) {
      baseline[task.status] += 1;
      return;
    }

    const bucket = monthlyCounts.get(toMonthKey(createdAt));
    if (!bucket) return;

    bucket[task.status] += 1;
  });

  let todoTotal = baseline.todo;
  let inProgressTotal = baseline["in-progress"];
  let doneTotal = baseline.done;

  return months.map((month) => {
    const counts = monthlyCounts.get(toMonthKey(month));
    if (counts) {
      todoTotal += counts.todo;
      inProgressTotal += counts["in-progress"];
      doneTotal += counts.done;
    }

    return {
      label: month.toLocaleDateString(undefined, { month: "short" }),
      todo: todoTotal,
      inProgress: inProgressTotal,
      done: doneTotal,
    };
  });
}

function buildPath(values: number[], xForIndex: (index: number) => number, yForValue: (value: number) => number): string {
  return values.map((value, index) => `${index === 0 ? "M" : "L"} ${xForIndex(index)} ${yForValue(value)}`).join(" ");
}

export default function TaskProgressChart({ tasks }: TaskProgressChartProps) {
  const points = useMemo(() => buildProgressPoints(tasks), [tasks]);

  const width = 760;
  const height = 210;
  const padding = {
    top: 12,
    right: 16,
    bottom: 24,
    left: 36,
  };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(
    1,
    ...points.flatMap((point) => [point.todo, point.inProgress, point.done])
  );

  const xForIndex = (index: number) => {
    if (points.length <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index * plotWidth) / (points.length - 1);
  };

  const yForValue = (value: number) => padding.top + plotHeight - (value / maxValue) * plotHeight;
  const baselineY = padding.top + plotHeight;

  const todoPath = buildPath(
    points.map((point) => point.todo),
    xForIndex,
    yForValue
  );
  const inProgressPath = buildPath(
    points.map((point) => point.inProgress),
    xForIndex,
    yForValue
  );
  const donePath = buildPath(
    points.map((point) => point.done),
    xForIndex,
    yForValue
  );

  const doneAreaPath = `${donePath} L ${xForIndex(points.length - 1)} ${baselineY} L ${xForIndex(0)} ${baselineY} Z`;

  const horizontalTicks = Array.from({ length: 4 }).map((_, index) => {
    const ratio = index / 3;
    return {
      value: Math.round(maxValue * (1 - ratio)),
      y: padding.top + plotHeight * ratio,
    };
  });

  return (
    <div className="home-progress-chart-shell">
      <div className="home-progress-legend">
        <span>
          <i className="home-progress-dot home-progress-dot-todo" />
          To do
        </span>
        <span>
          <i className="home-progress-dot home-progress-dot-in-progress" />
          In progress
        </span>
        <span>
          <i className="home-progress-dot home-progress-dot-done" />
          Done
        </span>
      </div>

      <svg
        className="home-progress-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Task progression over recent months"
      >
        <defs>
          <linearGradient id="progressArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16a34a" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {horizontalTicks.map((tick, index) => (
          <g key={`h-${index}`}>
            <line
              x1={padding.left}
              y1={tick.y}
              x2={width - padding.right}
              y2={tick.y}
              className="home-progress-grid-line"
            />
            <text
              x={padding.left - 10}
              y={tick.y + 4}
              textAnchor="end"
              className="home-progress-axis-label"
            >
              {tick.value}
            </text>
          </g>
        ))}

        {points.map((_, index) => (
          <line
            key={`v-${index}`}
            x1={xForIndex(index)}
            y1={padding.top}
            x2={xForIndex(index)}
            y2={baselineY}
            className="home-progress-grid-line home-progress-grid-vertical"
          />
        ))}

        <path d={doneAreaPath} className="home-progress-area" />
        <path d={todoPath} className="home-progress-line home-progress-line-todo" />
        <path d={inProgressPath} className="home-progress-line home-progress-line-in-progress" />
        <path d={donePath} className="home-progress-line home-progress-line-done" />

        {points.map((point, index) => (
          <g key={`pt-${index}`}>
            <circle cx={xForIndex(index)} cy={yForValue(point.todo)} r="3.5" className="home-progress-point home-progress-dot-todo" />
            <circle
              cx={xForIndex(index)}
              cy={yForValue(point.inProgress)}
              r="3.5"
              className="home-progress-point home-progress-dot-in-progress"
            />
            <circle cx={xForIndex(index)} cy={yForValue(point.done)} r="3.5" className="home-progress-point home-progress-dot-done" />
            <text
              x={xForIndex(index)}
              y={height - 8}
              textAnchor="middle"
              className="home-progress-axis-label"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
