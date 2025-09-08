import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ActivitiesManager } from "@/components/activities/ActivitiesManager";

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
      <ActivitiesManager userId={user.id} />
    </DashboardLayout>
  );
}
