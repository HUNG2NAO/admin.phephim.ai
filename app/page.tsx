import { requireAdmin } from "@/lib/auth";
import { Dashboard } from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAdmin();
  return <Dashboard />;
}
