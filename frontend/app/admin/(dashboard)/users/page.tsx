"use client";

import { AdminShell } from "@/components/admin/admin-shell";
import { UsersManager } from "@/components/admin/users-manager";

export default function AdminUsersPage() {
  return (
    <AdminShell title="Users">
      <p className="mb-4 max-w-xl text-sm text-muted-foreground">
        When someone emails you asking for access, create their login here with their email and a
        password. Only active users can sign in to the user side &mdash; deactivate a user to block
        them (any session they have ends straight away) and activate them again to restore access.
      </p>
      <UsersManager />
    </AdminShell>
  );
}
