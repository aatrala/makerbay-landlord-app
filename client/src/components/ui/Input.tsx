import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink placeholder:text-muted/60",
        "focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn("text-sm font-semibold text-ink", className)}
      {...props}
    />
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60",
        "focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition min-h-[80px]",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-10 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink",
        "focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition",
        className,
      )}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
);

Select.displayName = "Select";
