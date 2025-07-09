'use client';

import { AdminGuard } from '@/components/admin-guard';
import { FileManager } from '@/components/file-manager/file-manager';

export default function FilesPage() {
  return (
    <AdminGuard>
      <FileManager />
    </AdminGuard>
  );
}
