'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, CheckCircle, XCircle, Loader2, Plus, MessageSquare, Calculator, User, Briefcase } from 'lucide-react';
import { matchingApi } from '@/lib/matching';
import { jobPostingApi } from '@/lib/job-posting';
import { customerApi } from '@/lib/customer';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, getMatchingStatusLabel, getMatchingStatusBadgeVariant } from '@/lib/format';
import type { Matching } from '@/types/matching';
import type { JobPosting, JobSeekingPosting } from '@/types/job-posting';
import type { Customer } from '@/types/customer';
import apiClient from '@/lib/api';

interface MatchingMemo {
  id: number;
  matching_id: number;
  memo_content: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export default function MatchingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [matching, setMatching] = useState<Matching | null>(null);
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [jobSeeking, setJobSeeking] = useState<JobSeekingPosting | null>(null);
  const [employer, setEmployer] = useState<Customer | null>(null);
  const [employee, setEmployee] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [completing, setCompleting] = useState(false);
  const [memos, setMemos] = useState<MatchingMemo[]>([]);
  const [newMemo, setNewMemo] = useState('');
  const [addingMemo, setAddingMemo] = useState(false);

  const matchingId = params.id as string;

  useEffect(() => {
    const loadMatching = async () => {
      try {
        setLoading(true);
        const data = await matchingApi.getById(parseInt(matchingId));
        setMatching(data);

        // Load related data
        const [postingData, seekingData] = await Promise.all([
          jobPostingApi.getJobPostingById(data.job_posting_id),
          jobPostingApi.getJobSeekingById(data.job_seeking_posting_id),
        ]);

        setJobPosting(postingData);
        setJobSeeking(seekingData);

        // Load customer data
        const [employerData, employeeData] = await Promise.all([
          customerApi.getById(postingData.customer_id),
          customerApi.getById(seekingData.customer_id),
        ]);

        setEmployer(employerData);
        setEmployee(employeeData);

        // Load memos
        await loadMemos();
      } catch (error) {
        console.error('Failed to load matching:', error);
        toast({
          title: '오류',
          description: '매칭 정보를 불러오는데 실패했습니다.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (matchingId) {
      loadMatching();
    }
  }, [matchingId, toast]);

  const loadMemos = async () => {
    try {
      const response = await apiClient.get(`/matchings/${matchingId}/memos`);
      setMemos(response.data.memos || []);
    } catch (error) {
      console.error('Failed to load memos:', error);
    }
  };

  const handleAddMemo = async () => {
    if (!newMemo.trim()) return;

    try {
      setAddingMemo(true);
      await apiClient.post(`/matchings/${matchingId}/memos`, {
        matching_id: parseInt(matchingId),
        memo_content: newMemo,
      });
      setNewMemo('');
      await loadMemos();
      toast({
        title: '성공',
        description: '메모가 추가되었습니다.',
      });
    } catch (error) {
      console.error('Failed to add memo:', error);
      toast({
        title: '오류',
        description: '메모 추가에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setAddingMemo(false);
    }
  };

  const handleComplete = async () => {
    if (!matching) return;

    try {
      setCompleting(true);
      await matchingApi.complete(matching.id);
      toast({
        title: '성공',
        description: '매칭이 완료 처리되었습니다.',
      });
      // Reload matching data
      const data = await matchingApi.getById(matching.id);
      setMatching(data);
    } catch (error) {
      console.error('Failed to complete matching:', error);
      toast({
        title: '오류',
        description: '매칭 완료 처리에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setCompleting(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!matching) return;

    try {
      setCancelling(true);
      await matchingApi.cancel(matching.id, {
        cancellation_reason: cancelReason || undefined,
      });
      toast({
        title: '성공',
        description: '매칭이 취소되었습니다.',
      });
      setCancelDialog(false);
      // Reload matching data
      const data = await matchingApi.getById(matching.id);
      setMatching(data);
    } catch (error) {
      console.error('Failed to cancel matching:', error);
      toast({
        title: '오류',
        description: '매칭 취소에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/matchings');
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!matching) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">매칭을 찾을 수 없습니다.</p>
          <Button onClick={handleBack} className="mt-4">
            목록으로
          </Button>
        </div>
      </div>
    );
  }

  const totalFees = matching.employer_fee_amount && matching.employee_fee_amount
    ? parseFloat(matching.employer_fee_amount) + parseFloat(matching.employee_fee_amount)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">매칭 상세 정보</h1>
          <p className="text-muted-foreground">
            매칭일: {new Date(matching.matched_at).toLocaleDateString('ko-KR')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getMatchingStatusBadgeVariant(matching.matching_status)} className="text-base px-3 py-1">
            {getMatchingStatusLabel(matching.matching_status)}
          </Badge>
          {matching.matching_status === 'InProgress' && (
            <>
              <Button
                variant="outline"
                onClick={() => setCancelDialog(true)}
                disabled={completing}
              >
                <XCircle className="mr-2 h-4 w-4" />
                취소
              </Button>
              <Button onClick={handleComplete} disabled={completing}>
                {completing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    완료
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Customer Information Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              고용주 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {employer && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">이름</p>
                  <p className="font-semibold text-lg">{employer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">전화번호</p>
                  <p className="font-medium">{employer.phone}</p>
                </div>
                {employer.address && (
                  <div>
                    <p className="text-sm text-muted-foreground">주소</p>
                    <p className="text-sm">{employer.address}</p>
                  </div>
                )}
              </>
            )}
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">구인 공고</p>
              <p className="font-medium">#{matching.job_posting_id}</p>
              {jobPosting && (
                <p className="text-sm text-muted-foreground mt-1">
                  {jobPosting.description.substring(0, 50)}...
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              근로자 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {employee && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">이름</p>
                  <p className="font-semibold text-lg">{employee.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">전화번호</p>
                  <p className="font-medium">{employee.phone}</p>
                </div>
                {employee.address && (
                  <div>
                    <p className="text-sm text-muted-foreground">주소</p>
                    <p className="text-sm">{employee.address}</p>
                  </div>
                )}
              </>
            )}
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">구직 공고</p>
              <p className="font-medium">#{matching.job_seeking_posting_id}</p>
              {jobSeeking && (
                <p className="text-sm text-muted-foreground mt-1">
                  {jobSeeking.description.substring(0, 50)}...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fee Calculation Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            급여 및 수수료 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">합의 급여</p>
              <p className="font-bold text-2xl">
                {formatCurrency(parseFloat(matching.agreed_salary))}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">고용주 수수료</p>
              <p className="font-semibold text-xl text-green-600">
                {matching.employer_fee_amount
                  ? formatCurrency(parseFloat(matching.employer_fee_amount))
                  : '-'
                }
              </p>
              <p className="text-xs text-muted-foreground">
                수수료율: {matching.employer_fee_rate}%
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">근로자 수수료</p>
              <p className="font-semibold text-xl text-green-600">
                {matching.employee_fee_amount
                  ? formatCurrency(parseFloat(matching.employee_fee_amount))
                  : '-'
                }
              </p>
              <p className="text-xs text-muted-foreground">
                수수료율: {matching.employee_fee_rate}%
              </p>
            </div>
          </div>

          {totalFees > 0 && (
            <>
              <Separator className="my-4" />
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">총 수수료</p>
                <p className="font-bold text-3xl text-green-600">
                  {formatCurrency(totalFees)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  고용주 {formatCurrency(parseFloat(matching.employer_fee_amount || '0'))} +
                  근로자 {formatCurrency(parseFloat(matching.employee_fee_amount || '0'))}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Status Information */}
      {(matching.matching_status === 'Completed' || matching.matching_status === 'Cancelled') && (
        <Card>
          <CardHeader>
            <CardTitle>상태 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {matching.matching_status === 'Completed' && matching.completed_at && (
              <div>
                <p className="text-sm text-muted-foreground">완료일</p>
                <p className="font-medium">
                  {new Date(matching.completed_at).toLocaleString('ko-KR')}
                </p>
              </div>
            )}

            {matching.matching_status === 'Cancelled' && (
              <>
                {matching.cancelled_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">취소일</p>
                    <p className="font-medium">
                      {new Date(matching.cancelled_at).toLocaleString('ko-KR')}
                    </p>
                  </div>
                )}
                {matching.cancellation_reason && (
                  <div>
                    <p className="text-sm text-muted-foreground">취소 사유</p>
                    <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                      {matching.cancellation_reason}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Memos Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              메모
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new memo */}
          <div className="space-y-2">
            <Textarea
              placeholder="새 메모를 입력하세요..."
              value={newMemo}
              onChange={(e) => setNewMemo(e.target.value)}
              className="min-h-[80px]"
            />
            <Button
              onClick={handleAddMemo}
              disabled={!newMemo.trim() || addingMemo}
              size="sm"
            >
              {addingMemo ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  추가 중...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  메모 추가
                </>
              )}
            </Button>
          </div>

          <Separator />

          {/* Memos list */}
          <div className="space-y-3">
            {memos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                등록된 메모가 없습니다
              </p>
            ) : (
              memos.map((memo) => (
                <div
                  key={memo.id}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <p className="text-sm whitespace-pre-wrap">{memo.memo_content}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(memo.created_at).toLocaleString('ko-KR')}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>매칭 취소</DialogTitle>
            <DialogDescription>
              이 매칭을 취소하시겠습니까? 취소 사유를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="취소 사유를 입력하세요 (선택사항)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialog(false)}
              disabled={cancelling}
            >
              닫기
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={cancelling}
            >
              {cancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  취소 중...
                </>
              ) : (
                '취소 확인'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
