"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Eye, Pencil, Trash2, Star } from "lucide-react";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { PostingStatus, SettlementStatus } from "@/types/job-posting";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { usePagination } from "@/hooks/use-pagination";
import { useCustomers } from "@/hooks/queries/use-customers";
import { useJobSeekings, useDeleteJobSeeking } from "@/hooks/queries/use-job-seekings";

const postingStatusMap: Record<PostingStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  Published: { label: "게시됨", variant: "default" },
  InProgress: { label: "진행중", variant: "secondary" },
  Closed: { label: "마감", variant: "outline" },
  Cancelled: { label: "취소됨", variant: "destructive" },
};

const settlementStatusMap: Record<SettlementStatus, { label: string; variant: "default" | "destructive" }> = {
  Unsettled: { label: "미정산", variant: "destructive" },
  Settled: { label: "정산완료", variant: "default" },
};

export default function JobSeekingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [postingStatusFilter, setPostingStatusFilter] = useState<string>("all");
  const [settlementStatusFilter, setSettlementStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);

  // React Query hooks
  const { data: jobSeekings = [], isLoading: isLoadingSeekings } = useJobSeekings();
  const { data: customers = [], isLoading: isLoadingCustomers } = useCustomers();
  const deleteMutation = useDeleteJobSeeking();

  const loading = isLoadingSeekings || isLoadingCustomers;

  // Create customer map using useMemo for performance
  const customerMap = useMemo(() => {
    return new Map(customers.map(c => [c.id, c.name]));
  }, [customers]);

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
          description: "구직 공고가 삭제되었습니다.",
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

  const toggleFavorite = async (id: number, currentStatus: boolean) => {
    try {
      await apiClient.patch(`/api/job-seekings/${id}`, {
        is_favorite: !currentStatus,
      });
      // TODO: Create a mutation for this
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const filteredSeekings = jobSeekings.filter((seeking) => {
    const customerName = customerMap.get(seeking.customer_id) || "";
    const matchesSearch =
      seeking.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seeking.preferred_location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPostingStatus =
      postingStatusFilter === "all" || seeking.posting_status === postingStatusFilter;
    const matchesSettlementStatus =
      settlementStatusFilter === "all" || seeking.settlement_status === settlementStatusFilter;

    return matchesSearch && matchesPostingStatus && matchesSettlementStatus;
  });

  const {
    paginatedItems: paginatedJobSeekings,
    currentPage,
    totalPages,
    setCurrentPage,
  } = usePagination({
    items: filteredSeekings,
    itemsPerPage: 10,
    resetDependencies: [searchTerm, postingStatusFilter, settlementStatusFilter],
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
          <h1 className="text-3xl font-bold tracking-tight">구직 공고 관리</h1>
          <p className="text-muted-foreground">구직자의 구직 공고를 관리합니다</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/job-seeking/new">
            <Plus className="mr-2 h-4 w-4" />
            새 구직 공고
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>구직 공고 목록</CardTitle>
          <CardDescription>
            등록된 모든 구직 공고를 조회하고 관리할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="설명, 구직자명 또는 선호지역으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={postingStatusFilter} onValueChange={setPostingStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="공고 상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 상태</SelectItem>
                  <SelectItem value="Published">게시됨</SelectItem>
                  <SelectItem value="InProgress">진행중</SelectItem>
                  <SelectItem value="Closed">마감</SelectItem>
                  <SelectItem value="Cancelled">취소됨</SelectItem>
                </SelectContent>
              </Select>
              <Select value={settlementStatusFilter} onValueChange={setSettlementStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="정산 상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 정산 상태</SelectItem>
                  <SelectItem value="Unsettled">미정산</SelectItem>
                  <SelectItem value="Settled">정산완료</SelectItem>
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
          ) : filteredSeekings.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-muted-foreground">구직 공고가 없습니다</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>구직자</TableHead>
                    <TableHead>희망 급여</TableHead>
                    <TableHead>선호 지역</TableHead>
                    <TableHead>설명</TableHead>
                    <TableHead>수수료율</TableHead>
                    <TableHead>공고 상태</TableHead>
                    <TableHead>정산 상태</TableHead>
                    <TableHead>등록일</TableHead>
                    <TableHead className="w-[70px]">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedJobSeekings.map((seeking) => (
                    <TableRow key={seeking.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleFavorite(seeking.id, seeking.is_favorite)}
                        >
                          <Star
                            className={`h-4 w-4 ${
                              seeking.is_favorite ? "fill-yellow-400 text-yellow-400" : ""
                            }`}
                          />
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {customerMap.get(seeking.customer_id) || "알 수 없음"}
                      </TableCell>
                      <TableCell>{formatCurrency(seeking.desired_salary)}</TableCell>
                      <TableCell>{seeking.preferred_location}</TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {seeking.description}
                      </TableCell>
                      <TableCell>
                        {seeking.employee_fee_rate !== null
                          ? `${seeking.employee_fee_rate}%`
                          : "기본값"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={postingStatusMap[seeking.posting_status].variant}>
                          {postingStatusMap[seeking.posting_status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={settlementStatusMap[seeking.settlement_status].variant}>
                          {settlementStatusMap[seeking.settlement_status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(seeking.created_at)}</TableCell>
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
                              onClick={() => router.push(`/dashboard/job-seeking/${seeking.id}`)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              상세보기
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/dashboard/job-seeking/${seeking.id}/edit`)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              수정
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(seeking.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && filteredSeekings.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                총 {filteredSeekings.length}개 (페이지 {currentPage} / {totalPages || 1})
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
        title="구직 공고 삭제"
        description="정말 이 구직 공고를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      />
    </div>
  );
}
