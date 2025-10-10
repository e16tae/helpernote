'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Briefcase, UserSearch, Link2, DollarSign, Plus, Loader2 } from 'lucide-react';
import { customerApi } from '@/lib/customer';
import { jobPostingApi } from '@/lib/job-posting';
import { matchingApi } from '@/lib/matching';
import type { Customer } from '@/types/customer';
import type { Matching } from '@/types/matching';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning';
}

function StatCard({ title, value, description, icon, trend, variant = 'primary' }: StatCardProps) {
  const variantStyles = {
    primary: 'bg-primary/5 text-primary border-primary/20',
    secondary: 'bg-secondary/5 text-secondary border-secondary/20',
    accent: 'bg-accent/5 text-accent-foreground border-accent/20',
    success: 'bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20',
  };

  const iconBgStyles = {
    primary: 'bg-primary/10',
    secondary: 'bg-secondary/10',
    accent: 'bg-accent/10',
    success: 'bg-emerald-500/10',
    warning: 'bg-amber-500/10',
  };

  const valueStyles = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent-foreground',
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
  };

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-lg group border-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground">{title}</CardTitle>
        <div className={`rounded-xl ${iconBgStyles[variant]} p-3 transition-transform group-hover:scale-110`}>
          <div className={variantStyles[variant].split(' ')[1]}>{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${valueStyles[variant]} mb-1`}>{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <p className="text-xs text-primary mt-3 font-medium flex items-center gap-1">
            <span className="text-primary">↗</span> {trend}
          </p>
        )}
      </CardContent>
      <div className={`absolute top-0 right-0 w-32 h-32 ${iconBgStyles[variant]} rounded-full -mr-16 -mt-16 opacity-20`} />
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalJobPostings: 0,
    totalJobSeekers: 0,
    activeMatches: 0,
    monthlyRevenue: 0,
  });
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [recentMatchings, setRecentMatchings] = useState<Matching[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Load statistics (no limit for accurate counts)
        const [customersRes, jobPostingsRes, jobSeekersRes, matchingsRes] = await Promise.all([
          customerApi.list({ limit: 10000 }), // Get all customers for accurate total
          jobPostingApi.listJobPostings({ limit: 10000 }), // Get all for accurate total
          jobPostingApi.listJobSeekings({ limit: 10000 }), // Get all for accurate total
          matchingApi.list({ limit: 10000 }), // Get all for accurate total
        ]);

        // Calculate in-progress matchings
        const inProgress = matchingsRes.matchings.filter(m => m.matching_status === 'InProgress').length;

        // Calculate completed matchings
        const completed = matchingsRes.matchings.filter(m => m.matching_status === 'Completed');

        // Calculate total revenue from completed matchings
        const revenue = completed.reduce((sum, matching) => {
          const employerFee = parseFloat(matching.employer_fee_amount || '0');
          const employeeFee = parseFloat(matching.employee_fee_amount || '0');
          return sum + employerFee + employeeFee;
        }, 0);

        setStats({
          totalCustomers: customersRes.total,
          totalJobPostings: jobPostingsRes.total,
          totalJobSeekers: jobSeekersRes.total,
          activeMatches: inProgress,
          monthlyRevenue: revenue,
        });

        setRecentCustomers(customersRes.customers.slice(0, 5));
        setRecentMatchings(matchingsRes.matchings.slice(0, 5));
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground">
          헬퍼노트 관리 시스템 현황을 확인하세요
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="전체 고객"
              value={stats.totalCustomers}
              description="등록된 전체 고객 수"
              icon={<Users className="h-5 w-5" />}
              variant="primary"
            />
            <StatCard
              title="활성 구인 공고"
              value={stats.totalJobPostings}
              description="현재 활성 구인 공고 수"
              icon={<Briefcase className="h-5 w-5" />}
              variant="secondary"
            />
            <StatCard
              title="활성 구직 공고"
              value={stats.totalJobSeekers}
              description="현재 활성 구직 공고 수"
              icon={<UserSearch className="h-5 w-5" />}
              variant="warning"
            />
            <StatCard
              title="진행중인 매칭"
              value={stats.activeMatches}
              description="현재 진행 중인 매칭"
              icon={<Link2 className="h-5 w-5" />}
              variant="accent"
            />
            <StatCard
              title="총 수익"
              value={`${stats.monthlyRevenue.toLocaleString()}원`}
              description="완료된 매칭 수수료 합계"
              icon={<DollarSign className="h-5 w-5" />}
              variant="success"
            />
          </div>

          {/* Quick Actions */}
          <Card className="border-2 hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">빠른 작업</CardTitle>
              <CardDescription>자주 사용하는 기능</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Button
                  className="w-full justify-start h-12 hover:border-primary transition-all"
                  variant="outline"
                  onClick={() => router.push('/dashboard/customers/new')}
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Plus className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">새 고객 등록</span>
                  </div>
                </Button>
                <Button
                  className="w-full justify-start h-12 hover:border-secondary transition-all"
                  variant="outline"
                  onClick={() => router.push('/dashboard/job-postings/new')}
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-secondary/10 p-2">
                      <Plus className="h-4 w-4 text-secondary" />
                    </div>
                    <span className="font-medium">구인 공고 등록</span>
                  </div>
                </Button>
                <Button
                  className="w-full justify-start h-12 hover:border-amber-500 transition-all"
                  variant="outline"
                  onClick={() => router.push('/dashboard/job-seekers/new')}
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-500/10 p-2">
                      <Plus className="h-4 w-4 text-amber-600" />
                    </div>
                    <span className="font-medium">구직 공고 등록</span>
                  </div>
                </Button>
                <Button
                  className="w-full justify-start h-12 hover:border-accent transition-all"
                  variant="outline"
                  onClick={() => router.push('/dashboard/matchings/new')}
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-accent/10 p-2">
                      <Plus className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <span className="font-medium">매칭 생성</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Customers */}
        <Card className="border-2 hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">최근 등록 고객</CardTitle>
            <CardDescription>최근에 등록된 고객 목록</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">로딩중...</p>
            ) : recentCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="rounded-full bg-primary/10 p-5">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h4 className="font-semibold">아직 등록된 고객이 없습니다</h4>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    첫 번째 고객을 등록하여 관리를 시작하세요
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => router.push('/dashboard/customers/new')}
                  className="mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  새 고객 등록
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                  >
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">{customer.phone}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/customers/${customer.id}`);
                      }}
                    >
                      보기
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Matchings */}
        <Card className="border-2 hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">최근 매칭</CardTitle>
            <CardDescription>최근에 생성된 매칭 목록</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">로딩중...</p>
            ) : recentMatchings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="rounded-full bg-accent/10 p-5">
                  <Link2 className="h-10 w-10 text-accent-foreground" />
                </div>
                <div className="text-center space-y-2">
                  <h4 className="font-semibold">아직 생성된 매칭이 없습니다</h4>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    고객과 공고를 매칭하여 관리를 시작하세요
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => router.push('/dashboard/matchings/new')}
                  className="mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  매칭 생성
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentMatchings.map((matching) => (
                  <div
                    key={matching.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/matchings/${matching.id}`)}
                  >
                    <div>
                      <p className="font-medium">매칭 #{matching.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {parseInt(matching.agreed_salary).toLocaleString()}원
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        matching.matching_status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600' :
                        matching.matching_status === 'Cancelled' ? 'bg-destructive/10 text-destructive' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {matching.matching_status === 'InProgress' ? '진행중' :
                         matching.matching_status === 'Completed' ? '완료' : '취소'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/matchings/${matching.id}`);
                        }}
                      >
                        보기
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
