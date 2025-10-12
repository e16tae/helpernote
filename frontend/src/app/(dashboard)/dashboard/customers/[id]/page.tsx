"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { customerApi } from "@/lib/customer";
import { getErrorMessage } from "@/lib/api-client";
import { Customer } from "@/types/customer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfilePhotoUpload } from "@/components/file/ProfilePhotoUpload";
import { FileList } from "@/components/file/FileList";
import { FileUpload } from "@/components/file/FileUpload";

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = parseInt(params.id as string);
  const { toast } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [fileRefreshTrigger, setFileRefreshTrigger] = useState(0);

  useEffect(() => {
    loadCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerApi.getById(customerId);
      setCustomer(data);
    } catch (err) {
      console.error("Failed to load customer:", err);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setDeleteItemId(customerId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteItemId === null) return;

    try {
      await customerApi.delete(deleteItemId);
      toast({
        title: "성공",
        description: "고객이 삭제되었습니다.",
      });
      router.push("/dashboard/customers");
    } catch (err) {
      console.error("Failed to delete customer:", err);
      const errorMessage = getErrorMessage(err);
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "employer":
        return "구인자";
      case "employee":
        return "구직자";
      case "both":
        return "구인/구직";
      default:
        return type;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "employer":
        return "default";
      case "employee":
        return "secondary";
      case "both":
        return "outline";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("ko-KR");
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR");
  };

  const handleFileUploadSuccess = () => {
    setFileRefreshTrigger((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6 md:p-8">
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
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex-1 space-y-6 p-6 md:p-8">
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          {error || "고객을 찾을 수 없습니다."}
        </div>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {customer.name}
              </h1>
              <Badge variant={getTypeBadgeVariant(customer.customer_type)}>
                {getTypeLabel(customer.customer_type)}
              </Badge>
            </div>
            <p className="text-muted-foreground">고객 상세 정보</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/customers/${customerId}/edit`)
            }
          >
            <Pencil className="mr-2 h-4 w-4" />
            수정
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            삭제
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">이름</p>
              <p className="text-base">{customer.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">생년월일</p>
              <p className="text-base">{formatDate(customer.birth_date)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">고객 유형</p>
              <Badge variant={getTypeBadgeVariant(customer.customer_type)}>
                {getTypeLabel(customer.customer_type)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>연락처 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">전화번호</p>
              <p className="text-base">{customer.phone}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">주소</p>
              <p className="text-base">{customer.address || "-"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>프로필 사진</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfilePhotoUpload
              customerId={customerId}
              customerName={customer.name}
              currentPhotoPath={null}
              onSuccess={handleFileUploadSuccess}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>시스템 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">고객 ID</span>
            <span>#{customer.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">사용자 ID</span>
            <span>#{customer.user_id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">생성일</span>
            <span>{formatDateTime(customer.created_at)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">수정일</span>
            <span>{formatDateTime(customer.updated_at)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">파일 관리</h2>
          <FileUpload
            customerId={customerId}
            onSuccess={handleFileUploadSuccess}
          />
        </div>
        <FileList
          customerId={customerId}
          refreshTrigger={fileRefreshTrigger}
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
