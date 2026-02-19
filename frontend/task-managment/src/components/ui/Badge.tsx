import type { ReactNode } from "react";

import { cn } from "../../utils/cn";

type BadgeTone = "owner" | "member" | "todo" | "in-progress" | "done" | "neutral";

type BadgeProps = {
  tone?: BadgeTone;
  children: ReactNode;
};

export default function Badge({ tone = "neutral", children }: BadgeProps) {
  return <span className={cn("ui-badge", `ui-badge-${tone}`)}>{children}</span>;
}
