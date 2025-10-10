'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Plus, Loader2, Eye, Pencil, Trash2, Star } from 'lucide-react';
import { jobPostingApi } from '@/lib/job-posting';
import { customerApi } from '@/lib/customer';
import { useToast } from '@/components/ui/use-toast';
import type { JobSeekingPosting, PostingStatus, SettlementStatus } from '@/types/job-posting';
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

export default function JobSeekersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [jobSeekings, setJobSeekings] = useState<JobSeekingPosting[]>([]);
  const [customers, setCustomers] = useState<Map<number, Customer>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [postingStatus, setPostingStatus] = useState<PostingStatus | 'ALL'>('ALL');
  const [settlement_status, setSettlementStatus] = useState<SettlementStatus | 'ALL'>('ALL');
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    posting: JobSeekingPosting | null;
  }>({ open: false, posting: null });
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadJobSeekings = async () => {
    try {
      setLoading(true);

      const response = await jobPostingApi.listJobSeekings({
        status: postingStatus !== 'ALL' ? postingStatus : undefined,
        settlement_status: settlement_status !== 'ALL' ? settlement_status : undefined,
        preferred_location: locationFilter || undefined,
        limit: 20,
        offset: (page - 1) * 20,
      });

      setJobSeekings(response.job_seekings);
      setTotal(response.total);

      // Load customer data for all job seekings
      const customer_ids = [...new Set(response.job_seekings.map(js => js.customer_id))];
      const customerMap = new Map<number, Customer>();

      await Promise.all(
        customer_ids.map(async (id) => {
          try {
            const customer = await customerApi.getById(id);
            customerMap.set(id, customer);
          } catch (error) {
            console.error(`Failed to load customer ${id}:`, error);
          }
        })
      );

      setCustomers(customerMap);
    } catch (error) {
      console.error('Failed to load job seekings:', error);
      toast({
        title: '오류',
        description: '구직 공고를 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobSeekings();
  }, [postingStatus, settlement_status, locationFilter, page]);

  const handleView = (posting: JobSeekingPosting) => {
    router.push(`/dashboard/job-seekers/${posting.id}`);
  };

  const handleEdit = (posting: JobSeekingPosting) => {
    router.push(`/dashboard/job-seekers/${posting.id}/edit`);
  };

  const handleDeleteClick = (posting: JobSeekingPosting) => {
    setDeleteDialog({ open: true, posting });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.posting) return;

    try {
      setDeleting(true);
      await jobPostingApi.deleteJobSeeking(deleteDialog.posting.id);
      toast({
        title: '성공',
        description: '구직 공고가 삭제되었습니다.',
      });
      setDeleteDialog({ open: false, posting: null });
      loadJobSeekings();
    } catch (error) {
      console.error('Failed to delete job seeking:', error);
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
    router.push('/dashboard/job-seekers/new');
  };

  const handleToggleFavorite = async (posting: JobSeekingPosting) => {
    try {
      await jobPostingApi.updateJobSeeking(posting.id, {
        is_favorite: !posting.is_favorite,
      });
      toast({
        title: '성공',
        description: posting.is_favorite ? '즐겨찾기에서 제거되었습니다.' : '즐겨찾기에 추가되었습니다.',
      });
      loadJobSeekings();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast({
        title: '오류',
        description: '즐겨찾기 변경에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadJobSeekings();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">구직 공고</h1>
          <p className="text-muted-foreground">
            등록된 구직 공고를 관리합니다
          </p>
        </div>
        <Button onClick={handleCreateNew} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          새 구직 공고 등록
        </Button>
      </div>

      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="구직자 이름으로 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch}>검색</Button>
            </div>
            <div className="flex gap-4">
              <Input
                placeholder="선호 지역 필터 (예: 서울)"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="flex-1"
              />
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
                    <TableHead className="font-semibold">구직자명</TableHead>
                    <TableHead className="font-semibold">희망 급여</TableHead>
                    <TableHead className="font-semibold">선호 지역</TableHead>
                    <TableHead className="font-semibold">설명</TableHead>
                    <TableHead className="font-semibold">공고 상태</TableHead>
                    <TableHead className="font-semibold">정산 상태</TableHead>
                    <TableHead className="font-semibold">등록일</TableHead>
                    <TableHead className="text-right font-semibold">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobSeekings.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        등록된 구직 공고가 없습니다
                      </TableCell>
                    </TableRow>
                  ) : (
                    jobSeekings.map((posting) => {
                      const customer = customers.get(posting.customer_id);
                      return (
                        <TableRow key={posting.id} className="hover:bg-accent/50 transition-colors">
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
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
                            {customer?.name || '-'}
                          </TableCell>
                          <TableCell className="font-medium">
                            {parseInt(posting.desired_salary).toLocaleString()}원
                          </TableCell>
                          <TableCell>{posting.preferred_location}</TableCell>
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
                      );
                    })
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
            <DialogTitle>구직 공고 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 구직 공고를 삭제하시겠습니까?
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
