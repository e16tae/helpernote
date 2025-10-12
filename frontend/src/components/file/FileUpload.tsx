"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fileApi } from "@/lib/file";
import { getErrorMessage } from "@/lib/api-client";

interface FileUploadProps {
  customerId: number;
  onSuccess?: () => void;
  accept?: string;
  maxSizeMB?: number;
}

export function FileUpload({
  customerId,
  onSuccess,
  accept,
  maxSizeMB = 10,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast({
        variant: "destructive",
        title: "파일 크기 초과",
        description: `파일 크기는 ${maxSizeMB}MB를 초과할 수 없습니다.`,
      });
      return;
    }

    try {
      setUploading(true);
      await fileApi.uploadCustomerFile(customerId, file);

      toast({
        title: "업로드 성공",
        description: "파일이 업로드되었습니다.",
      });

      onSuccess?.();

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("File upload failed:", error);
      const errorMessage = getErrorMessage(error);
      toast({
        variant: "destructive",
        title: "업로드 실패",
        description: errorMessage,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        onClick={handleButtonClick}
        disabled={uploading}
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            업로드 중...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            파일 업로드
          </>
        )}
      </Button>
    </div>
  );
}
