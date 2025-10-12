"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save } from "lucide-react";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { customerApi } from "@/lib/customer";
import { Customer } from "@/types/customer";
import { useToast } from "@/hooks/use-toast";

export default function EditJobSeekingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Form state
  const [customerId, setCustomerId] = useState("");
  const [desiredSalary, setDesiredSalary] = useState("");
  const [description, setDescription] = useState("");
  const [preferredLocation, setPreferredLocation] = useState("");
  const [employeeFeeRate, setEmployeeFeeRate] = useState("");
  const [useDefaultFeeRate, setUseDefaultFeeRate] = useState(true);
  const [postingStatus, setPostingStatus] = useState<string>("Published");
  const [settlementStatus, setSettlementStatus] = useState<string>("Unsettled");
  const [settlementAmount, setSettlementAmount] = useState("");
  const [settlementMemo, setSettlementMemo] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchJobSeeking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchCustomers = async () => {
    try {
      const allCustomers = await customerApi.getAll();
      // Filter for employees only
      const employees = allCustomers.filter(
        (c) => c.customer_type === "Employee" || c.customer_type === "Both"
      );
      setCustomers(employees);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  };

  const fetchJobSeeking = async () => {
    try {
      const response = await apiClient.get(`/api/job-seekings/${id}`);
      const seeking = response.data;

      setCustomerId(seeking.customer_id.toString());
      setDesiredSalary(seeking.desired_salary.toString());
      setDescription(seeking.description);
      setPreferredLocation(seeking.preferred_location);
      setEmployeeFeeRate(seeking.employee_fee_rate?.toString() || "");
      setUseDefaultFeeRate(seeking.employee_fee_rate === null);
      setPostingStatus(seeking.posting_status);
      setSettlementStatus(seeking.settlement_status);
      setSettlementAmount(seeking.settlement_amount?.toString() || "");
      setSettlementMemo(seeking.settlement_memo || "");
      setIsFavorite(seeking.is_favorite);
    } catch (error) {
      console.error("Failed to fetch job seeking posting:", error);
      const errorMessage = getErrorMessage(error);
      toast({
        variant: "destructive",
        title: "오류",
        description: errorMessage,
      });
      router.push("/dashboard/job-seeking");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        customer_id: parseInt(customerId),
        desired_salary: parseFloat(desiredSalary),
        description,
        preferred_location: preferredLocation,
        employee_fee_rate: useDefaultFeeRate ? null : parseFloat(employeeFeeRate),
        posting_status: postingStatus,
        settlement_status: settlementStatus,
        settlement_amount: settlementAmount ? parseFloat(settlementAmount) : null,
        settlement_memo: settlementMemo || null,
        is_favorite: isFavorite,
      };

      await apiClient.put(`/api/job-seekings/${id}`, payload);
      router.push(`/dashboard/job-seeking/${id}`);
    } catch (error) {
      console.error("Failed to update job seeking posting:", error);
      const errorMessage = getErrorMessage(error);
      toast({
        variant: "destructive",
        title: "오류",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/job-seeking/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">구직 공고 수정</h1>
          <p className="text-muted-foreground">구직 공고 정보를 수정합니다</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>구직 공고의 기본 정보를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer">구직자 *</Label>
                <Select value={customerId} onValueChange={setCustomerId} required>
                  <SelectTrigger id="customer">
                    <SelectValue placeholder="구직자를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="desiredSalary">희망 급여 (원) *</Label>
                <Input
                  id="desiredSalary"
                  type="number"
                  placeholder="3500000"
                  value={desiredSalary}
                  onChange={(e) => setDesiredSalary(e.target.value)}
                  required
                  min="0"
                  step="10000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredLocation">선호 근무지 *</Label>
                <Input
                  id="preferredLocation"
                  type="text"
                  placeholder="서울 강남/서초"
                  value={preferredLocation}
                  onChange={(e) => setPreferredLocation(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">공고 설명 *</Label>
                <Textarea
                  id="description"
                  placeholder="구직 공고 내용을 입력하세요"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>수수료 정보</CardTitle>
              <CardDescription>수수료율 정보를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useDefaultFeeRate"
                  checked={useDefaultFeeRate}
                  onCheckedChange={(checked) => setUseDefaultFeeRate(checked as boolean)}
                />
                <Label htmlFor="useDefaultFeeRate" className="font-normal">
                  기본 수수료율 사용
                </Label>
              </div>

              {!useDefaultFeeRate && (
                <div className="space-y-2">
                  <Label htmlFor="feeRate">구직자 수수료율 (%)</Label>
                  <Input
                    id="feeRate"
                    type="number"
                    placeholder="10.0"
                    value={employeeFeeRate}
                    onChange={(e) => setEmployeeFeeRate(e.target.value)}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>상태 정보</CardTitle>
              <CardDescription>공고 및 정산 상태를 설정하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="postingStatus">공고 상태 *</Label>
                  <Select value={postingStatus} onValueChange={setPostingStatus} required>
                    <SelectTrigger id="postingStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Published">게시됨</SelectItem>
                      <SelectItem value="InProgress">진행중</SelectItem>
                      <SelectItem value="Closed">마감</SelectItem>
                      <SelectItem value="Cancelled">취소됨</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="settlementStatus">정산 상태 *</Label>
                  <Select value={settlementStatus} onValueChange={setSettlementStatus} required>
                    <SelectTrigger id="settlementStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Unsettled">미정산</SelectItem>
                      <SelectItem value="Settled">정산완료</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="settlementAmount">정산 금액 (원)</Label>
                <Input
                  id="settlementAmount"
                  type="number"
                  placeholder="350000"
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(e.target.value)}
                  min="0"
                  step="1000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="settlementMemo">정산 메모</Label>
                <Textarea
                  id="settlementMemo"
                  placeholder="정산 관련 메모를 입력하세요"
                  value={settlementMemo}
                  onChange={(e) => setSettlementMemo(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFavorite"
                  checked={isFavorite}
                  onCheckedChange={(checked) => setIsFavorite(checked as boolean)}
                />
                <Label htmlFor="isFavorite" className="font-normal">
                  즐겨찾기에 추가
                </Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
