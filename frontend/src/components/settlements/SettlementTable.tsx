'use client';

// TODO: This component needs to be implemented to match the actual backend API

import type { Settlement } from '@/types/settlement';

interface SettlementTableProps {
  settlements: Settlement[];
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
}

export function SettlementTable({ settlements }: SettlementTableProps) {
  if (settlements.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        정산 내역이 없습니다.
      </div>
    );
  }

  return (
    <div className="rounded-md border p-8 text-center text-muted-foreground">
      <p className="text-lg font-medium mb-2">정산 테이블</p>
      <p className="text-sm">이 컴포넌트는 백엔드 API와 일치하도록 구현되어야 합니다.</p>
      <p className="text-xs mt-4">총 {settlements.length}개의 정산 내역</p>
    </div>
  );
}
