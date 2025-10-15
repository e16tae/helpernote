"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, Plus, UserPlus } from "lucide-react";
import { getErrorMessage } from "@/lib/api-client";
import { customerApi } from "@/lib/customer";
import { useCreateJobPosting } from "@/hooks/queries/use-job-postings";
import { CreateJobPostingRequest } from "@/types/job-posting";
import { Customer } from "@/types/customer";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function NewJobPostingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const createMutation = useCreateJobPosting();

  // Form state
  const [customerId, setCustomerId] = useState("");
  const [salary, setSalary] = useState("");
  const [description, setDescription] = useState("");
  const [employerFeeRate, setEmployerFeeRate] = useState("");
  const [useDefaultFeeRate, setUseDefaultFeeRate] = useState(true);

  const fetchCustomers = useCallback(async () => {
    try {
      setCustomersLoading(true);
      setCustomersError(null);
      const allCustomers = await customerApi.getAll();
      // Filter for employers only
      const employers = allCustomers.filter(
        (c) => c.customer_type === "Employer" || c.customer_type === "Both"
      );
      setCustomers(employers);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      const message = getErrorMessage(error);
      setCustomersError(message);
      toast({
        variant: "destructive",
        title: "고객 목록을 가져오지 못했습니다",
        description: message,
      });
    } finally {
      setCustomersLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    if (customers.length > 0) {
      setCustomerId((prev) => prev || customers[0].id.toString());
    } else {
      setCustomerId("");
    }
  }, [customers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId) {
      toast({
        variant: "destructive",
        title: "구인자를 선택하세요",
        description: "구인 공고를 생성하려면 먼저 구인자를 등록해 주세요.",
      });
      return;
    }

    const salaryValue = Number(salary);
    if (!Number.isFinite(salaryValue) || salaryValue <= 0) {
      toast({
        variant: "destructive",
        title: "올바른 급여를 입력하세요",
        description: "0보다 큰 숫자를 입력해야 합니다.",
      });
      return;
    }

    const employerFeeRateValue = useDefaultFeeRate
      ? null
      : employerFeeRate.trim()
        ? Number(employerFeeRate)
        : null;
    if (
      employerFeeRateValue !== null &&
      (!Number.isFinite(employerFeeRateValue) || employerFeeRateValue < 0)
    ) {
      toast({
        variant: "destructive",
        title: "올바른 수수료율을 입력하세요",
        description: "0 이상의 숫자를 입력해야 합니다.",
      });
      return;
    }

    setLoading(true);

    try {
      const payload: CreateJobPostingRequest = {
        customer_id: parseInt(customerId),
        salary: salaryValue,
        description,
        employer_fee_rate: employerFeeRateValue,
      };

      const created = await createMutation.mutateAsync(payload);
      toast({ title: "성공", description: "구인 공고가 생성되었습니다." });
      router.push(`/dashboard/job-postings/${created.id}`);
    } catch (error) {
      console.error("Failed to create job posting:", error);
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
          <Link href="/dashboard/job-postings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">새 구인 공고</h1>
          <p className="text-muted-foreground">새로운 구인 공고를 등록합니다</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>구인 공고의 기본 정보를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {customersError && (
                <Alert variant="destructive">
                  <AlertTitle>고객 정보를 불러오지 못했습니다</AlertTitle>
                  <AlertDescription>{customersError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="customer">구인자 *</Label>
                <Select
                  value={customerId}
                  onValueChange={setCustomerId}
                  required
                  disabled={customersLoading || customers.length === 0}
                >
                  <SelectTrigger id="customer">
                    <SelectValue
                      placeholder={customersLoading ? "불러오는 중..." : "구인자를 선택하세요"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.length > 0 ? (
                      customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        등록된 구인자가 없습니다. 먼저 고객을 추가하세요.
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {!customersLoading && customers.length === 0 && (
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 text-primary"
                    onClick={() => router.push("/dashboard/customers/new")}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    새 고객 등록하러 가기
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">제시 급여 (원) *</Label>
                <Input
                  id="salary"
                  type="number"
                  placeholder="3500000"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  required
                  min="0"
                  step="10000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">공고 설명 *</Label>
                <Textarea
                  id="description"
                  placeholder="구인 공고 내용을 입력하세요"
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
                  <Label htmlFor="feeRate">구인자 수수료율 (%)</Label>
                  <Input
                    id="feeRate"
                    type="number"
                    placeholder="10.0"
                    value={employerFeeRate}
                    onChange={(e) => setEmployerFeeRate(e.target.value)}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              취소
            </Button>
            <Button
              type="submit"
              disabled={
                loading || customersLoading || customers.length === 0 || !customerId
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              {loading ? "생성 중..." : "생성"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
