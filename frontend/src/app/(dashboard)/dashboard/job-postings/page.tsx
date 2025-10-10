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
import { Input } from '@/components/ui/input';
import { Plus, Loader2, Eye, Pencil, Trash2, Star } from 'lucide-react';
import { jobPostingApi } from '@/lib/job-posting';
import { customerApi } from '@/lib/customer';
import { useToast } from '@/components/ui/use-toast';
import type { JobPosting, PostingStatus, SettlementStatus } from '@/types/job-posting';
import type { Customer } from '@/types/customer';

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

export default function JobPostingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [customers, setCustomers] = useState<Record<number, Customer>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [postingStatus, setPostingStatus] = useState<PostingStatus | 'ALL'>('ALL');
  const [settlement_status, setSettlementStatus] = useState<SettlementStatus | 'ALL'>('ALL');
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    posting: JobPosting | null;
  }>({ open: false, posting: null });
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadJobPostings = async () => {
    try {
      setLoading(true);

      const response = await jobPostingApi.listJobPostings({
        status: postingStatus !== 'ALL' ? postingStatus : undefined,
        settlement_status: settlement_status !== 'ALL' ? settlement_status : undefined,
        limit: 20,
        offset: (page - 1) * 20,
      });

      setJobPostings(response.job_postings);
      setTotal(response.total);

      // Load customer information for each posting
      const uniqueCustomerIds = [...new Set(response.job_postings.map(p => p.customer_id))];
      const customerMap: Record<number, Customer> = {};

      await Promise.all(
        uniqueCustomerIds.map(async (customer_id) => {
          try {
            const customer = await customerApi.getById(customer_id);
            customerMap[customer_id] = customer;
          } catch (error) {
            console.error(`Failed to load customer ${customer_id}:`, error);
          }
        })
      );

      setCustomers(customerMap);
    } catch (error) {
      console.error('Failed to load job postings:', error);
      toast({
        title: '오류',
        description: '구인 공고를 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobPostings();
  }, [searchQuery, postingStatus, settlement_status, page]);

  const handleView = (posting: JobPosting) => {
    router.push(`/dashboard/job-postings/${posting.id}`);
  };

  const handleEdit = (posting: JobPosting) => {
    router.push(`/dashboard/job-postings/${posting.id}/edit`);
  };

  const handleDeleteClick = (posting: JobPosting) => {
    setDeleteDialog({ open: true, posting });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.posting) return;

    try {
      setDeleting(true);
      await jobPostingApi.deleteJobPosting(deleteDialog.posting.id);
      toast({
        title: '성공',
        description: '구인 공고가 삭제되었습니다.',
      });
      setDeleteDialog({ open: false, posting: null });
      loadJobPostings();
    } catch (error) {
      console.error('Failed to delete job posting:', error);
      toast({
        title: '오류',
        description: '공고 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateNew = () => {
    router.push('/dashboard/job-postings/new');
  };

  const handleToggleFavorite = async (posting: JobPosting) => {
    try {
      await jobPostingApi.updateJobPosting(posting.id, {
        is_favorite: !posting.is_favorite,
      });

      // Update local state
      setJobPostings((prev) =>
        prev.map((p) =>
          p.id === posting.id ? { ...p, is_favorite: !p.is_favorite } : p
        )
      );

      toast({
        title: '성공',
        description: posting.is_favorite ? '즐겨찾기가 해제되었습니다.' : '즐겨찾기에 추가되었습니다.',
      });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast({
        title: '오류',
        description: '즐겨찾기 변경에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">구인 공고</h1>
          <p className="text-muted-foreground">
            등록된 구인 공고를 관리합니다
          </p>
        </div>
        <Button onClick={handleCreateNew} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          새 공고 등록
        </Button>
      </div>

      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex-1">
              <Input
                placeholder="공고 내용으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <Select
                value={postingStatus}
                onValueChange={(value) => setPostingStatus(value as PostingStatus | 'ALL')}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체 상태</SelectItem>
                  <SelectItem value="published">공개</SelectItem>
                  <SelectItem value="in_progress">진행중</SelectItem>
                  <SelectItem value="closed">마감</SelectItem>
                  <SelectItem value="cancelled">취소</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={settlement_status}
                onValueChange={(value) => setSettlementStatus(value as SettlementStatus | 'ALL')}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체 정산</SelectItem>
                  <SelectItem value="unsettled">미정산</SelectItem>
                  <SelectItem value="settled">정산완료</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                    <TableHead className="w-12 font-semibold"></TableHead>
                    <TableHead className="font-semibold">고객명</TableHead>
                    <TableHead className="font-semibold">급여</TableHead>
                    <TableHead className="font-semibold">설명</TableHead>
                    <TableHead className="font-semibold">공고 상태</TableHead>
                    <TableHead className="font-semibold">정산 상태</TableHead>
                    <TableHead className="font-semibold">등록일</TableHead>
                    <TableHead className="text-right font-semibold">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobPostings.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        등록된 구인 공고가 없습니다
                      </TableCell>
                    </TableRow>
                  ) : (
                    jobPostings.map((posting) => (
                      <TableRow key={posting.id} className="hover:bg-accent/50 transition-colors">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleToggleFavorite(posting)}
                          >
                            <Star
                              className={`h-4 w-4 ${
                                posting.is_favorite
                                  ? 'fill-amber-500 text-amber-500'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">
                          {customers[posting.customer_id]?.name || '-'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {parseInt(posting.salary).toLocaleString()}원
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {posting.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant={posting.posting_status === 'published' ? 'default' : 'secondary'}>
                            {postingStatusLabels[posting.posting_status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={posting.settlement_status === 'settled' ? 'default' : 'outline'}>
                            {settlement_statusLabels[posting.settlement_status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(posting.created_at).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(posting)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(posting)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(posting)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

      <Dialog open={deleteDialog.open} onOpenChange={(open) => !deleting && setDeleteDialog({ open, posting: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>공고 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 공고를 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, posting: null })}
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
