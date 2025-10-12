"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Briefcase, User, DollarSign, Calendar, Trash2 } from "lucide-react";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { customerApi } from "@/lib/customer";
import { Matching } from "@/types/matching";
import { JobPosting, JobSeekingPosting } from "@/types/job-posting";
import { Customer } from "@/types/customer";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const matchingStatusMap = {
  InProgress: { label: "진행중", variant: "secondary" as const },
  Completed: { label: "완료", variant: "default" as const },
  Cancelled: { label: "취소", variant: "destructive" as const },
};

export default function MatchingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const [matching, setMatching] = useState<Matching | null>(null);
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [jobSeeking, setJobSeeking] = useState<JobSeekingPosting | null>(null);
  const [employer, setEmployer] = useState<Customer | null>(null);
  const [employee, setEmployee] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);

  useEffect(() => {
    fetchMatching();
  }, [id]);

  const fetchMatching = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/matchings/${id}`);
      const matchingData = response.data;
      setMatching(matchingData);

      // Load related data in parallel
      const [jobPostingRes, jobSeekingRes] = await Promise.all([
        apiClient.get(`/api/job-postings/${matchingData.job_posting_id}`),
        apiClient.get(`/api/job-seekings/${matchingData.job_seeking_posting_id}`),
      ]);

      const postingData = jobPostingRes.data;
      const seekingData = jobSeekingRes.data;
      setJobPosting(postingData);
      setJobSeeking(seekingData);

      // Load customer data
      try {
        const [employerData, employeeData] = await Promise.all([
          customerApi.getById(postingData.customer_id),
          customerApi.getById(seekingData.customer_id),
        ]);
        setEmployer(employerData);
        setEmployee(employeeData);
      } catch (err) {
        console.error("Failed to fetch customer data:", err);
      }
    } catch (error) {
      console.error("Failed to fetch matching:", error);
      const errorMessage = getErrorMessage(error);
      toast({
        variant: "destructive",
        title: "오류",
        description: errorMessage,
      });
      router.push("/dashboard/matchings");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setDeleteItemId(parseInt(id));
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteItemId === null) return;

    try {
      await apiClient.delete(`/api/matchings/${deleteItemId}`);
      toast({
        title: "성공",
        description: "매칭이 삭제되었습니다.",
      });
      router.push("/dashboard/matchings");
    } catch (error) {
      console.error("Failed to delete matching:", error);
      const errorMessage = getErrorMessage(error);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR");
  };

  if (loading) {
    return (
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
          <CardContent className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!matching || !jobPosting || !jobSeeking) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">매칭 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/matchings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">매칭 상세 #{id}</h1>
            <p className="text-muted-foreground">매칭 정보 및 진행 상황을 확인합니다</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/matchings/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              수정
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            삭제
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-500" />
              <CardTitle>구인자 정보</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">이름</p>
              <p className="text-lg font-semibold">{employer ? employer.name : "로딩 중..."}</p>
            </div>
            {employer && employer.phone && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">연락처</p>
                <p>{employer.phone}</p>
              </div>
            )}
            {employer && employer.address && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">주소</p>
                <p>{employer.address}</p>
              </div>
            )}
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground">수수료율</p>
              <p>{matching.employer_fee_rate}%</p>
            </div>
            {matching.employer_fee_amount !== null && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">수수료 금액</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(matching.employer_fee_amount)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-500" />
              <CardTitle>구직자 정보</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">이름</p>
              <p className="text-lg font-semibold">{employee ? employee.name : "로딩 중..."}</p>
            </div>
            {employee && employee.phone && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">연락처</p>
                <p>{employee.phone}</p>
              </div>
            )}
            {employee && employee.address && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">주소</p>
                <p>{employee.address}</p>
              </div>
            )}
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground">수수료율</p>
              <p>{matching.employee_fee_rate}%</p>
            </div>
            {matching.employee_fee_amount !== null && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">수수료 금액</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(matching.employee_fee_amount)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-orange-500" />
            <CardTitle>매칭 정보</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">매칭 상태</p>
              <Badge variant={matchingStatusMap[matching.matching_status].variant}>
                {matchingStatusMap[matching.matching_status].label}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">합의 급여</p>
              <p className="text-lg font-semibold">
                {formatCurrency(matching.agreed_salary)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">구인 공고 급여</p>
              <p>{formatCurrency(jobPosting.salary)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">구직 희망 급여</p>
              <p>{formatCurrency(jobSeeking.desired_salary)}</p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">구인 공고 설명</p>
            <p className="text-sm whitespace-pre-wrap">{jobPosting.description}</p>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">구직 공고 설명</p>
            <p className="text-sm whitespace-pre-wrap">{jobSeeking.description}</p>
          </div>

          {jobSeeking.preferred_location && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">선호 근무지</p>
                <p>{jobSeeking.preferred_location}</p>
              </div>
            </>
          )}

          {matching.cancellation_reason && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">취소 사유</p>
                <p className="text-sm whitespace-pre-wrap">{matching.cancellation_reason}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>시간 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">매칭일시</span>
            <span>{formatDateTime(matching.matched_at)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">등록일시</span>
            <span>{formatDateTime(matching.created_at)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">수정일시</span>
            <span>{formatDateTime(matching.updated_at)}</span>
          </div>
          {matching.completed_at && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">완료일시</span>
              <span>{formatDateTime(matching.completed_at)}</span>
            </div>
          )}
          {matching.cancelled_at && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">취소일시</span>
              <span>{formatDateTime(matching.cancelled_at)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="매칭 삭제"
        description="정말 이 매칭을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      />
    </div>
  );
}
