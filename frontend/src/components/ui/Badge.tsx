import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "success" | "danger" | "warn";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-[#F7F8FA] text-[#6B7280]",
  success: "bg-[#EAF8F1] text-[#16815D]",
  danger: "bg-[#FFF0F0] text-[#D14343]",
  warn: "bg-[#FFF7E6] text-[#B76E00]",
};

const dotTones: Record<BadgeTone, string> = {
  neutral: "bg-[#9CA3AF]",
  success: "bg-[#16815D]",
  danger: "bg-[#D14343]",
  warn: "bg-[#B76E00]",
};

export default function Badge({
  tone = "neutral",
  dot = false,
  children,
  className,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {dot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", dotTones[tone])} />
      )}
      {children}
    </span>
  );
}
