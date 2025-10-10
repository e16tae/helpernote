'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Star, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { JobPosting } from '@/types/job-posting';

interface JobPostingTableProps {
  jobPostings: JobPosting[];
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}

export function JobPostingTable({ jobPostings, onToggleFavorite, onDelete }: JobPostingTableProps) {
  const getStatusBadge = (status: JobPosting['status']) => {
    const statusConfig = {
      active: { label: '진행 중', variant: 'success' as const },
      closed: { label: '마감', variant: 'secondary' as const },
      matched: { label: '매칭 완료', variant: 'info' as const },
      completed: { label: '완료', variant: 'default' as const },
    };
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getSettlementBadge = (status: JobPosting['settlementStatus']) => {
    const statusConfig = {
      unsettled: { label: '미정산', variant: 'warning' as const },
      pending: { label: '정산 대기', variant: 'info' as const },
      settled: { label: '정산 완료', variant: 'success' as const },
    };
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  if (jobPostings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        등록된 구인 공고가 없습니다.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>제목</TableHead>
            <TableHead>고객명</TableHead>
            <TableHead>근무지</TableHead>
            <TableHead>근무 형태</TableHead>
            <TableHead>급여</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>정산 상태</TableHead>
            <TableHead>예상 수수료</TableHead>
            <TableHead>작성일</TableHead>
            <TableHead className="w-32">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobPostings.map((posting) => (
            <TableRow key={posting.id}>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleFavorite(posting.id)}
                  className="h-8 w-8 p-0"
                  aria-label={posting.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                >
                  <Star
                    className={`h-4 w-4 ${
                      posting.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''
                    }`}
                  />
                </Button>
              </TableCell>
              <TableCell className="font-medium">
                <Link
                  href={`/dashboard/job-postings/${posting.id}`}
                  className="hover:underline"
                >
                  {posting.title}
                </Link>
              </TableCell>
              <TableCell>{posting.customerName}</TableCell>
              <TableCell>{posting.location}</TableCell>
              <TableCell>
                {posting.workType === 'daily' && '일용직'}
                {posting.workType === 'weekly' && '주간'}
                {posting.workType === 'monthly' && '월간'}
                {posting.workType === 'long-term' && '장기'}
              </TableCell>
              <TableCell>
                {formatCurrency(posting.salary)}
                {posting.salaryType === 'hourly' && '/시간'}
                {posting.salaryType === 'daily' && '/일'}
                {posting.salaryType === 'monthly' && '/월'}
              </TableCell>
              <TableCell>{getStatusBadge(posting.status)}</TableCell>
              <TableCell>{getSettlementBadge(posting.settlementStatus)}</TableCell>
              <TableCell>{formatCurrency(posting.estimatedFee)}</TableCell>
              <TableCell>
                {format(new Date(posting.createdAt), 'yyyy-MM-dd', { locale: ko })}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/job-postings/${posting.id}`} aria-label={`${posting.title} 상세보기`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(posting.id)}
                    aria-label={`${posting.title} 삭제`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
