"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Download, File, Image as ImageIcon, FileText, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fileApi } from "@/lib/file";
import { getErrorMessage } from "@/lib/api-client";
import { CustomerFile } from "@/types/file";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

interface FileListProps {
  customerId: number;
  refreshTrigger?: number;
}

export function FileList({ customerId, refreshTrigger }: FileListProps) {
  const [files, setFiles] = useState<CustomerFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, refreshTrigger]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await fileApi.listCustomerFiles(customerId);
      setFiles(response);
    } catch (error) {
      console.error("Failed to load files:", error);
      const errorMessage = getErrorMessage(error);
      toast({
        variant: "destructive",
        title: "파일 목록 로드 실패",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId: number) => {
    if (!confirm("정말 이 파일을 삭제하시겠습니까?")) return;

    try {
      setDeleting(fileId);
      await fileApi.deleteCustomerFile(customerId, fileId);

      toast({
        title: "삭제 성공",
        description: "파일이 삭제되었습니다.",
      });

      // Refresh file list
      await loadFiles();
    } catch (error) {
      console.error("Failed to delete file:", error);
      const errorMessage = getErrorMessage(error);
      toast({
        variant: "destructive",
        title: "삭제 실패",
        description: errorMessage,
      });
    } finally {
      setDeleting(null);
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case "image":
        return <ImageIcon className="h-5 w-5 text-blue-500" />;
      case "document":
        return <FileText className="h-5 w-5 text-green-500" />;
      case "video":
        return <Video className="h-5 w-5 text-purple-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>첨부 파일</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 border rounded">
              <Skeleton className="h-5 w-5" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (files.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>첨부 파일</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={File}
            title="첨부 파일 없음"
            description="아직 업로드된 파일이 없습니다."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>첨부 파일 ({files.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-3 p-3 border rounded hover:bg-muted/50 transition-colors"
          >
            {getFileIcon(file.file_type)}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">
                  {file.original_filename || "파일"}
                </p>
                {file.is_profile && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                    프로필
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{formatFileSize(file.file_size)}</span>
                <span>·</span>
                <span>{formatDate(file.created_at)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const url = fileApi.getFileUrl(file.file_path);
                  window.open(url, "_blank");
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(file.id)}
                disabled={deleting === file.id}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
