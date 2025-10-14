"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus } from "lucide-react";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { CreateMatchingRequest } from "@/types/matching";
import { JobPosting, JobSeekingPosting } from "@/types/job-posting";
import { Customer } from "@/types/customer";
import { customerApi } from "@/lib/customer";
import { useToast } from "@/hooks/use-toast";

export default function NewMatchingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [jobSeekings, setJobSeekings] = useState<JobSeekingPosting[]>([]);

  // Form state
  const [jobPostingId, setJobPostingId] = useState("");
  const [jobSeekingId, setJobSeekingId] = useState("");
  const [agreedSalary, setAgreedSalary] = useState("");
  const [employerFeeRate, setEmployerFeeRate] = useState("10");
  const [employeeFeeRate, setEmployeeFeeRate] = useState("5");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [customersData, jobPostingsData, jobSeekingsData] = await Promise.all([
        customerApi.getAll(),
        apiClient.get("/api/job-postings"),
        apiClient.get("/api/job-seekings"),
      ]);

      setCustomers(customersData);
      setJobPostings(jobPostingsData.data.job_postings || []);
      setJobSeekings(jobSeekingsData.data.job_seekings || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobPostingId || !jobSeekingId || !agreedSalary) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "모든 필수 항목을 입력해주세요.",
      });
      return;
    }

    setLoading(true);

    try {
      const payload: CreateMatchingRequest = {
        job_posting_id: parseInt(jobPostingId),
        job_seeking_posting_id: parseInt(jobSeekingId),
        agreed_salary: parseFloat(agreedSalary),
        employer_fee_rate: parseFloat(employerFeeRate),
        employee_fee_rate: parseFloat(employeeFeeRate),
      };

      const response = await apiClient.post("/api/matchings", payload);
      router.push(`/dashboard/matchings/${response.data.id}`);
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

  const selectedPosting = jobPostings.find((p) => p.id === parseInt(jobPostingId));
  const selectedSeeking = jobSeekings.find((s) => s.id === parseInt(jobSeekingId));
  const salaryAmount = parseFloat(agreedSalary) || 0;
  const employerFee = calculateFeeAmount(salaryAmount, parseFloat(employerFeeRate));
  const employeeFee = calculateFeeAmount(salaryAmount, parseFloat(employeeFeeRate));
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
            <div className="space-y-2">
              <Label htmlFor="jobPosting">
                구인 공고 <span className="text-destructive">*</span>
              </Label>
              <Select value={jobPostingId} onValueChange={setJobPostingId} required>
                <SelectTrigger id="jobPosting">
                  <SelectValue placeholder="구인 공고를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {jobPostings.map((posting) => (
                    <SelectItem key={posting.id} value={posting.id.toString()}>
                      #{posting.id} - {getCustomerName(posting.customer_id)} ({formatCurrency(posting.salary)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Select value={jobSeekingId} onValueChange={setJobSeekingId} required>
                <SelectTrigger id="jobSeeking">
                  <SelectValue placeholder="구직 공고를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {jobSeekings.map((seeking) => (
                    <SelectItem key={seeking.id} value={seeking.id.toString()}>
                      #{seeking.id} - {getCustomerName(seeking.customer_id)} ({formatCurrency(seeking.desired_salary)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <Button type="submit" disabled={loading}>
            <Plus className="mr-2 h-4 w-4" />
            {loading ? "생성 중..." : "매칭 등록"}
          </Button>
        </div>
      </form>
    </div>
  );
}
