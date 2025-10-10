'use client';

// TODO: This component needs to be implemented to match the actual backend API

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { SettlementStats as Stats } from '@/types/settlement';

interface SettlementStatsProps {
  stats: Stats;
}

export function SettlementStats({ stats }: SettlementStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>정산 통계</CardTitle>
        <CardDescription>
          이 컴포넌트는 백엔드 API와 일치하도록 구현되어야 합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          통계 데이터가 표시됩니다.
        </p>
      </CardContent>
    </Card>
  );
}
