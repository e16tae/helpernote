"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Pencil, Trash2, Star, User, DollarSign, Calendar, FileText } from "lucide-react";
import { getErrorMessage } from "@/lib/api-client";
import { customerApi } from "@/lib/customer";
import { jobPostingApi } from "@/lib/job-posting";
import { JobPosting } from "@/types/job-posting";
import { Customer } from "@/types/customer";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const postingStatusMap = {
  Published: { label: "게시됨", variant: "default" as const },
  InProgress: { label: "진행중", variant: "secondary" as const },
  Closed: { label: "마감", variant: "outline" as const },
  Cancelled: { label: "취소됨", variant: "destructive" as const },
};

const settlementStatusMap = {
  Unsettled: { label: "미정산", variant: "destructive" as const },
  Settled: { label: "정산완료", variant: "default" as const },
};

export default function JobPostingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [posting, setPosting] = useState<JobPosting | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);

  useEffect(() => {
    fetchJobPosting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchJobPosting = async () => {
    try {
      setLoading(true);
      const postingData = await jobPostingApi.getById(parseInt(id));
      setPosting(postingData);

      // Load customer info
      try {
        const customerData = await customerApi.getById(postingData.customer_id);
        setCustomer(customerData);
      } catch (err) {
        console.error("Failed to fetch customer:", err);
      }
    } catch (error) {
      console.error("Failed to fetch job posting:", error);
      const errorMessage = getErrorMessage(error);
      toast({
        variant: "destructive",
        title: "오류",
        description: errorMessage,
      });
      router.push("/dashboard/job-postings");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setDeleteItemId(parseInt(id));
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteItemId === null) return;

    try {
      await jobPostingApi.delete(deleteItemId);
      toast({
        title: "성공",
        description: "구인 공고가 삭제되었습니다.",
      });
      router.push("/dashboard/job-postings");
    } catch (error) {
      console.error("Failed to delete job posting:", error);
      const errorMessage = getErrorMessage(error);
      toast({
        variant: "destructive",
        title: "오류",
        description: errorMessage,
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteItemId(null);
    }
  };

  const toggleFavorite = async () => {
    if (!posting) return;

    try {
      await jobPostingApi.update(parseInt(id), { is_favorite: !posting.is_favorite });
      fetchJobPosting();
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!posting) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">구인 공고를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/job-postings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">구인 공고 상세</h1>
            <p className="text-muted-foreground">구인 공고의 상세 정보를 확인합니다</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={toggleFavorite}>
            <Star
              className={`h-4 w-4 ${
                posting.is_favorite ? "fill-yellow-400 text-yellow-400" : ""
              }`}
            />
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/job-postings/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              수정
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            삭제
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
            <CardDescription>구인 공고의 기본 정보입니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="mt-1 h-5 w-5 text-muted-foreground" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">구인자</p>
                <p className="text-sm text-muted-foreground">
                  {customer ? customer.name : "로딩 중..."}
                </p>
                {customer && customer.phone && (
                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                )}
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <DollarSign className="mt-1 h-5 w-5 text-muted-foreground" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">제시 급여</p>
                <p className="text-lg font-bold">{formatCurrency(posting.salary)}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <FileText className="mt-1 h-5 w-5 text-muted-foreground" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">공고 설명</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {posting.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>상태 및 정산 정보</CardTitle>
            <CardDescription>공고 및 정산 상태 정보입니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">공고 상태</p>
              <Badge variant={postingStatusMap[posting.posting_status].variant}>
                {postingStatusMap[posting.posting_status].label}
              </Badge>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">정산 상태</p>
              <Badge variant={settlementStatusMap[posting.settlement_status].variant}>
                {settlementStatusMap[posting.settlement_status].label}
              </Badge>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">수수료율</p>
              <p className="text-sm text-muted-foreground">
                {posting.employer_fee_rate !== null
                  ? `${posting.employer_fee_rate}%`
                  : "기본 수수료율 적용"}
              </p>
            </div>
            {posting.settlement_amount !== null && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">정산 금액</p>
                  <p className="text-lg font-bold">{formatCurrency(posting.settlement_amount)}</p>
                </div>
              </>
            )}
            {posting.settlement_memo && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">정산 메모</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {posting.settlement_memo}
                  </p>
                </div>
              </>
            )}
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">즐겨찾기</p>
              <p className="text-sm text-muted-foreground">
                {posting.is_favorite ? "예" : "아니오"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>시간 정보</CardTitle>
            <CardDescription>등록 및 수정 시간 정보입니다</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Calendar className="mt-1 h-5 w-5 text-muted-foreground" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">등록일시</p>
                <p className="text-sm text-muted-foreground">{formatDateTime(posting.created_at)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="mt-1 h-5 w-5 text-muted-foreground" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">수정일시</p>
                <p className="text-sm text-muted-foreground">{formatDateTime(posting.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="구인 공고 삭제"
        description="정말 이 구인 공고를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      />
    </div>
  );
}
