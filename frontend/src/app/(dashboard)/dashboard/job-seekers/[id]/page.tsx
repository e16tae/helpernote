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
import { ArrowLeft, Star, Edit, Loader2, Trash2 } from 'lucide-react';
import { jobPostingApi } from '@/lib/job-posting';
import { customerApi } from '@/lib/customer';
import { useToast } from '@/components/ui/use-toast';
import type { JobSeekingPosting, PostingStatus, SettlementStatus } from '@/types/job-posting';
import type { Customer } from '@/types/customer';
import apiClient from '@/lib/api';

const postingStatusLabels: Record<PostingStatus, string> = {
  published: '공개',
  in_progress: '진행중',
  closed: '마감',
  cancelled: '취소',
};

const settlementStatusLabels: Record<SettlementStatus, string> = {
  unsettled: '미정산',
  settled: '정산완료',
};

export default function JobSeekingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [jobSeeking, setJobSeeking] = useState<JobSeekingPosting | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<{ id: number; name: string }[]>([]);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const seekingId = params.id as string;

  useEffect(() => {
    const loadJobSeeking = async () => {
      try {
        setLoading(true);
        const data = await jobPostingApi.getJobSeekingById(parseInt(seekingId));
        setJobSeeking(data);

        // Load customer info and tags
        const [customerData] = await Promise.all([
          customerApi.getById(data.customer_id),
          loadTags(),
        ]);
        setCustomer(customerData);
      } catch (error) {
        console.error('Failed to load job seeking:', error);
        toast({
          title: '오류',
          description: '구직 공고를 불러오는데 실패했습니다.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (seekingId) {
      loadJobSeeking();
    }
  }, [seekingId, toast]);

  const loadTags = async () => {
    try {
      const response = await apiClient.get(`/job-seekings/${seekingId}/tags`);
      setTags(response.data.tags || []);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/job-seekers/${seekingId}/edit`);
  };

  const handleBack = () => {
    router.push('/dashboard/job-seekers');
  };

  const handleDeleteClick = () => {
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await jobPostingApi.deleteJobSeeking(parseInt(seekingId));
      toast({
        title: '성공',
        description: '구직 공고가 삭제되었습니다.',
      });
      router.push('/dashboard/job-seekers');
    } catch (error) {
      console.error('Failed to delete job seeking:', error);
      toast({
        title: '오류',
        description: '공고 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!jobSeeking) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">구직 공고를 찾을 수 없습니다.</p>
          <Button onClick={handleBack} className="mt-4">
            목록으로
          </Button>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold tracking-tight">구직 공고 상세</h1>
          <p className="text-muted-foreground">
            등록일: {new Date(jobSeeking.created_at).toLocaleDateString('ko-KR')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            수정
          </Button>
          <Button variant="destructive" onClick={handleDeleteClick}>
            <Trash2 className="mr-2 h-4 w-4" />
            삭제
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">공고 상태</span>
              <Badge variant={jobSeeking.posting_status === 'published' ? 'default' : 'secondary'}>
                {postingStatusLabels[jobSeeking.posting_status]}
              </Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">정산 상태</span>
              <Badge variant={jobSeeking.settlement_status === 'settled' ? 'default' : 'outline'}>
                {settlementStatusLabels[jobSeeking.settlement_status]}
              </Badge>
            </div>

            <Separator />

            {jobSeeking.is_favorite && (
              <>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">즐겨찾기</span>
                </div>
                <Separator />
              </>
            )}

            <div>
              <p className="text-sm text-muted-foreground">구직자명</p>
              <p className="font-medium">{customer?.name || '-'}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">연락처</p>
              <p className="font-medium">{customer?.phone || '-'}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">희망 급여</p>
              <p className="font-medium text-lg">
                {parseInt(jobSeeking.desired_salary).toLocaleString()}원
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">선호 지역</p>
              <p className="font-medium">{jobSeeking.preferred_location}</p>
            </div>

            {jobSeeking.employee_fee_rate && (
              <div>
                <p className="text-sm text-muted-foreground">근로자 수수료율</p>
                <p className="font-medium">{jobSeeking.employee_fee_rate}%</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>정산 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">정산 상태</p>
              <Badge variant={jobSeeking.settlement_status === 'settled' ? 'default' : 'outline'}>
                {settlementStatusLabels[jobSeeking.settlement_status]}
              </Badge>
            </div>

            {jobSeeking.settlement_amount && (
              <div>
                <p className="text-sm text-muted-foreground">정산 금액</p>
                <p className="font-medium text-lg text-green-600">
                  {parseInt(jobSeeking.settlement_amount).toLocaleString()}원
                </p>
              </div>
            )}

            {jobSeeking.settlement_memo && (
              <div>
                <p className="text-sm text-muted-foreground">정산 메모</p>
                <p className="text-sm whitespace-pre-wrap">{jobSeeking.settlement_memo}</p>
              </div>
            )}

            <Separator />

            <div>
              <p className="text-sm font-medium mb-2">태그</p>
              {tags.length === 0 ? (
                <p className="text-sm text-muted-foreground">연결된 태그가 없습니다.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>공고 설명</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{jobSeeking.description}</p>
        </CardContent>
      </Card>

      <Dialog open={deleteDialog} onOpenChange={(open) => !deleting && setDeleteDialog(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>구직 공고 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 구직 공고를 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog(false)}
              disabled={deleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  삭제 중...
                </>
              ) : (
                '삭제'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
