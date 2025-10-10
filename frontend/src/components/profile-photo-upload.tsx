'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Loader2, X, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import apiClient from '@/lib/api';

interface ProfilePhotoUploadProps {
  customer_id: number;
  currentPhotoUrl?: string | null;
  customerName: string;
  onPhotoUploaded?: (photoUrl: string) => void;
}

export function ProfilePhotoUpload({
  customer_id,
  currentPhotoUrl,
  customerName,
  onPhotoUploaded,
}: ProfilePhotoUploadProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl || null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: '오류',
        description: '이미지 파일만 업로드할 수 있습니다.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: '오류',
        description: '파일 크기는 5MB를 초과할 수 없습니다.',
        variant: 'destructive',
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadPhoto(file);
  };

  const uploadPhoto = async (file: File) => {
    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post(
        `/customers/${customer_id}/profile-photo`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const newPhotoUrl = response.data.file_url;
      setPhotoUrl(newPhotoUrl);
      setPreviewUrl(null);

      toast({
        title: '성공',
        description: '프로필 사진이 업로드되었습니다.',
      });

      if (onPhotoUploaded) {
        onPhotoUploaded(newPhotoUrl);
      }
    } catch (error) {
      console.error('Failed to upload photo:', error);
      setPreviewUrl(null);
      toast({
        title: '오류',
        description: '사진 업로드에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const displayUrl = previewUrl || photoUrl;
  const initials = customerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="h-32 w-32">
              {displayUrl ? (
                <AvatarImage src={displayUrl} alt={customerName} />
              ) : (
                <AvatarFallback className="text-4xl">
                  {initials || <User className="h-12 w-12" />}
                </AvatarFallback>
              )}
            </Avatar>

            {/* Loading overlay */}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}

            {/* Remove button */}
            {displayUrl && !uploading && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                onClick={handleRemovePhoto}
                aria-label="프로필 사진 제거"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Upload button */}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={handleButtonClick}
              disabled={uploading}
              variant="outline"
            >
              <Camera className="mr-2 h-4 w-4" />
              {photoUrl ? '사진 변경' : '사진 업로드'}
            </Button>
          </div>

          {/* Help text */}
          <p className="text-xs text-muted-foreground text-center">
            JPG, PNG, GIF 형식의 이미지 파일
            <br />
            최대 5MB
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
