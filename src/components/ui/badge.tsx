import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "green" | "muted";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium leading-none",
        variant === "default" && "bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--border)]",
        variant === "green"   && "bg-[var(--green-dim)] text-[var(--green)]",
        variant === "muted"   && "bg-[var(--surface-2)] text-[var(--subtle)]",
        className
      )}
      {...props}
    />
  );
}
