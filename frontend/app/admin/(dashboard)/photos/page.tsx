"use client";

import { AdminShell } from "@/components/admin/admin-shell";
import { PhotosManager } from "@/components/admin/photos-manager";

export default function AdminPhotosPage() {
  return (
    <AdminShell title="Photos">
      <PhotosManager />
    </AdminShell>
  );
}
