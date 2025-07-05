'use client';

import type { FileInfo } from '@/lib/file-service';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

interface FilesResponse {
  files: FileInfo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

interface UseFilesOptions {
  page?: number;
  limit?: number;
  search?: string;
}

const fetcher = async (url: string): Promise<FilesResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch files');
  }
  return response.json();
};

export function useFiles(options: UseFilesOptions = {}) {
  const { page = 1, limit = 20, search = '' } = options;

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
  });

  const key = `/api/files?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
  });

  // 上传文件
  const { trigger: uploadFile, isMutating: isUploading } = useSWRMutation(
    '/api/files/upload',
    async (url: string, { arg }: { arg: File }) => {
      const formData = new FormData();
      formData.append('file', arg);

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    },
    {
      onSuccess: () => {
        // 上传成功后重新获取文件列表
        mutate();
      },
    }
  );

  // 删除文件
  const { trigger: deleteFile, isMutating: isDeleting } = useSWRMutation(
    '/api/files',
    async (url: string, { arg }: { arg: string }) => {
      // 乐观删除
      if (data) {
        const optimisticData = {
          ...data,
          files: data.files.filter((file) => file.id !== arg),
        };
        mutate(optimisticData, false);
      }

      const response = await fetch(`${url}/${arg}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // 删除失败时恢复数据
        mutate();
        const error = await response.json();
        throw new Error(error.error || 'Delete failed');
      }

      return response.json();
    },
    {
      onSuccess: () => {
        // 删除成功后重新获取数据
        mutate();
      },
      onError: () => {
        // 删除失败时恢复数据
        mutate();
      },
    }
  );

  return {
    files: data?.files || [],
    pagination: data?.pagination,
    error,
    isLoading,
    isUploading,
    isDeleting,
    uploadFile,
    deleteFile,
    refresh: () => mutate(),
  };
}
