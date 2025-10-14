"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye, Pencil, Trash2 } from "lucide-react";
import { getErrorMessage } from "@/lib/api-client";
import { MatchingStatus } from "@/types/matching";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { formatCurrencyFromString } from "@/lib/utils/currency";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { usePagination } from "@/hooks/use-pagination";
import { useCustomers } from "@/hooks/queries/use-customers";
import { useJobPostings } from "@/hooks/queries/use-job-postings";
import { useJobSeekings } from "@/hooks/queries/use-job-seekings";
import { useMatchings, useDeleteMatching } from "@/hooks/queries/use-matchings";
import { ResponsiveDataList, Column } from "@/components/ui/responsive-data-list";

const matchingStatusMap: Record<MatchingStatus, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  InProgress: { label: "진행중", variant: "secondary" },
  Completed: { label: "완료됨", variant: "default" },
  Cancelled: { label: "취소됨", variant: "destructive" },
};

export default function MatchingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);

  // React Query hooks
  const { data: matchings = [], isLoading: isLoadingMatchings } = useMatchings();
  const { data: customers = [], isLoading: isLoadingCustomers } = useCustomers();
  const { data: jobPostings = [], isLoading: isLoadingPostings } = useJobPostings();
  const { data: jobSeekings = [], isLoading: isLoadingSeekings } = useJobSeekings();
  const deleteMutation = useDeleteMatching();

  const loading = isLoadingMatchings || isLoadingCustomers || isLoadingPostings || isLoadingSeekings;

  // Create maps using useMemo for performance
  const customerMap = useMemo(() => {
    return new Map(customers.map(c => [c.id, c.name]));
  }, [customers]);

  const jobPostingMap = useMemo(() => {
    return new Map(jobPostings.map(p => [p.id, p]));
  }, [jobPostings]);

  const jobSeekingMap = useMemo(() => {
    return new Map(jobSeekings.map(s => [s.id, s]));
  }, [jobSeekings]);

  const handleDelete = (id: number) => {
    setDeleteItemId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteItemId === null) return;

    deleteMutation.mutate(deleteItemId, {
      onSuccess: () => {
        toast({
          title: "성공",
          description: "매칭이 삭제되었습니다.",
        });
        setDeleteDialogOpen(false);
        setDeleteItemId(null);
      },
      onError: (error) => {
        const errorMessage = getErrorMessage(error);
        toast({
          variant: "destructive",
          title: "오류",
          description: errorMessage,
        });
        setDeleteDialogOpen(false);
        setDeleteItemId(null);
      },
    });
  };

  const filteredMatchings = matchings.filter((matching) => {
    const jobPosting = jobPostingMap.get(matching.job_posting_id);
    const jobSeeking = jobSeekingMap.get(matching.job_seeking_posting_id);

    const employerName = jobPosting ? customerMap.get(jobPosting.customer_id) || "" : "";
    const employeeName = jobSeeking ? customerMap.get(jobSeeking.customer_id) || "" : "";

    const matchesSearch =
      employerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jobPosting?.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jobSeeking?.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || matching.matching_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const {
    paginatedItems: paginatedMatchings,
    currentPage,
    totalPages,
    setCurrentPage,
  } = usePagination({
    items: filteredMatchings,
    itemsPerPage: 10,
    resetDependencies: [searchTerm, statusFilter],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR");
  };

  // Define columns for ResponsiveDataList
  interface MatchingWithNames {
    id: number;
    employerName: string;
    employeeName: string;
    agreed_salary: number | string;
    employer_fee_rate: number;
    employer_fee_amount: number | string | null;
    employee_fee_rate: number;
    employee_fee_amount: number | string | null;
    matching_status: MatchingStatus;
    matched_at: string;
  }

  const matchingsWithNames: MatchingWithNames[] = paginatedMatchings.map((matching) => {
    const jobPosting = jobPostingMap.get(matching.job_posting_id);
    const jobSeeking = jobSeekingMap.get(matching.job_seeking_posting_id);
    const employerName = jobPosting ? customerMap.get(jobPosting.customer_id) || "알 수 없음" : "알 수 없음";
    const employeeName = jobSeeking ? customerMap.get(jobSeeking.customer_id) || "알 수 없음" : "알 수 없음";

    return {
      id: matching.id,
      employerName,
      employeeName,
      agreed_salary: matching.agreed_salary,
      employer_fee_rate: matching.employer_fee_rate,
      employer_fee_amount: matching.employer_fee_amount,
      employee_fee_rate: matching.employee_fee_rate,
      employee_fee_amount: matching.employee_fee_amount,
      matching_status: matching.matching_status,
      matched_at: matching.matched_at,
    };
  });

  const columns: Column<MatchingWithNames>[] = [
    {
      key: "id",
      header: "매칭 ID",
      mobileLabel: "매칭 ID",
      cell: (matching) => <span className="font-medium">#{matching.id}</span>,
    },
    {
      key: "employer",
      header: "구인자",
      mobileLabel: "구인자",
      cell: (matching) => matching.employerName,
    },
    {
      key: "employee",
      header: "구직자",
      mobileLabel: "구직자",
      cell: (matching) => matching.employeeName,
    },
    {
      key: "salary",
      header: "합의 급여",
      mobileLabel: "합의 급여",
      cell: (matching) => formatCurrencyFromString(matching.agreed_salary),
    },
    {
      key: "employer_fee",
      header: "구인 수수료",
      mobileLabel: "구인 수수료",
      cell: (matching) => (
        <span>
          {matching.employer_fee_rate}%
          {matching.employer_fee_amount && ` (${formatCurrencyFromString(matching.employer_fee_amount)})`}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: "employee_fee",
      header: "구직 수수료",
      mobileLabel: "구직 수수료",
      cell: (matching) => (
        <span>
          {matching.employee_fee_rate}%
          {matching.employee_fee_amount && ` (${formatCurrencyFromString(matching.employee_fee_amount)})`}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: "status",
      header: "매칭 상태",
      mobileLabel: "상태",
      cell: (matching) => (
        <Badge variant={matchingStatusMap[matching.matching_status].variant}>
          {matchingStatusMap[matching.matching_status].label}
        </Badge>
      ),
    },
    {
      key: "matched_at",
      header: "매칭일",
      mobileLabel: "매칭일",
      cell: (matching) => formatDate(matching.matched_at),
      hideOnMobile: true,
    },
    {
      key: "actions",
      header: "작업",
      mobileLabel: "작업",
      className: "text-right",
      cell: (matching) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/matchings/${matching.id}`)}
            aria-label="매칭 상세보기"
          >
            <Eye className="h-4 w-4 md:mr-2" aria-hidden="true" />
            <span className="hidden md:inline">상세</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/matchings/${matching.id}/edit`)}
            aria-label="매칭 수정"
          >
            <Pencil className="h-4 w-4 md:mr-2" aria-hidden="true" />
            <span className="hidden md:inline">수정</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(matching.id)}
            aria-label="매칭 삭제"
          >
            <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">매칭 관리</h1>
          <p className="text-muted-foreground">
            구인자와 구직자 간의 매칭을 관리합니다
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/matchings/new">
            <Plus className="mr-2 h-4 w-4" />
            새 매칭
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>매칭 목록</CardTitle>
          <CardDescription>
            전체 매칭 현황을 확인하고 관리합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="구인자 또는 구직자명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="매칭 상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 상태</SelectItem>
                  <SelectItem value="InProgress">진행중</SelectItem>
                  <SelectItem value="Completed">완료됨</SelectItem>
                  <SelectItem value="Cancelled">취소됨</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
          ) : (
            <ResponsiveDataList
              data={matchingsWithNames}
              columns={columns}
              keyExtractor={(matching) => matching.id.toString()}
              emptyMessage="매칭이 없습니다"
            />
          )}

          {!loading && filteredMatchings.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                총 {filteredMatchings.length}개 (페이지 {currentPage} / {totalPages || 1})
              </p>
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="매칭 삭제"
        description="정말 이 매칭을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      />
    </div>
  );
}
