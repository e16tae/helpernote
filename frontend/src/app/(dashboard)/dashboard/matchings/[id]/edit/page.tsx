"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { Matching, UpdateMatchingRequest, MatchingStatus } from "@/types/matching";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditMatchingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState<Matching | null>(null);

  // Form state
  const [agreedSalary, setAgreedSalary] = useState("");
  const [employerFeeRate, setEmployerFeeRate] = useState("");
  const [employeeFeeRate, setEmployeeFeeRate] = useState("");
  const [matchingStatus, setMatchingStatus] = useState<MatchingStatus>("InProgress");
  const [cancellationReason, setCancellationReason] = useState("");

  useEffect(() => {
    fetchMatching();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchMatching = async () => {
    try {
      const response = await apiClient.get(`/api/matchings/${id}`);
      const data = response.data;
      setMatching(data);

      // Set form data
      setAgreedSalary(data.agreed_salary.toString());
      setEmployerFeeRate(data.employer_fee_rate.toString());
      setEmployeeFeeRate(data.employee_fee_rate.toString());
      setMatchingStatus(data.matching_status);
      setCancellationReason(data.cancellation_reason || "");
    } catch (error) {
      console.error("Failed to fetch matching:", error);
      const errorMessage = getErrorMessage(error);
      toast({
        variant: "destructive",
        title: "오류",
        description: errorMessage,
      });
      router.push("/dashboard/matchings");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: UpdateMatchingRequest = {
        agreed_salary: parseFloat(agreedSalary),
        employer_fee_rate: parseFloat(employerFeeRate),
        employee_fee_rate: parseFloat(employeeFeeRate),
        matching_status: matchingStatus,
        cancellation_reason: cancellationReason || null,
      };

      await apiClient.put(`/api/matchings/${id}`, payload);
      router.push(`/dashboard/matchings/${id}`);
    } catch (error) {
      console.error("Failed to update matching:", error);
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

  const calculateFeeAmount = (salary: number, rate: number) => {
    return (salary * rate) / 100;
  };

  const salaryAmount = parseFloat(agreedSalary) || 0;
  const employerFee = calculateFeeAmount(salaryAmount, parseFloat(employerFeeRate));
  const employeeFee = calculateFeeAmount(salaryAmount, parseFloat(employeeFeeRate));
  const totalFee = employerFee + employeeFee;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  if (!matching) {
    return (
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
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/matchings/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">매칭 수정 #{id}</h1>
          <p className="text-muted-foreground">매칭 정보를 수정합니다</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>급여 정보</CardTitle>
            <CardDescription>합의된 급여를 수정합니다</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="agreedSalary">
                합의 급여 (원/월) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="agreedSalary"
                type="number"
                value={agreedSalary}
                onChange={(e) => setAgreedSalary(e.target.value)}
                placeholder="3500000"
                required
                min="0"
                step="10000"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>수수료 설정</CardTitle>
            <CardDescription>구인자 및 구직자 수수료율을 수정합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employerFeeRate">
                  구인자 수수료율 (%) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="employerFeeRate"
                  type="number"
                  step="0.1"
                  value={employerFeeRate}
                  onChange={(e) => setEmployerFeeRate(e.target.value)}
                  placeholder="10"
                  required
                  min="0"
                  max="100"
                />
                <p className="text-sm text-muted-foreground">
                  예상 수수료: {formatCurrency(employerFee)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeFeeRate">
                  구직자 수수료율 (%) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="employeeFeeRate"
                  type="number"
                  step="0.1"
                  value={employeeFeeRate}
                  onChange={(e) => setEmployeeFeeRate(e.target.value)}
                  placeholder="5"
                  required
                  min="0"
                  max="100"
                />
                <p className="text-sm text-muted-foreground">
                  예상 수수료: {formatCurrency(employeeFee)}
                </p>
              </div>
            </div>

            {salaryAmount > 0 && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">총 예상 수수료</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(totalFee)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>상태 관리</CardTitle>
            <CardDescription>매칭 상태를 관리합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="matchingStatus">
                매칭 상태 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={matchingStatus}
                onValueChange={(value) => setMatchingStatus(value as MatchingStatus)}
                required
              >
                <SelectTrigger id="matchingStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="InProgress">진행중</SelectItem>
                  <SelectItem value="Completed">완료</SelectItem>
                  <SelectItem value="Cancelled">취소</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {matchingStatus === "Cancelled" && (
              <div className="space-y-2">
                <Label htmlFor="cancellationReason">취소 사유</Label>
                <Textarea
                  id="cancellationReason"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="취소 사유를 입력하세요"
                  rows={4}
                />
              </div>
            )}
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
      </form>
    </div>
  );
}
