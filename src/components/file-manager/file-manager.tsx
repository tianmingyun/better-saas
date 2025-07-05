'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationControls } from '@/components/ui/pagination';
import { useFiles } from '@/hooks/use-files';
import type { FileInfo } from '@/lib/file-service';
import { Search, Upload } from 'lucide-react';
import { useState } from 'react';
import { FileTable } from './file-table';
import { FileUpload } from './file-upload';
import { ImagePreviewModal } from './image-preview-modal';

export function FileManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { files, isLoading, error, uploadFile, deleteFile, isUploading, pagination } = useFiles({
    search: searchQuery,
    page: currentPage,
  });

  const handlePreview = (file: FileInfo) => {
    setPreviewFile(file);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和描述 */}
      <div className="flex flex-col space-y-2">
        <h1 className="font-bold text-2xl">R2 Image/Video Management</h1>
        <p className="text-muted-foreground">Browse files stored in Cloudflare R2 (Admin only).</p>
      </div>

      {/* 上传区域 */}
      {showUpload ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">上传文件</h2>
            <Button variant="outline" onClick={() => setShowUpload(false)}>
              取消
            </Button>
          </div>
          <FileUpload
            onUpload={async (files) => {
              for (const file of files) {
                await uploadFile(file);
              }
              setShowUpload(false);
            }}
            loading={isUploading}
          />
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by filename prefix..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-80 pl-10"
              />
            </div>
          </div>
          <Button onClick={() => setShowUpload(true)}>
            <Upload className="mr-2 h-4 w-4" />
            上传文件
          </Button>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* 文件表格 */}
      <FileTable
        files={files}
        loading={isLoading}
        onDelete={deleteFile}
        onPreview={handlePreview}
      />

      {/* 分页 */}
      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-sm">
            共 {pagination.total} 个文件，第 {pagination.page} 页，共{' '}
            {Math.ceil(pagination.total / pagination.limit)} 页
          </div>
          <PaginationControls
            currentPage={pagination.page}
            totalPages={Math.ceil(pagination.total / pagination.limit)}
            onPageChange={(page: number) => {
              setCurrentPage(page);
            }}
          />
        </div>
      )}

      {/* 图片预览模态框 */}
      <ImagePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
}
