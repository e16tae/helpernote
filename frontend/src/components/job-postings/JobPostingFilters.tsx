'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import type { JobPostingFilters } from '@/types/job-posting';

interface JobPostingFiltersProps {
  filters: JobPostingFilters;
  onFiltersChange: (filters: JobPostingFilters) => void;
}

export function JobPostingFilters({ filters, onFiltersChange }: JobPostingFiltersProps) {
  const handleReset = () => {
    onFiltersChange({});
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end">
      <div className="flex-1">
        <label className="text-sm font-medium mb-2 block">검색</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="제목, 고객명으로 검색..."
            value={filters.search || ''}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>
      </div>

      <div className="w-full md:w-48">
        <label className="text-sm font-medium mb-2 block">상태</label>
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, status: value === 'all' ? undefined : value as any })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="active">진행 중</SelectItem>
            <SelectItem value="closed">마감</SelectItem>
            <SelectItem value="matched">매칭 완료</SelectItem>
            <SelectItem value="completed">완료</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-full md:w-48">
        <label className="text-sm font-medium mb-2 block">정산 상태</label>
        <Select
          value={filters.settlement_status || 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              settlement_status: value === 'all' ? undefined : value as any,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="unsettled">미정산</SelectItem>
            <SelectItem value="pending">정산 대기</SelectItem>
            <SelectItem value="settled">정산 완료</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-full md:w-48">
        <label className="text-sm font-medium mb-2 block">근무 형태</label>
        <Select
          value={filters.workType || 'all'}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, workType: value === 'all' ? undefined : value as any })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="daily">일용직</SelectItem>
            <SelectItem value="weekly">주간</SelectItem>
            <SelectItem value="monthly">월간</SelectItem>
            <SelectItem value="long-term">장기</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" onClick={handleReset} className="md:w-auto">
        <X className="h-4 w-4 mr-2" />
        초기화
      </Button>
    </div>
  );
}
