import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "signal" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
  loading?: boolean;
}

const variantClasses = {
  primary: "bg-deep text-white hover:bg-ink shadow-sm",
  secondary: "bg-surface text-ink border border-line hover:bg-gray-50 shadow-sm",
  signal: "bg-signal text-white hover:bg-orange-600 shadow-sm",
  ghost: "text-muted hover:bg-gray-100 hover:text-ink",
  danger: "bg-danger text-white hover:bg-red-600 shadow-sm",
};

const sizeClasses = {
  sm: "h-8 px-3 text-xs rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild, loading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/50 disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    );
  },
);

Button.displayName = "Button";
