"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { customerApi } from "@/lib/customer";
import { getErrorMessage } from "@/lib/api-client";
import { CreateCustomerRequest } from "@/types/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NewCustomerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateCustomerRequest>({
    customer_type: "Employer",
    name: "",
    phone: "",
    birth_date: null,
    address: null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "고객 이름을 입력하세요.",
      });
      return;
    }

    if (!formData.phone.trim()) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "전화번호를 입력하세요.",
      });
      return;
    }

    try {
      setSubmitting(true);
      const newCustomer = await customerApi.create(formData);
      router.push(`/dashboard/customers/${newCustomer.id}`);
    } catch (err) {
      console.error("Failed to create customer:", err);
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
    field: keyof CreateCustomerRequest,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value || null,
    }));
  };

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">새 고객 추가</h1>
          <p className="text-muted-foreground">
            새로운 고객 정보를 등록합니다.
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    전화번호 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
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
              <Plus className="mr-2 h-4 w-4" />
              {submitting ? "생성 중..." : "고객 추가"}
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
    </div>
  );
}
