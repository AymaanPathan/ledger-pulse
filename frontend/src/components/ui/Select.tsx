import { SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "h-9 rounded-md border border-border bg-white px-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/10",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = "Select";
export default Select;
