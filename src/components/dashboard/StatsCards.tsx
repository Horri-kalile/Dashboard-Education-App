"use client";
import { TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

export type StatMetric = {
  label: string;
  value: number | null;
  icon?: React.ReactNode;
  help?: string;
  trendPercent?: number | null; // positive or negative
  colorClass?: string; // tailwind hue basis
  target?: number; // optional target to compute progress
};

function RadialGauge({
  value,
  max = 100,
  size = 140,
  stroke = 12,
  color = "#4f46e5",
}: {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  color?: string;
}) {
  const clamped = Math.max(0, Math.min(value, max));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (clamped / max) * circumference;
  return (
    <svg width={size} height={size} className="overflow-visible">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        stroke="hsl(var(--muted))"
        fill="none"
        strokeLinecap="round"
        className="opacity-30"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        stroke={color}
        fill="none"
        strokeDasharray={`${progress} ${circumference - progress}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-700 ease-out"
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="fill-foreground font-semibold text-3xl"
      >
        {value}
      </text>
    </svg>
  );
}

function TrendBadge({ percent }: { percent: number }) {
  const positive = percent >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
        positive
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
      )}
    >
      {positive ? "+" : ""}
      {percent.toFixed(1)}%{positive && <TrendingUp className="h-3 w-3" />}
    </span>
  );
}

function StatCard({ metric }: { metric: StatMetric }) {
  const {
    label,
    value,
    trendPercent,
    help,
    colorClass = "text-indigo-600",
  } = metric;
  // Compute gauge max heuristically
  const max = useMemo(() => {
    if (!value || value === 0) return 10;
    // round up to nearest pleasing number
    const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    const base = Math.ceil(value / magnitude) * magnitude;
    return base === value ? base * 1.2 : base; // add headroom
  }, [value]);

  return (
    <Card className="relative overflow-hidden border-indigo-100/60 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>{label}</span>
          {typeof trendPercent === "number" && (
            <TrendBadge percent={trendPercent} />
          )}
        </CardTitle>
        {help && <CardDescription>{help}</CardDescription>}
      </CardHeader>
      <CardContent className="flex items-center justify-center py-4">
        {value != null ? (
          <div className={cn("relative", colorClass)}>
            <RadialGauge
              value={value}
              max={typeof max === "number" ? max : 100}
              color="currentColor"
            />
          </div>
        ) : (
          <div className="h-[140px] flex items-center justify-center text-xs text-muted-foreground">
            No data
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 text-[10px] text-muted-foreground flex flex-col items-start gap-1">
        <div>Total {label.toLowerCase()}</div>
      </CardFooter>
    </Card>
  );
}

export function StatsCards({ metrics }: { metrics: StatMetric[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map((m) => (
        <StatCard key={m.label} metric={m} />
      ))}
    </div>
  );
}
