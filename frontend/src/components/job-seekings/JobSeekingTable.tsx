'use client';

// TODO: This component needs to be implemented to match the actual backend API
// The JobSeekingPosting type has different properties than expected

import type { JobSeeking } from '@/types/job-posting';

interface JobSeekingTableProps {
  jobSeekings: JobSeeking[];
  onDelete: (id: number) => void;
}

export function JobSeekingTable({ jobSeekings }: JobSeekingTableProps) {
  if (jobSeekings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        등록된 구직 공고가 없습니다.
      </div>
    );
  }

  return (
    <div className="rounded-md border p-8 text-center text-muted-foreground">
      <p className="text-lg font-medium mb-2">구직 공고 테이블</p>
      <p className="text-sm">이 컴포넌트는 백엔드 API와 일치하도록 구현되어야 합니다.</p>
      <p className="text-xs mt-4">총 {jobSeekings.length}개의 공고</p>
    </div>
  );
}
