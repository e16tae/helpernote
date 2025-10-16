"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Plus, Briefcase, UserSearch } from "lucide-react";
import { getErrorMessage } from "@/lib/api-client";
import { CreateMatchingRequest } from "@/types/matching";
import { JobPosting, JobSeekingPosting } from "@/types/job-posting";
import { Customer } from "@/types/customer";
import { customerApi } from "@/lib/customer";
import { jobPostingApi, jobSeekingApi } from "@/lib/job-posting";
import { matchingApi } from "@/lib/matching";
import { useJobPostings } from "@/hooks/queries/use-job-postings";
import { useJobSeekings } from "@/hooks/queries/use-job-seekings";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function NewMatchingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [jobSeekings, setJobSeekings] = useState<JobSeekingPosting[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data: cachedPostings = [] } = useJobPostings();
  const { data: cachedSeekings = [] } = useJobSeekings();
  const createMatching = useMutation({
    mutationFn: (payload: CreateMatchingRequest) => matchingApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matchings.all });
    },
  });

  // Form state
  const [jobPostingId, setJobPostingId] = useState("");
  const [jobSeekingId, setJobSeekingId] = useState("");
  const [agreedSalary, setAgreedSalary] = useState("");
  const [employerFeeRate, setEmployerFeeRate] = useState("10");
  const [employeeFeeRate, setEmployeeFeeRate] = useState("5");

  const fetchData = useCallback(async () => {
    try {
      setDataLoading(true);
      setDataError(null);
      const [customersData, jobPostingsData, jobSeekingsData] = await Promise.all([
        customerApi.getAll(),
        jobPostingApi.getAll(),
        jobSeekingApi.getAll(),
      ]);

      setCustomers(customersData);
      const postingsToUse = jobPostingsData.length ? jobPostingsData : cachedPostings;
      const seekingsToUse = jobSeekingsData.length ? jobSeekingsData : cachedSeekings;
      setJobPostings(postingsToUse);
      setJobSeekings(seekingsToUse);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      const message = getErrorMessage(error);
      setDataError(message);
      toast({
        variant: "destructive",
        title: "매칭 데이터를 불러오지 못했습니다",
        description: message,
      });
    } finally {
      setDataLoading(false);
    }
  }, [cachedPostings, cachedSeekings, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (jobPostings.length > 0) {
      setJobPostingId((prev) => prev || jobPostings[0].id.toString());
    } else {
      setJobPostingId("");
    }
  }, [jobPostings]);

  useEffect(() => {
    if (jobSeekings.length > 0) {
      setJobSeekingId((prev) => prev || jobSeekings[0].id.toString());
    } else {
      setJobSeekingId("");
    }
  }, [jobSeekings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobPostingId || !jobSeekingId) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "구인 공고와 구직 공고를 모두 선택해주세요.",
      });
      return;
    }

    const salaryValue = Number(agreedSalary);
    if (!Number.isFinite(salaryValue) || salaryValue <= 0) {
      toast({
        variant: "destructive",
        title: "합의 급여를 확인하세요",
        description: "0보다 큰 숫자를 입력해야 합니다.",
      });
      return;
    }

    const employerFeeRateValue = Number(employerFeeRate);
    const employeeFeeRateValue = Number(employeeFeeRate);
    if (
      !Number.isFinite(employerFeeRateValue) ||
      !Number.isFinite(employeeFeeRateValue) ||
      employerFeeRateValue < 0 ||
      employeeFeeRateValue < 0
    ) {
      toast({
        variant: "destructive",
        title: "수수료율을 확인하세요",
        description: "수수료율은 0 이상이어야 합니다.",
      });
      return;
    }

    setLoading(true);

    try {
      const payload: CreateMatchingRequest = {
        job_posting_id: parseInt(jobPostingId),
        job_seeking_posting_id: parseInt(jobSeekingId),
        agreed_salary: salaryValue,
        employer_fee_rate: employerFeeRateValue,
        employee_fee_rate: employeeFeeRateValue,
      };

      const created = await createMatching.mutateAsync(payload);
      toast({ title: "성공", description: "매칭이 생성되었습니다." });
      router.push(`/dashboard/matchings/${created.id}`);
    } catch (error) {
      console.error("Failed to create matching:", error);
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

  const getCustomerName = (customerId: number) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer ? customer.name : "알 수 없음";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const calculateFeeAmount = (salary: number, rate: number) => {
    return (salary * rate) / 100;
  };

  const hasJobPostings = jobPostings.length > 0;
  const hasJobSeekings = jobSeekings.length > 0;
  const isFormReady = hasJobPostings && hasJobSeekings;

  const selectedPosting = jobPostingId
    ? jobPostings.find((p) => p.id === parseInt(jobPostingId))
    : undefined;
  const selectedSeeking = jobSeekingId
    ? jobSeekings.find((s) => s.id === parseInt(jobSeekingId))
    : undefined;

  const salaryAmount = Number(agreedSalary) || 0;
  const employerRateAmount = Number(employerFeeRate) || 0;
  const employeeRateAmount = Number(employeeFeeRate) || 0;
  const employerFee = calculateFeeAmount(salaryAmount, employerRateAmount);
  const employeeFee = calculateFeeAmount(salaryAmount, employeeRateAmount);
  const totalFee = employerFee + employeeFee;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/matchings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            취소
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">새 매칭 등록</h1>
          <p className="text-muted-foreground">
            구인 공고와 구직 공고를 매칭합니다
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
            <CardDescription>구인 공고와 구직 공고를 선택합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dataError && (
              <Alert variant="destructive">
                <AlertTitle>데이터를 불러오지 못했습니다</AlertTitle>
                <AlertDescription>{dataError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="jobPosting">
                구인 공고 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={jobPostingId}
                onValueChange={setJobPostingId}
                required
                disabled={dataLoading || !hasJobPostings}
              >
                <SelectTrigger id="jobPosting">
                  <SelectValue
                    placeholder={dataLoading ? "불러오는 중..." : "구인 공고를 선택하세요"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {hasJobPostings ? (
                    jobPostings.map((posting) => (
                      <SelectItem key={posting.id} value={posting.id.toString()}>
                        #{posting.id} - {getCustomerName(posting.customer_id)} (
                        {formatCurrency(posting.salary)})
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      등록된 구인 공고가 없습니다.
                    </div>
                  )}
                </SelectContent>
              </Select>
              {!dataLoading && !hasJobPostings && (
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-primary"
                  onClick={() => router.push("/dashboard/job-postings/new")}
                >
                  <Briefcase className="mr-2 h-4 w-4" />
                  새 구인 공고 만들기
                </Button>
              )}
              {selectedPosting && (
                <p className="text-sm text-muted-foreground">
                  구인자: {getCustomerName(selectedPosting.customer_id)} |
                  제시 급여: {formatCurrency(selectedPosting.salary)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobSeeking">
                구직 공고 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={jobSeekingId}
                onValueChange={setJobSeekingId}
                required
                disabled={dataLoading || !hasJobSeekings}
              >
                <SelectTrigger id="jobSeeking">
                  <SelectValue
                    placeholder={dataLoading ? "불러오는 중..." : "구직 공고를 선택하세요"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {hasJobSeekings ? (
                    jobSeekings.map((seeking) => (
                      <SelectItem key={seeking.id} value={seeking.id.toString()}>
                        #{seeking.id} - {getCustomerName(seeking.customer_id)} (
                        {formatCurrency(seeking.desired_salary)})
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      등록된 구직 공고가 없습니다.
                    </div>
                  )}
                </SelectContent>
              </Select>
              {!dataLoading && !hasJobSeekings && (
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-primary"
                  onClick={() => router.push("/dashboard/job-seeking/new")}
                >
                  <UserSearch className="mr-2 h-4 w-4" />
                  새 구직 공고 만들기
                </Button>
              )}
              {selectedSeeking && (
                <p className="text-sm text-muted-foreground">
                  구직자: {getCustomerName(selectedSeeking.customer_id)} |
                  희망 급여: {formatCurrency(selectedSeeking.desired_salary)} |
                  선호 지역: {selectedSeeking.preferred_location}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>급여 정보</CardTitle>
            <CardDescription>합의된 급여를 입력합니다</CardDescription>
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
            <CardDescription>
              구인자 및 구직자 수수료율을 설정합니다
            </CardDescription>
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

        <div className="flex justify-end gap-4">
          <Link href="/dashboard/matchings">
            <Button type="button" variant="outline">
              취소
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading || dataLoading || !isFormReady}
          >
            <Plus className="mr-2 h-4 w-4" />
            {loading ? "생성 중..." : "매칭 등록"}
          </Button>
        </div>
      </form>
    </div>
  );
}
