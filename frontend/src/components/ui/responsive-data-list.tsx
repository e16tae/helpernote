import { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  cell: (item: T) => ReactNode;
  mobileLabel?: string;
  hideOnMobile?: boolean;
  className?: string;
}

interface ResponsiveDataListProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  mobileCardClassName?: string;
}

export function ResponsiveDataList<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = "데이터가 없습니다.",
  mobileCardClassName,
}: ResponsiveDataListProps<T>) {
  if (data.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="h-64 flex items-center justify-center text-center text-muted-foreground">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={keyExtractor(item)}>
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.cell(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {data.map((item) => (
          <Card key={keyExtractor(item)} className={mobileCardClassName}>
            <CardContent className="pt-6 space-y-3">
              {columns
                .filter((column) => !column.hideOnMobile)
                .map((column) => (
                  <div
                    key={column.key}
                    className="flex justify-between items-start gap-4"
                  >
                    <span className="text-sm font-medium text-muted-foreground min-w-[80px]">
                      {column.mobileLabel || column.header}
                    </span>
                    <div className="flex-1 text-right text-sm">
                      {column.cell(item)}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
