import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "md" | "icon";
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 select-none",
          variant === "default" && "bg-[var(--green)] text-white hover:opacity-90 active:scale-[.98]",
          variant === "ghost"   && "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]",
          variant === "outline" && "border border-[var(--border)] text-[var(--muted)] hover:border-[var(--green)] hover:text-[var(--green)] bg-[var(--surface)]",
          size === "sm"   && "h-8  px-3   text-xs",
          size === "md"   && "h-9  px-4   text-sm",
          size === "icon" && "h-8  w-8",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
export { Button };
