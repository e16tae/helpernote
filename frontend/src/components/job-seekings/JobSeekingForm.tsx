'use client';

// TODO: This component needs to be implemented to match the actual backend API
// The JobSeekingFormData should use the actual CreateJobSeekingPostingRequest type

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { JobSeekingFormData } from '@/types/job-posting';

interface JobSeekingFormProps {
  initialData?: Partial<JobSeekingFormData>;
  onSubmit?: (data: JobSeekingFormData) => Promise<void>;
}

export function JobSeekingForm({ initialData, onSubmit }: JobSeekingFormProps) {
  const router = useRouter();
  const [isSubmitting] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>구직 공고 폼</CardTitle>
        <CardDescription>
          이 컴포넌트는 백엔드 API와 일치하도록 구현되어야 합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          JobSeekingFormData 타입이 실제 API 구조와 일치해야 합니다.
        </p>
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            저장
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
