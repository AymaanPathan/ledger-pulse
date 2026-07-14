import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "h-[38px] w-full rounded-lg border border-[#E8EAED] bg-white px-3 text-sm text-[#16181D] placeholder:text-[#9CA3AF] transition-colors duration-200 focus:outline-none focus:border-[#176B4D] focus:ring-2 focus:ring-[#176B4D]/10",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";
export default Input;
