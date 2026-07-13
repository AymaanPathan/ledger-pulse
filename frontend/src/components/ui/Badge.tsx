import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "success" | "danger" | "warn";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-ink-300/20 text-ink-700",
  success: "bg-accent-soft text-accent",
  danger: "bg-danger-soft text-danger",
  warn: "bg-warn-soft text-warn",
};

export default function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
