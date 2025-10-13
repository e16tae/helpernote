"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Eye, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { customerApi } from "@/lib/customer";
import { Matching } from "@/types/matching";
import { JobPosting, JobSeekingPosting } from "@/types/job-posting";
import { Customer } from "@/types/customer";
import { toNumber, formatCurrencyFromString } from "@/lib/utils/currency";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { usePagination } from "@/hooks/use-pagination";
import { ResponsiveDataList, Column } from "@/components/ui/responsive-data-list";

interface SettlementInfo {
  matching: Matching;
  jobPosting: JobPosting;
  jobSeeking: JobSeekingPosting;
  employerName: string;
  employeeName: string;
}

const settlementStatusMap = {
  Unsettled: { label: "미정산", variant: "destructive" as const },
  Settled: { label: "정산완료", variant: "default" as const },
};

export default function SettlementsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState<SettlementInfo[]>([]);
  const [customerMap, setCustomerMap] = useState<Map<number, Customer>>(new Map());

  useEffect(() => {
    fetchSettlements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSettlements = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [matchingsRes, jobPostingsRes, jobSeekingsRes, customers] = await Promise.all([
        apiClient.get("/api/matchings"),
        apiClient.get("/api/job-postings"),
        apiClient.get("/api/job-seekings"),
        customerApi.getAll(),
      ]);

      const matchings: Matching[] = matchingsRes.data.matchings || [];
      const jobPostings: JobPosting[] = jobPostingsRes.data.job_postings || [];
      const jobSeekings: JobSeekingPosting[] = jobSeekingsRes.data.job_seekings || [];

      // Create customer map
      const custMap = new Map(customers.map((c) => [c.id, c]));
      setCustomerMap(custMap);

      // Create job posting and seeking maps
      const postingMap = new Map(jobPostings.map((p) => [p.id, p]));
      const seekingMap = new Map(jobSeekings.map((s) => [s.id, s]));

      // Combine data
      const settlementInfos: SettlementInfo[] = matchings
        .map((matching) => {
          const jobPosting = postingMap.get(matching.job_posting_id);
          const jobSeeking = seekingMap.get(matching.job_seeking_posting_id);

          if (!jobPosting || !jobSeeking) return null;

          const employer = custMap.get(jobPosting.customer_id);
          const employee = custMap.get(jobSeeking.customer_id);

          return {
            matching,
            jobPosting,
            jobSeeking,
            employerName: employer?.name || "알 수 없음",
            employeeName: employee?.name || "알 수 없음",
          };
        })
        .filter((info): info is SettlementInfo => info !== null);

      setSettlements(settlementInfos);
    } catch (error) {
      console.error("Failed to fetch settlements:", error);
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

  const filteredSettlements = settlements.filter((settlement) => {
    const matchesSearch =
      settlement.employerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      settlement.employeeName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Pagination for all settlements
  const {
    paginatedItems: paginatedAllSettlements,
    currentPage: allCurrentPage,
    totalPages: allTotalPages,
    setCurrentPage: setAllCurrentPage,
  } = usePagination({
    items: filteredSettlements,
    itemsPerPage: 10,
    resetDependencies: [searchTerm],
  });

  // Calculate statistics
  const stats = settlements.reduce(
    (acc, settlement) => {
      const employerFee = toNumber(settlement.matching.employer_fee_amount);
      const employeeFee = toNumber(settlement.matching.employee_fee_amount);
      const totalFee = employerFee + employeeFee;

      acc.totalCommission += totalFee;

      if (settlement.jobPosting.settlement_status === "Unsettled") {
        acc.pendingAmount += toNumber(settlement.jobPosting.settlement_amount) || employerFee;
      }

      if (settlement.jobSeeking.settlement_status === "Unsettled") {
        acc.pendingAmount += toNumber(settlement.jobSeeking.settlement_amount) || employeeFee;
      }

      if (settlement.jobPosting.settlement_status === "Settled") {
        acc.paidAmount += toNumber(settlement.jobPosting.settlement_amount) || employerFee;
      }

      if (settlement.jobSeeking.settlement_status === "Settled") {
        acc.paidAmount += toNumber(settlement.jobSeeking.settlement_amount) || employeeFee;
      }

      return acc;
    },
    { totalCommission: 0, pendingAmount: 0, paidAmount: 0 }
  );

  const pendingSettlements = filteredSettlements.filter(
    (s) =>
      s.jobPosting.settlement_status === "Unsettled" ||
      s.jobSeeking.settlement_status === "Unsettled"
  );

  const paidSettlements = filteredSettlements.filter(
    (s) =>
      s.jobPosting.settlement_status === "Settled" &&
      s.jobSeeking.settlement_status === "Settled"
  );

  // Pagination for pending settlements
  const {
    paginatedItems: paginatedPendingSettlements,
    currentPage: pendingCurrentPage,
    totalPages: pendingTotalPages,
    setCurrentPage: setPendingCurrentPage,
  } = usePagination({
    items: pendingSettlements,
    itemsPerPage: 10,
    resetDependencies: [searchTerm],
  });

  // Pagination for paid settlements
  const {
    paginatedItems: paginatedPaidSettlements,
    currentPage: paidCurrentPage,
    totalPages: paidTotalPages,
    setCurrentPage: setPaidCurrentPage,
  } = usePagination({
    items: paidSettlements,
    itemsPerPage: 10,
    resetDependencies: [searchTerm],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
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

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-24" />
              ))}
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">정산 관리</h1>
        <p className="text-muted-foreground">
          매칭 수수료 정산 현황을 관리합니다
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 수수료</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalCommission)}
            </div>
            <p className="text-xs text-muted-foreground">전체 매칭 수수료</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">미정산 금액</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.pendingAmount)}
            </div>
            <p className="text-xs text-muted-foreground">대기중인 정산</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">정산 완료</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.paidAmount)}
            </div>
            <p className="text-xs text-muted-foreground">지급 완료된 금액</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>정산 목록</CardTitle>
          <CardDescription>
            매칭별 수수료 정산 현황을 확인하고 관리합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="pending">미정산</TabsTrigger>
              <TabsTrigger value="paid">정산완료</TabsTrigger>
            </TabsList>

            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="구인자, 구직자 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <TabsContent value="all" className="space-y-4">
              <SettlementTable settlements={paginatedAllSettlements} formatCurrency={formatCurrency} />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  총 {filteredSettlements.length}개 (페이지 {allCurrentPage} / {allTotalPages || 1})
                </p>
                <PaginationControls
                  currentPage={allCurrentPage}
                  totalPages={allTotalPages}
                  onPageChange={setAllCurrentPage}
                />
              </div>
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <SettlementTable settlements={paginatedPendingSettlements} formatCurrency={formatCurrency} />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  총 {pendingSettlements.length}개 (페이지 {pendingCurrentPage} / {pendingTotalPages || 1})
                </p>
                <PaginationControls
                  currentPage={pendingCurrentPage}
                  totalPages={pendingTotalPages}
                  onPageChange={setPendingCurrentPage}
                />
              </div>
            </TabsContent>

            <TabsContent value="paid" className="space-y-4">
              <SettlementTable settlements={paginatedPaidSettlements} formatCurrency={formatCurrency} />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  총 {paidSettlements.length}개 (페이지 {paidCurrentPage} / {paidTotalPages || 1})
                </p>
                <PaginationControls
                  currentPage={paidCurrentPage}
                  totalPages={paidTotalPages}
                  onPageChange={setPaidCurrentPage}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface SettlementTableProps {
  settlements: SettlementInfo[];
  formatCurrency: (amount: number) => string;
}

function SettlementTable({ settlements, formatCurrency }: SettlementTableProps) {
  const columns: Column<SettlementInfo>[] = [
    {
      key: "id",
      header: "매칭 ID",
      mobileLabel: "매칭 ID",
      cell: (settlement) => <span className="font-medium">#{settlement.matching.id}</span>,
    },
    {
      key: "employer",
      header: "구인자",
      mobileLabel: "구인자",
      cell: (settlement) => settlement.employerName,
    },
    {
      key: "employee",
      header: "구직자",
      mobileLabel: "구직자",
      cell: (settlement) => settlement.employeeName,
    },
    {
      key: "salary",
      header: "합의 급여",
      mobileLabel: "합의 급여",
      cell: (settlement) => formatCurrencyFromString(settlement.matching.agreed_salary),
    },
    {
      key: "employer_fee",
      header: "구인자 수수료",
      mobileLabel: "구인 수수료",
      cell: (settlement) => formatCurrencyFromString(settlement.matching.employer_fee_amount),
      hideOnMobile: true,
    },
    {
      key: "employer_status",
      header: "구인자 정산",
      mobileLabel: "구인 정산",
      cell: (settlement) => (
        <Badge variant={settlementStatusMap[settlement.jobPosting.settlement_status].variant}>
          {settlementStatusMap[settlement.jobPosting.settlement_status].label}
        </Badge>
      ),
    },
    {
      key: "employee_fee",
      header: "구직자 수수료",
      mobileLabel: "구직 수수료",
      cell: (settlement) => formatCurrencyFromString(settlement.matching.employee_fee_amount),
      hideOnMobile: true,
    },
    {
      key: "employee_status",
      header: "구직자 정산",
      mobileLabel: "구직 정산",
      cell: (settlement) => (
        <Badge variant={settlementStatusMap[settlement.jobSeeking.settlement_status].variant}>
          {settlementStatusMap[settlement.jobSeeking.settlement_status].label}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "작업",
      mobileLabel: "작업",
      className: "text-right",
      cell: (settlement) => (
        <Link href={`/dashboard/matchings/${settlement.matching.id}`}>
          <Button variant="ghost" size="sm" aria-label={`매칭 ${settlement.matching.id} 상세 보기`}>
            <Eye className="h-4 w-4 md:mr-2" aria-hidden="true" />
            <span className="hidden md:inline">상세</span>
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <ResponsiveDataList
      data={settlements}
      columns={columns}
      keyExtractor={(settlement) => settlement.matching.id.toString()}
      emptyMessage="정산 내역이 없습니다"
    />
  );
}
