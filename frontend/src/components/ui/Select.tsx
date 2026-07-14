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
        "h-[38px] rounded-lg border border-[#E8EAED] bg-white px-2.5 text-sm text-[#16181D] transition-colors duration-200 focus:outline-none focus:border-[#176B4D] focus:ring-2 focus:ring-[#176B4D]/10",
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
