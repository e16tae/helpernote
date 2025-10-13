"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface VirtualizedListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
  estimateSize?: number;
  emptyMessage?: string;
  className?: string;
}

export function VirtualizedList<T>({
  data,
  renderItem,
  keyExtractor,
  estimateSize = 80,
  emptyMessage = "데이터가 없습니다.",
  className,
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 5,
  });

  if (data.length === 0) {
    return (
      <div className={cn("rounded-md border", className)}>
        <div className="h-64 flex items-center justify-center text-center text-muted-foreground">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={cn("h-[600px] overflow-auto rounded-md border", className)}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = data[virtualItem.index];
          return (
            <div
              key={keyExtractor(item)}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface VirtualizedCardListProps<T> {
  data: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
  estimateSize?: number;
  emptyMessage?: string;
  className?: string;
  cardClassName?: string;
}

export function VirtualizedCardList<T>({
  data,
  renderCard,
  keyExtractor,
  estimateSize = 120,
  emptyMessage = "데이터가 없습니다.",
  className,
  cardClassName,
}: VirtualizedCardListProps<T>) {
  return (
    <VirtualizedList
      data={data}
      keyExtractor={keyExtractor}
      estimateSize={estimateSize}
      emptyMessage={emptyMessage}
      className={className}
      renderItem={(item, index) => (
        <div className="px-4 py-2">
          <Card className={cardClassName}>
            <CardContent className="pt-6">{renderCard(item, index)}</CardContent>
          </Card>
        </div>
      )}
    />
  );
}
