'use client';

import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Matching } from '@/types/matching';

interface MatchingTableProps {
  matchings: Matching[];
}

export function MatchingTable({ matchings }: MatchingTableProps) {
  const getStatusBadge = (status: Matching['status']) => {
    const statusConfig = {
      proposed: { label: '제안됨', variant: 'info' as const },
      accepted: { label: '수락됨', variant: 'success' as const },
      rejected: { label: '거절됨', variant: 'destructive' as const },
      in_progress: { label: '진행 중', variant: 'warning' as const },
      completed: { label: '완료', variant: 'default' as const },
      cancelled: { label: '취소됨', variant: 'secondary' as const },
    };
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getSettlementBadge = (status: Matching['settlementStatus']) => {
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

  if (matchings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        등록된 매칭이 없습니다.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>구인 공고</TableHead>
            <TableHead>구직자</TableHead>
            <TableHead>고객명</TableHead>
            <TableHead>매칭점수</TableHead>
            <TableHead>합의 급여</TableHead>
            <TableHead>예상 수수료</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>정산 상태</TableHead>
            <TableHead>매칭일</TableHead>
            <TableHead className="w-24">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matchings.map((matching) => (
            <TableRow key={matching.id}>
              <TableCell className="font-medium">
                <Link
                  href={`/dashboard/matchings/${matching.id}`}
                  className="hover:underline"
                >
                  {matching.jobPostingTitle}
                </Link>
              </TableCell>
              <TableCell>{matching.seekerName}</TableCell>
              <TableCell>{matching.customerName}</TableCell>
              <TableCell>
                <Badge variant={matching.matchScore >= 80 ? 'success' : matching.matchScore >= 60 ? 'info' : 'secondary'}>
                  {matching.matchScore}점
                </Badge>
              </TableCell>
              <TableCell>{formatCurrency(matching.agreedSalary)}</TableCell>
              <TableCell>{formatCurrency(matching.estimatedFee)}</TableCell>
              <TableCell>{getStatusBadge(matching.status)}</TableCell>
              <TableCell>{getSettlementBadge(matching.settlementStatus)}</TableCell>
              <TableCell>
                {format(new Date(matching.matchedAt), 'yyyy-MM-dd', { locale: ko })}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/matchings/${matching.id}`} aria-label={`${matching.jobPostingTitle} 매칭 상세보기`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
