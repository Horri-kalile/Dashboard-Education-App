import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";

export default async function ActivitiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <DashboardLayout
      userEmail={user.email}
      title="Activities"
      description="Manage and publish learning activities"
    >
      <div className="rounded-lg border border-dashed border-indigo-200/70 dark:border-neutral-700 p-10 text-center bg-white/60 dark:bg-neutral-900/60 backdrop-blur">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Activities management interface coming soon.
        </p>
      </div>
    </DashboardLayout>
  );
}
