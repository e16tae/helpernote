'use client';

import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { JobSeeking } from '@/types/job-posting';

interface JobSeekingTableProps {
  jobSeekings: JobSeeking[];
  onDelete: (id: string) => void;
}

export function JobSeekingTable({ jobSeekings, onDelete }: JobSeekingTableProps) {
  const getStatusBadge = (status: JobSeeking['status']) => {
    const statusConfig = {
      active: { label: '구직 중', variant: 'success' as const },
      inactive: { label: '비활성', variant: 'secondary' as const },
      matched: { label: '매칭 완료', variant: 'info' as const },
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

  if (jobSeekings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        등록된 구직 공고가 없습니다.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>구직자명</TableHead>
            <TableHead>제목</TableHead>
            <TableHead>나이/성별</TableHead>
            <TableHead>연락처</TableHead>
            <TableHead>희망 근무 형태</TableHead>
            <TableHead>희망 급여</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>등록일</TableHead>
            <TableHead className="w-32">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobSeekings.map((seeking) => (
            <TableRow key={seeking.id}>
              <TableCell className="font-medium">
                <Link
                  href={`/dashboard/job-seekers/${seeking.id}`}
                  className="hover:underline"
                >
                  {seeking.seekerName}
                </Link>
              </TableCell>
              <TableCell>{seeking.title}</TableCell>
              <TableCell>
                {seeking.age}세 / {seeking.gender === 'male' ? '남' : seeking.gender === 'female' ? '여' : '기타'}
              </TableCell>
              <TableCell>{seeking.seekerPhone}</TableCell>
              <TableCell>
                {seeking.preferredWorkType.map((type) => {
                  const labels: Record<string, string> = {
                    daily: '일용직',
                    weekly: '주간',
                    monthly: '월간',
                    'long-term': '장기',
                  };
                  return labels[type];
                }).join(', ')}
              </TableCell>
              <TableCell>
                {formatCurrency(seeking.expectedSalary)}
                {seeking.salaryType === 'hourly' && '/시간'}
                {seeking.salaryType === 'daily' && '/일'}
                {seeking.salaryType === 'monthly' && '/월'}
              </TableCell>
              <TableCell>{getStatusBadge(seeking.status)}</TableCell>
              <TableCell>
                {format(new Date(seeking.createdAt), 'yyyy-MM-dd', { locale: ko })}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/job-seekers/${seeking.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(seeking.id)}
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
