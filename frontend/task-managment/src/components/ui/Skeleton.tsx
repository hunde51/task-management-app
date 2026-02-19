import { cn } from "../../utils/cn";

type SkeletonProps = {
  className?: string;
};

export default function Skeleton({ className }: SkeletonProps) {
  return <span className={cn("ui-skeleton", className)} aria-hidden="true" />;
}
