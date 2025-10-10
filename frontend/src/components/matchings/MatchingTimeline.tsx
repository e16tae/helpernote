'use client';

// TODO: This component needs to be implemented to match the actual backend API

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MatchingTimelineEvent } from '@/types/matching';

interface MatchingTimelineProps {
  events: MatchingTimelineEvent[];
}

export function MatchingTimeline({ events }: MatchingTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>매칭 타임라인</CardTitle>
        <CardDescription>
          이 컴포넌트는 백엔드 API와 일치하도록 구현되어야 합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          총 {events.length}개의 이벤트
        </p>
      </CardContent>
    </Card>
  );
}
