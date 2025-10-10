'use client';

// TODO: This component needs to be implemented to match the actual backend API

import type { Matching } from '@/types/matching';

interface MatchingTableProps {
  matchings: Matching[];
}

export function MatchingTable({ matchings }: MatchingTableProps) {
  if (matchings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        등록된 매칭이 없습니다.
      </div>
    );
  }

  return (
    <div className="rounded-md border p-8 text-center text-muted-foreground">
      <p className="text-lg font-medium mb-2">매칭 테이블</p>
      <p className="text-sm">이 컴포넌트는 백엔드 API와 일치하도록 구현되어야 합니다.</p>
      <p className="text-xs mt-4">총 {matchings.length}개의 매칭</p>
    </div>
  );
}
