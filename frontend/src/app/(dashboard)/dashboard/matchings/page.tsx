"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
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
          ) : filteredMatchings.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-muted-foreground">매칭이 없습니다</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>매칭 ID</TableHead>
                    <TableHead>구인자</TableHead>
                    <TableHead>구직자</TableHead>
                    <TableHead>합의 급여</TableHead>
                    <TableHead>구인 수수료</TableHead>
                    <TableHead>구직 수수료</TableHead>
                    <TableHead>매칭 상태</TableHead>
                    <TableHead>매칭일</TableHead>
                    <TableHead className="w-[70px]">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMatchings.map((matching) => {
                    const jobPosting = jobPostingMap.get(matching.job_posting_id);
                    const jobSeeking = jobSeekingMap.get(matching.job_seeking_posting_id);
                    const employerName = jobPosting ? customerMap.get(jobPosting.customer_id) || "알 수 없음" : "알 수 없음";
                    const employeeName = jobSeeking ? customerMap.get(jobSeeking.customer_id) || "알 수 없음" : "알 수 없음";

                    return (
                      <TableRow key={matching.id}>
                        <TableCell className="font-medium">#{matching.id}</TableCell>
                        <TableCell>{employerName}</TableCell>
                        <TableCell>{employeeName}</TableCell>
                        <TableCell>{formatCurrencyFromString(matching.agreed_salary)}</TableCell>
                        <TableCell>
                          {matching.employer_fee_rate}%
                          {matching.employer_fee_amount && ` (${formatCurrencyFromString(matching.employer_fee_amount)})`}
                        </TableCell>
                        <TableCell>
                          {matching.employee_fee_rate}%
                          {matching.employee_fee_amount && ` (${formatCurrencyFromString(matching.employee_fee_amount)})`}
                        </TableCell>
                        <TableCell>
                          <Badge variant={matchingStatusMap[matching.matching_status].variant}>
                            {matchingStatusMap[matching.matching_status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(matching.matched_at)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>작업</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => router.push(`/dashboard/matchings/${matching.id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                상세보기
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/dashboard/matchings/${matching.id}/edit`)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                수정
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(matching.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                삭제
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
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
