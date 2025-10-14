"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { TableSkeleton } from "@/components/ui/skeleton-patterns";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, Inbox } from "lucide-react";

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  cell?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  searchValue?: string;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends { id: number | string }>({
  data,
  columns,
  searchPlaceholder = "검색...",
  onSearch,
  searchValue,
  totalPages,
  currentPage,
  onPageChange,
  emptyMessage = "데이터가 없습니다.",
  isLoading = false,
  onRowClick,
}: DataTableProps<T>) {
  const getCellValue = (row: T, column: Column<T>) => {
    if (typeof column.accessor === "function") {
      return column.accessor(row);
    }
    return row[column.accessor];
  };

  return (
    <div className="space-y-4">
      {onSearch && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <TableSkeleton columns={columns.length} rows={5} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={emptyMessage}
          description="조건을 변경하거나 새 항목을 추가해보세요."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => (
                  <TableHead key={index} className={column.className}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                >
                  {columns.map((column, index) => {
                    const value = getCellValue(row, column);
                    return (
                      <TableCell key={index} className={column.className}>
                        {column.cell ? column.cell(value, row) : String(value ?? '')}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
          </TableBody>
        </Table>
        </div>
      )}

      {totalPages && currentPage && onPageChange && totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
