'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { FileImage, Upload, X } from 'lucide-react';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAppConfig } from '@/hooks/use-config';

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  loading?: boolean;
  className?: string;
}

export function FileUpload({ onUpload, loading = false, className }: FileUploadProps) {
  const appConfig = useAppConfig();
  
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onUpload(acceptedFiles);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/*': appConfig.upload.allowedTypes,
    },
    maxSize: appConfig.upload.maxFileSize,
    multiple: appConfig.upload.maxFiles > 1,
  });

  return (
    <div className={cn('space-y-4', className)}>
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={cn(
              'cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors',
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary hover:bg-primary/5',
              loading && 'pointer-events-none opacity-50'
            )}
          >
            <input {...getInputProps()} />

            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-full bg-primary/10 p-4">
                {loading ? (
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : (
                  <Upload className="h-8 w-8 text-primary" />
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">
                  {loading
                    ? '正在上传...'
                    : isDragActive
                      ? '放开图片即可上传'
                      : '拖拽图片到这里，或点击选择图片'}
                </h3>
                <p className="text-muted-foreground text-sm">
                  仅支持 JPEG 和 PNG 格式的图片，单个文件最大 {Math.round(appConfig.upload.maxFileSize / (1024 * 1024))}MB
                </p>
              </div>

              {!loading && (
                <Button variant="outline" size="sm">
                  <FileImage className="mr-2 h-4 w-4" />
                  选择图片
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File error notifications */}
      {fileRejections.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <X className="mt-0.5 h-5 w-5 text-destructive" />
              <div className="space-y-1">
                <h4 className="font-medium text-destructive text-sm">文件上传失败</h4>
                <ul className="space-y-1">
                  {fileRejections.map(({ file, errors }) => (
                    <li key={file.name} className="text-destructive/80 text-sm">
                      <span className="font-medium">{file.name}</span>:
                      {errors.map((error) => (
                        <span key={error.code} className="ml-1">
                          {error.code === 'file-too-large' && '文件过大'}
                          {error.code === 'file-invalid-type' && '仅支持 JPEG 和 PNG 格式的图片'}
                          {error.code === 'too-many-files' && '文件数量过多'}
                        </span>
                      ))}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
