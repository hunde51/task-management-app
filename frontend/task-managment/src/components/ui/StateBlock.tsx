import type { ReactNode } from "react";

type NoticeTone = "info" | "success" | "error";

type InlineNoticeProps = {
  message: string;
  tone?: NoticeTone;
};

type LoadingStateProps = {
  message?: string;
  compact?: boolean;
};

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function InlineNotice({ message, tone = "info" }: InlineNoticeProps) {
  return <p className={`ui-notice ui-notice-${tone}`}>{message}</p>;
}

export function LoadingState({ message = "Loading...", compact = false }: LoadingStateProps) {
  return (
    <div className={`ui-loading${compact ? " ui-loading-compact" : ""}`}>
      <span className="ui-loading-spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="ui-empty">
      <p className="ui-empty-title">{title}</p>
      {description && <p className="ui-empty-description">{description}</p>}
      {action && <div className="ui-empty-action">{action}</div>}
    </div>
  );
}
