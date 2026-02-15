import { requireAdmin } from "@/app/actions/auth";
import { getAllUsers } from "@/services/users";
import { UsersManagement } from "@/components/admin/users-management";

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  await requireAdmin();
  const users = await getAllUsers();

  return <UsersManagement initialUsers={users} />;
}
