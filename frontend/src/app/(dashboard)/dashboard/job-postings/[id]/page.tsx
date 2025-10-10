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
import { ArrowLeft, Star, Edit, Loader2, Tag, Trash2 } from 'lucide-react';
import { jobPostingApi } from '@/lib/job-posting';
import { customerApi } from '@/lib/customer';
import { useToast } from '@/components/ui/use-toast';
import type { JobPosting, PostingStatus, SettlementStatus } from '@/types/job-posting';
import type { Customer } from '@/types/customer';
import apiClient from '@/lib/api';

const postingStatusLabels: Record<PostingStatus, string> = {
  published: '공개',
  in_progress: '진행중',
  closed: '마감',
  cancelled: '취소',
};

const settlement_statusLabels: Record<SettlementStatus, string> = {
  unsettled: '미정산',
  settled: '정산완료',
};

interface PostingTag {
  id: number;
  name: string;
}

export default function JobPostingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [tags, setTags] = useState<PostingTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const postingId = params.id as string;

  useEffect(() => {
    const loadJobPosting = async () => {
      try {
        setLoading(true);
        const data = await jobPostingApi.getJobPostingById(parseInt(postingId));
        setJobPosting(data);

        // Load customer info
        const customerData = await customerApi.getById(data.customer_id);
        setCustomer(customerData);

        // Try to load tags (API may not be implemented yet)
        try {
          const tagsResponse = await apiClient.get(`/job-postings/${postingId}/tags`);
          setTags(tagsResponse.data.tags || []);
        } catch (tagError) {
          // Job posting tag routes not implemented yet, skip
          console.warn('Job posting tag routes not available:', tagError);
        }
      } catch (error) {
        console.error('Failed to load job posting:', error);
        toast({
          title: '오류',
          description: '구인 공고를 불러오는데 실패했습니다.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (postingId) {
      loadJobPosting();
    }
  }, [postingId, toast]);

  const handleEdit = () => {
    router.push(`/dashboard/job-postings/${postingId}/edit`);
  };

  const handleBack = () => {
    router.push('/dashboard/job-postings');
  };

  const handleDeleteClick = () => {
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await jobPostingApi.deleteJobPosting(parseInt(postingId));
      toast({
        title: '성공',
        description: '구인 공고가 삭제되었습니다.',
      });
      router.push('/dashboard/job-postings');
    } catch (error) {
      console.error('Failed to delete job posting:', error);
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

  if (!jobPosting) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">공고를 찾을 수 없습니다.</p>
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
          <h1 className="text-3xl font-bold tracking-tight">구인 공고 상세</h1>
          <p className="text-muted-foreground">
            등록일: {new Date(jobPosting.created_at).toLocaleDateString('ko-KR')}
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
              <Badge variant={jobPosting.posting_status === 'published' ? 'default' : 'secondary'}>
                {postingStatusLabels[jobPosting.posting_status]}
              </Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">정산 상태</span>
              <Badge variant={jobPosting.settlement_status === 'settled' ? 'default' : 'outline'}>
                {settlement_statusLabels[jobPosting.settlement_status]}
              </Badge>
            </div>

            <Separator />

            {jobPosting.is_favorite && (
              <>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">즐겨찾기</span>
                </div>
                <Separator />
              </>
            )}

            <div>
              <p className="text-sm text-muted-foreground">고객명</p>
              <p className="font-medium">{customer?.name || '-'}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">연락처</p>
              <p className="font-medium">{customer?.phone || '-'}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">급여</p>
              <p className="font-medium text-lg">
                {parseInt(jobPosting.salary).toLocaleString()}원
              </p>
            </div>

            {jobPosting.employer_fee_rate && (
              <div>
                <p className="text-sm text-muted-foreground">고용주 수수료율</p>
                <p className="font-medium">{jobPosting.employer_fee_rate}%</p>
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
              <Badge variant={jobPosting.settlement_status === 'settled' ? 'default' : 'outline'}>
                {settlement_statusLabels[jobPosting.settlement_status]}
              </Badge>
            </div>

            {jobPosting.settlement_amount && (
              <div>
                <p className="text-sm text-muted-foreground">정산 금액</p>
                <p className="font-medium text-lg text-green-600">
                  {parseInt(jobPosting.settlement_amount).toLocaleString()}원
                </p>
              </div>
            )}

            {jobPosting.settlement_memo && (
              <div>
                <p className="text-sm text-muted-foreground">정산 메모</p>
                <p className="text-sm whitespace-pre-wrap">{jobPosting.settlement_memo}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>공고 설명</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{jobPosting.description}</p>
        </CardContent>
      </Card>

      {tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              태그
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag.id} variant="secondary">
                  {tag.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={deleteDialog} onOpenChange={(open) => !deleting && setDeleteDialog(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>구인 공고 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 구인 공고를 삭제하시겠습니까?
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
