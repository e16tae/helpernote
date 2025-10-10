'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import type { MatchingTimelineEvent } from '@/types/matching';

interface MatchingTimelineProps {
  events: MatchingTimelineEvent[];
}

export function MatchingTimeline({ events }: MatchingTimelineProps) {
  const getEventIcon = (eventType: MatchingTimelineEvent['eventType']) => {
    const completedTypes = ['accepted', 'completed', 'settled'];
    const cancelledTypes = ['rejected', 'cancelled'];

    if (completedTypes.includes(eventType)) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    if (cancelledTypes.includes(eventType)) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    return <Circle className="h-5 w-5 text-blue-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>진행 상황</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {events.map((event, index) => (
            <div key={event.id} className="relative flex gap-4">
              {index !== events.length - 1 && (
                <div className="absolute left-[10px] top-6 bottom-0 w-0.5 bg-border" />
              )}
              <div className="relative z-10 mt-1">{getEventIcon(event.eventType)}</div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm', { locale: ko })}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">{event.description}</p>
                <p className="text-xs text-muted-foreground">담당자: {event.performedBy}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
