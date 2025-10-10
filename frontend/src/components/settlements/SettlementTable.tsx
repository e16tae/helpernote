'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Settlement } from '@/types/settlement';

interface SettlementTableProps {
  settlements: Settlement[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export function SettlementTable({ settlements, onApprove, onReject }: SettlementTableProps) {
  const getStatusBadge = (status: Settlement['status']) => {
    const statusConfig = {
      pending: { label: '대기 중', variant: 'warning' as const },
      approved: { label: '승인됨', variant: 'info' as const },
      paid: { label: '지급 완료', variant: 'success' as const },
      cancelled: { label: '취소됨', variant: 'destructive' as const },
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

  if (settlements.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        정산 내역이 없습니다.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>구인 공고</TableHead>
            <TableHead>고객명</TableHead>
            <TableHead>구직자명</TableHead>
            <TableHead>근무 일수</TableHead>
            <TableHead>총 급여</TableHead>
            <TableHead>수수료율</TableHead>
            <TableHead>최종 수수료</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>생성일</TableHead>
            <TableHead className="w-32">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {settlements.map((settlement) => (
            <TableRow key={settlement.id}>
              <TableCell className="font-medium">
                {settlement.jobPostingTitle}
              </TableCell>
              <TableCell>{settlement.customerName}</TableCell>
              <TableCell>{settlement.seekerName}</TableCell>
              <TableCell>{settlement.actualWorkDays}일</TableCell>
              <TableCell>{formatCurrency(settlement.totalSalary)}</TableCell>
              <TableCell>{settlement.feeRate}%</TableCell>
              <TableCell className="font-bold text-green-600">
                {formatCurrency(settlement.finalFee)}
              </TableCell>
              <TableCell>{getStatusBadge(settlement.status)}</TableCell>
              <TableCell>
                {format(new Date(settlement.createdAt), 'yyyy-MM-dd', { locale: ko })}
              </TableCell>
              <TableCell>
                {settlement.status === 'pending' && (
                  <div className="flex items-center gap-1">
                    {onApprove && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onApprove(settlement.id)}
                        title="승인"
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    {onReject && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReject(settlement.id)}
                        title="거절"
                      >
                        <XCircle className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
