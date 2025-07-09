'use client';

import { AdminGuard } from '@/components/admin-guard';
import { FileManager } from '@/components/file-manager/file-manager';

// Force dynamic rendering for admin-only pages
export const dynamic = 'force-dynamic';

export default function FilesPage() {
  return (
    <AdminGuard>
      <FileManager />
    </AdminGuard>
  );
}
