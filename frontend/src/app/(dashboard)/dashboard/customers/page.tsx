"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Search, Eye, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { usePagination } from "@/hooks/use-pagination";
import { useCustomers, useDeleteCustomer } from "@/hooks/queries/use-customers";

export default function CustomersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCustomerId, setDeleteCustomerId] = useState<number | null>(null);

  // React Query hooks
  const { data: customers = [], isLoading, error } = useCustomers();
  const deleteMutation = useDeleteCustomer();

  const handleDelete = (customerId: number) => {
    setDeleteCustomerId(customerId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteCustomerId === null) return;

    deleteMutation.mutate(deleteCustomerId, {
      onSuccess: () => {
        toast({
          title: "성공",
          description: "고객이 삭제되었습니다.",
        });
        setDeleteDialogOpen(false);
        setDeleteCustomerId(null);
      },
      onError: (err) => {
        const errorMessage = getErrorMessage(err);
        toast({
          variant: "destructive",
          title: "오류",
          description: errorMessage,
        });
        setDeleteDialogOpen(false);
        setDeleteCustomerId(null);
      },
    });
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.address?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      filterType === "all" || customer.customer_type === filterType;

    return matchesSearch && matchesType;
  });

  // Pagination
  const {
    paginatedItems: paginatedCustomers,
    currentPage,
    totalPages,
    setCurrentPage,
  } = usePagination({
    items: filteredCustomers,
    itemsPerPage: 10,
    resetDependencies: [searchQuery, filterType],
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "Employer":
        return "구인자";
      case "Employee":
        return "구직자";
      case "Both":
        return "구인/구직";
      default:
        return type;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "Employer":
        return "default";
      case "Employee":
        return "secondary";
      case "Both":
        return "outline";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("ko-KR");
  };

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">고객 관리</h1>
          <p className="text-muted-foreground">
            구인자와 구직자를 관리합니다.
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/customers/new")}>
          <Plus className="mr-2 h-4 w-4" />
          새 고객 추가
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="이름, 전화번호, 주소로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="유형 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="Employer">구인자</SelectItem>
            <SelectItem value="Employee">구직자</SelectItem>
            <SelectItem value="Both">구인/구직</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          {getErrorMessage(error)}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-6">
          {/* Header skeleton */}
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-72" />
          </div>

          {/* Search/Filter skeleton */}
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-[180px]" />
          </div>

          {/* Table skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>생년월일</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>주소</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-64 text-center text-muted-foreground"
                  >
                    고객이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      {customer.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTypeBadgeVariant(customer.customer_type)}>
                        {getTypeLabel(customer.customer_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(customer.birth_date)}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {customer.address || "-"}
                    </TableCell>
                    <TableCell>{formatDate(customer.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            router.push(`/dashboard/customers/${customer.id}`)
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            router.push(
                              `/dashboard/customers/${customer.id}/edit`
                            )
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(customer.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          총 {filteredCustomers.length}명의 고객 (페이지 {currentPage} / {totalPages || 1})
        </p>
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="고객 삭제"
        description="정말 이 고객을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      />
    </div>
  );
}
