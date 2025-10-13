"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { customerApi } from "@/lib/customer";
import { getErrorMessage } from "@/lib/api-client";
import { Customer, UpdateCustomerRequest } from "@/types/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPhoneNumber, unformatPhoneNumber, isValidPhoneNumber } from "@/lib/utils/phone";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { FileList } from "@/components/file/FileList";
import { FileUpload } from "@/components/file/FileUpload";

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = parseInt(params.id as string);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileRefreshTrigger, setFileRefreshTrigger] = useState(0);

  const [formData, setFormData] = useState<UpdateCustomerRequest>({
    customer_type: "Employer",
    name: "",
    phone: "",
    birth_date: null,
    address: null,
  });

  useEffect(() => {
    loadCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerApi.getById(customerId);
      setFormData({
        customer_type: data.customer_type,
        name: data.name,
        phone: data.phone,
        birth_date: data.birth_date,
        address: data.address,
        profile_photo_id: data.profile_photo_id,
      });
    } catch (err) {
      console.error("Failed to load customer:", err);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "고객 이름을 입력하세요.",
      });
      return;
    }

    if (!formData.phone?.trim()) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "전화번호를 입력하세요.",
      });
      return;
    }

    try {
      setSubmitting(true);
      await customerApi.update(customerId, formData);
      router.push(`/dashboard/customers/${customerId}`);
    } catch (err) {
      console.error("Failed to update customer:", err);
      const errorMessage = getErrorMessage(err);
      toast({
        variant: "destructive",
        title: "오류",
        description: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    field: keyof UpdateCustomerRequest,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value || null,
    }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData((prev) => ({
      ...prev,
      phone: formatted,
    }));
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

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-6 p-6 md:p-8">
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          {error}
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">고객 정보 수정</h1>
          <p className="text-muted-foreground">
            고객 정보를 수정합니다.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>
                고객의 기본 정보를 입력하세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer_type">
                    고객 유형 <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.customer_type}
                    onValueChange={(value) =>
                      handleChange("customer_type", value)
                    }
                  >
                    <SelectTrigger id="customer_type">
                      <SelectValue placeholder="유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Employer">구인자</SelectItem>
                      <SelectItem value="Employee">구직자</SelectItem>
                      <SelectItem value="Both">구인/구직</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">
                    고객 이름 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      handleChange("name", e.target.value)
                    }
                    placeholder="홍길동"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_date">생년월일</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date || ""}
                    onChange={(e) =>
                      handleChange("birth_date", e.target.value)
                    }
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    전화번호 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="010-1234-5678"
                    type="tel"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">주소</Label>
                <Input
                  id="address"
                  value={formData.address || ""}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="주소를 입력하세요"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={submitting}>
              <Save className="mr-2 h-4 w-4" />
              {submitting ? "저장 중..." : "저장"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              취소
            </Button>
          </div>
        </div>
      </form>

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
    </div>
  );
}
