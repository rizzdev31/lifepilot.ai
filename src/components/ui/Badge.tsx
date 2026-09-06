import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "green" | "blue" | "amber" | "error" | "default";
  className?: string;
}

const variants = {
  green: "bg-[#aef846]/10 text-[#aef846] border border-[#aef846]/30",
  blue: "bg-[#adc6ff]/10 text-[#adc6ff] border border-[#adc6ff]/30",
  amber: "bg-amber-400/10 text-amber-400 border border-amber-400/30",
  error: "bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/30",
  default: "bg-[#2f3445] text-[#c1cab0] border border-[#424936]",
};

export default function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
