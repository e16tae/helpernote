'use client';

// TODO: This component needs to be implemented to match the actual backend API
// The JobPosting type uses snake_case properties and has a different structure
// than what this component was originally designed for.

import type { JobPosting } from '@/types/job-posting';

interface JobPostingTableProps {
  jobPostings: JobPosting[];
  onToggleFavorite: (id: number) => void;
  onDelete: (id: number) => void;
}

export function JobPostingTable({ jobPostings }: JobPostingTableProps) {
  if (jobPostings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        등록된 구인 공고가 없습니다.
      </div>
    );
  }

  return (
    <div className="rounded-md border p-8 text-center text-muted-foreground">
      <p className="text-lg font-medium mb-2">구인 공고 테이블</p>
      <p className="text-sm">이 컴포넌트는 백엔드 API와 일치하도록 구현되어야 합니다.</p>
      <p className="text-xs mt-4">총 {jobPostings.length}개의 공고</p>
    </div>
  );
}
