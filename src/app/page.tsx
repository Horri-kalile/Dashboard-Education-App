import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatsCards, StatMetric } from "@/components/dashboard/StatsCards";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch counts in parallel (RLS must allow these selects)
  const [studentsRes, activitiesRes, assetsRes] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("activities").select("id", { count: "exact", head: true }),
    supabase.from("assets").select("id", { count: "exact", head: true }),
  ]);

  const studentsCount = studentsRes.count ?? 0;
  const activitiesCount = activitiesRes.count ?? 0;
  const assetsCount = assetsRes.count ?? 0;

  const metrics: StatMetric[] = [
    {
      label: "Students",
      value: studentsCount,
      trendPercent: null,
      help: "Registered learners",
      colorClass: "text-indigo-600",
    },
    {
      label: "Activities",
      value: activitiesCount,
      trendPercent: null,
      help: "Learning items",
      colorClass: "text-violet-600",
    },
    {
      label: "Assets",
      value: assetsCount,
      trendPercent: null,
      help: "Uploaded files",
      colorClass: "text-sky-600",
    },
  ];

  return (
    <DashboardLayout
      userEmail={user.email}
      description="Overview & quick stats"
    >
      <div className="space-y-10">
        <StatsCards metrics={metrics} />
        {/* Placeholder for future charts / recent activity */}
        <div className="rounded-lg border border-dashed border-indigo-200/70 dark:border-neutral-700 p-6 text-center bg-white/60 dark:bg-neutral-900/60 backdrop-blur">
          <h3 className="text-sm font-semibold mb-1 tracking-tight">More Insights Coming</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
            Add categories, levels and activities to populate deeper analytics.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
