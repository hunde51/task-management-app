import type { HTMLAttributes } from "react";

import { cn } from "../../utils/cn";

type CardProps = HTMLAttributes<HTMLDivElement>;

export default function Card({ className, ...props }: CardProps) {
  return <div className={cn("ui-card", className)} {...props} />;
}
