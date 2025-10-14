"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Users, Briefcase, UserSearch, Link2, DollarSign, TrendingUp, Plus, UserPlus, FileText } from "lucide-react";
import { toNumber, formatCurrency } from "@/lib/utils/currency";
import { useCustomers } from "@/hooks/queries/use-customers";
import { useJobPostings } from "@/hooks/queries/use-job-postings";
import { useJobSeekings } from "@/hooks/queries/use-job-seekings";
import { useMatchings } from "@/hooks/queries/use-matchings";
import { getErrorMessage } from "@/lib/api-client";

interface DashboardStats {
  totalCustomers: number;
  jobPostingsCount: number;
  jobSeekingsCount: number;
  matchingsCount: number;
  pendingAmount: number;
  totalRevenue: number;
}

export default function DashboardPage() {
  // React Query hooks
  const customersQuery = useCustomers();
  const jobPostingsQuery = useJobPostings();
  const jobSeekingsQuery = useJobSeekings();
  const matchingsQuery = useMatchings();

  const loading =
    customersQuery.isLoading ||
    jobPostingsQuery.isLoading ||
    jobSeekingsQuery.isLoading ||
    matchingsQuery.isLoading;

  const error =
    customersQuery.error ||
    jobPostingsQuery.error ||
    jobSeekingsQuery.error ||
    matchingsQuery.error;

  const handleRetry = () => {
    void Promise.all([
      customersQuery.refetch(),
      jobPostingsQuery.refetch(),
      jobSeekingsQuery.refetch(),
      matchingsQuery.refetch(),
    ]);
  };

  // Calculate statistics using useMemo
  const stats = useMemo<DashboardStats>(() => {
    const customers = customersQuery.data ?? [];
    const jobPostings = jobPostingsQuery.data ?? [];
    const jobSeekings = jobSeekingsQuery.data ?? [];
    const matchings = matchingsQuery.data ?? [];

    let pendingAmount = 0;
    let totalRevenue = 0;

    matchings.forEach((matching) => {
      const employerFee = toNumber(matching.employer_fee_amount);
      const employeeFee = toNumber(matching.employee_fee_amount);
      const totalFee = employerFee + employeeFee;

      totalRevenue += totalFee;

      // Check if either side is unsettled
      const jobPosting = jobPostings.find(p => p.id === matching.job_posting_id);
      const jobSeeking = jobSeekings.find(s => s.id === matching.job_seeking_posting_id);

      if (jobPosting?.settlement_status === "Unsettled") {
        pendingAmount += employerFee;
      }
      if (jobSeeking?.settlement_status === "Unsettled") {
        pendingAmount += employeeFee;
      }
    });

    return {
      totalCustomers: customers.length,
      jobPostingsCount: jobPostings.length,
      jobSeekingsCount: jobSeekings.length,
      matchingsCount: matchings.length,
      pendingAmount,
      totalRevenue,
    };
  }, [
    customersQuery.data,
    jobPostingsQuery.data,
    jobSeekingsQuery.data,
    matchingsQuery.data,
  ]);

  const statCards = [
    {
      title: "전체 고객",
      value: stats.totalCustomers.toString(),
      description: "등록된 고객 수",
      icon: Users,
      color: "text-chart-1",
    },
    {
      title: "구인 공고",
      value: stats.jobPostingsCount.toString(),
      description: "활성 구인 공고",
      icon: Briefcase,
      color: "text-chart-2",
    },
    {
      title: "구직 공고",
      value: stats.jobSeekingsCount.toString(),
      description: "활성 구직 공고",
      icon: UserSearch,
      color: "text-chart-3",
    },
    {
      title: "매칭",
      value: stats.matchingsCount.toString(),
      description: "성공한 매칭",
      icon: Link2,
      color: "text-chart-4",
    },
    {
      title: "미정산 금액",
      value: formatCurrency(stats.pendingAmount),
      description: "정산 대기 중",
      icon: DollarSign,
      color: "text-chart-5",
    },
    {
      title: "총 수수료",
      value: formatCurrency(stats.totalRevenue),
      description: "전체 매칭 수수료",
      icon: TrendingUp,
      color: "text-chart-6",
    },
  ];

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>데이터를 불러오지 못했습니다</AlertTitle>
          <AlertDescription>{getErrorMessage(error)}</AlertDescription>
        </Alert>
        <Button onClick={handleRetry}>다시 시도</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground">
          취업 알선 활동 현황을 한눈에 확인하세요
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>빠른 작업</CardTitle>
            <CardDescription>
              자주 사용하는 작업 바로가기
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/customers/new">
              <Button variant="outline" className="w-full justify-start">
                <UserPlus className="mr-2 h-4 w-4" />
                새 고객 추가
              </Button>
            </Link>
            <Link href="/dashboard/job-postings/new">
              <Button variant="outline" className="w-full justify-start">
                <Briefcase className="mr-2 h-4 w-4" />
                새 구인 공고
              </Button>
            </Link>
            <Link href="/dashboard/job-seeking/new">
              <Button variant="outline" className="w-full justify-start">
                <UserSearch className="mr-2 h-4 w-4" />
                새 구직 공고
              </Button>
            </Link>
            <Link href="/dashboard/matchings/new">
              <Button variant="outline" className="w-full justify-start">
                <Link2 className="mr-2 h-4 w-4" />
                새 매칭 생성
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>바로가기</CardTitle>
            <CardDescription>
              주요 메뉴로 빠르게 이동
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/customers">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                고객 관리
              </Button>
            </Link>
            <Link href="/dashboard/matchings">
              <Button variant="outline" className="w-full justify-start">
                <Link2 className="mr-2 h-4 w-4" />
                매칭 관리
              </Button>
            </Link>
            <Link href="/dashboard/settlements">
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="mr-2 h-4 w-4" />
                정산 관리
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                설정
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
