"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, User, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fileApi } from "@/lib/file";
import { getErrorMessage } from "@/lib/api-client";

interface ProfilePhotoUploadProps {
  customerId: number;
  customerName: string;
  currentPhotoPath?: string | null;
  onSuccess?: () => void;
}

export function ProfilePhotoUpload({
  customerId,
  customerName,
  currentPhotoPath,
  onSuccess,
}: ProfilePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    currentPhotoPath ? fileApi.getFileUrl(currentPhotoPath) : null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "잘못된 파일 형식",
        description: "이미지 파일만 업로드할 수 있습니다.",
      });
      return;
    }

    // Validate file size (5MB)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast({
        variant: "destructive",
        title: "파일 크기 초과",
        description: "프로필 사진은 5MB를 초과할 수 없습니다.",
      });
      return;
    }

    try {
      setUploading(true);

      // Preview image immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      const response = await fileApi.uploadCustomerProfilePhoto(
        customerId,
        file
      );

      toast({
        title: "업로드 성공",
        description: "프로필 사진이 업데이트되었습니다.",
      });

      setPhotoUrl(response.file_url);
      onSuccess?.();

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Profile photo upload failed:", error);
      const errorMessage = getErrorMessage(error);

      // Revert to previous photo on error
      setPhotoUrl(
        currentPhotoPath ? fileApi.getFileUrl(currentPhotoPath) : null
      );

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

  const handleDelete = async () => {
    if (!photoUrl) return;

    try {
      setDeleting(true);
      // Note: This assumes the profile photo is stored as a regular customer file
      // If there's a specific API endpoint for deleting profile photos, use that instead
      await fileApi.deleteCustomerProfilePhoto(customerId);

      setPhotoUrl(null);
      toast({
        title: "삭제 성공",
        description: "프로필 사진이 삭제되었습니다.",
      });
      onSuccess?.();
    } catch (error) {
      console.error("Profile photo delete failed:", error);
      const errorMessage = getErrorMessage(error);
      toast({
        variant: "destructive",
        title: "삭제 실패",
        description: errorMessage,
      });
    } finally {
      setDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          {photoUrl ? (
            <AvatarImage src={photoUrl} alt={customerName} />
          ) : (
            <AvatarFallback className="text-2xl">
              {getInitials(customerName)}
            </AvatarFallback>
          )}
        </Avatar>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleButtonClick}
            disabled={uploading || deleting}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                업로드 중...
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                프로필 사진 변경
              </>
            )}
          </Button>
          {photoUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={uploading || deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  삭제 중...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  삭제
                </>
              )}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          JPG, PNG 형식, 최대 5MB
        </p>
      </div>
    </div>
  );
}
