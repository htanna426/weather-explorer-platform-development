import clsx from "clsx";

type Tone = "cyan" | "emerald" | "amber" | "rose" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  cyan: "bg-cyan-400/10 text-cyan-300 border-cyan-400/20",
  emerald: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  amber: "bg-amber-400/10 text-amber-300 border-amber-400/20",
  rose: "bg-rose-400/10 text-rose-300 border-rose-400/20",
  neutral: "bg-white/[0.06] text-slate-300 border-white/10",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
