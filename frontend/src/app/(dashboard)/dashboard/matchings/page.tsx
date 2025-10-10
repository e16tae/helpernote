'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Eye, CheckCircle, XCircle } from 'lucide-react';
import { matchingApi } from '@/lib/matching';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, getMatchingStatusLabel, getMatchingStatusBadgeVariant } from '@/lib/format';
import type { Matching, MatchingStatus } from '@/types/matching';

export default function MatchingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [matchings, setMatchings] = useState<Matching[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingStatus, setMatchingStatus] = useState<MatchingStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: 'complete' | 'cancel' | null;
    matching: Matching | null;
  }>({ open: false, action: null, matching: null });
  const [actionProcessing, setActionProcessing] = useState(false);

  const loadMatchings = async () => {
    try {
      setLoading(true);

      const response = await matchingApi.list({
        status: matchingStatus !== 'ALL' ? matchingStatus : undefined,
        limit: 20,
        offset: (page - 1) * 20,
      });

      setMatchings(response.matchings);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load matchings:', error);
      toast({
        title: '오류',
        description: '매칭 목록을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatchings();
  }, [matchingStatus, page]);

  const handleView = (matching: Matching) => {
    router.push(`/dashboard/matchings/${matching.id}`);
  };

  const handleCreateNew = () => {
    router.push('/dashboard/matchings/new');
  };

  const handleCompleteClick = (matching: Matching) => {
    setActionDialog({ open: true, action: 'complete', matching });
  };

  const handleCancelClick = (matching: Matching) => {
    setActionDialog({ open: true, action: 'cancel', matching });
  };

  const handleActionConfirm = async () => {
    if (!actionDialog.matching || !actionDialog.action) return;

    try {
      setActionProcessing(true);

      if (actionDialog.action === 'complete') {
        await matchingApi.complete(actionDialog.matching.id);
        toast({
          title: '성공',
          description: '매칭이 완료 처리되었습니다.',
        });
      } else if (actionDialog.action === 'cancel') {
        await matchingApi.cancel(actionDialog.matching.id, {});
        toast({
          title: '성공',
          description: '매칭이 취소되었습니다.',
        });
      }

      setActionDialog({ open: false, action: null, matching: null });
      loadMatchings();
    } catch (error) {
      console.error('Failed to update matching:', error);
      toast({
        title: '오류',
        description: '매칭 상태 변경에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setActionProcessing(false);
    }
  };

  const getEmployerName = (matching: Matching) => {
    return matching.job_posting?.customer_name || `고객 #${matching.job_posting?.customer_id || matching.job_posting_id}`;
  };

  const getEmployeeName = (matching: Matching) => {
    return matching.job_seeking_posting?.customer_name || `고객 #${matching.job_seeking_posting?.customer_id || matching.job_seeking_posting_id}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">매칭 관리</h1>
          <p className="text-muted-foreground">
            구인-구직 매칭을 관리하고 수수료를 계산합니다
          </p>
        </div>
        <Button onClick={handleCreateNew} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          새 매칭 등록
        </Button>
      </div>

      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex gap-4 mb-4">
            <Select
              value={matchingStatus}
              onValueChange={(value) => setMatchingStatus(value as MatchingStatus | 'ALL')}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 상태</SelectItem>
                <SelectItem value="InProgress">진행중</SelectItem>
                <SelectItem value="Completed">완료</SelectItem>
                <SelectItem value="Cancelled">취소</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="border-2">
          <CardContent className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-2">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">고용주</TableHead>
                    <TableHead className="font-semibold">근로자</TableHead>
                    <TableHead className="font-semibold">합의 급여</TableHead>
                    <TableHead className="font-semibold">고용주 수수료</TableHead>
                    <TableHead className="font-semibold">근로자 수수료</TableHead>
                    <TableHead className="font-semibold">상태</TableHead>
                    <TableHead className="font-semibold">매칭일</TableHead>
                    <TableHead className="text-right font-semibold">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matchings.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        등록된 매칭이 없습니다
                      </TableCell>
                    </TableRow>
                  ) : (
                    matchings.map((matching) => (
                      <TableRow key={matching.id} className="hover:bg-accent/50 transition-colors">
                        <TableCell className="font-medium">
                          {getEmployerName(matching)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {getEmployeeName(matching)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(parseFloat(matching.agreed_salary))}
                        </TableCell>
                        <TableCell>
                          {matching.employer_fee_amount
                            ? formatCurrency(parseFloat(matching.employer_fee_amount))
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {matching.employee_fee_amount
                            ? formatCurrency(parseFloat(matching.employee_fee_amount))
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant={getMatchingStatusBadgeVariant(matching.matching_status)}>
                            {getMatchingStatusLabel(matching.matching_status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(matching.matched_at).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(matching)}
                              title="상세보기"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {matching.matching_status === 'InProgress' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCompleteClick(matching)}
                                  title="완료"
                                  className="hover:bg-primary/10 hover:text-primary"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancelClick(matching)}
                                  title="취소"
                                  className="hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {total > 20 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                이전
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {Math.ceil(total / 20)}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / 20)}
              >
                다음
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) => !actionProcessing && setActionDialog({ open, action: null, matching: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'complete' ? '매칭 완료' : '매칭 취소'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === 'complete'
                ? '이 매칭을 완료 처리하시겠습니까? 완료된 매칭은 정산 단계로 넘어갑니다.'
                : '이 매칭을 취소하시겠습니까? 취소된 매칭은 다시 활성화할 수 없습니다.'
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ open: false, action: null, matching: null })}
              disabled={actionProcessing}
            >
              취소
            </Button>
            <Button
              variant={actionDialog.action === 'complete' ? 'default' : 'destructive'}
              onClick={handleActionConfirm}
              disabled={actionProcessing}
            >
              {actionProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : actionDialog.action === 'complete' ? '완료' : '취소'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
