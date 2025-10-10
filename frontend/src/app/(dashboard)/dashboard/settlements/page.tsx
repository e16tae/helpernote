'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, DollarSign, TrendingUp, CheckCircle, Clock, Search } from 'lucide-react';
import { jobPostingApi } from '@/lib/job-posting';
import { customerApi } from '@/lib/customer';
import { Customer } from '@/types/customer';
import apiClient from '@/lib/api';

import { JobPosting as JobPostingType, JobSeekingPosting } from '@/types/job-posting';

interface SettlementItem {
  id: number;
  type: 'posting' | 'seeking';
  customer_id: number;
  customer_name: string;
  description: string;
  amount: string;
  settlement_status: string;
  settlement_amount: string | null | undefined;
  settlement_memo: string | null | undefined;
  created_at: string;
  original: JobPostingType | JobSeekingPosting;
}

interface SettlementStats {
  totalUnsettled: number;
  totalSettled: number;
  unsettledAmount: number;
  settledAmount: number;
}

export default function SettlementsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState<SettlementItem[]>([]);
  const [filteredSettlements, setFilteredSettlements] = useState<SettlementItem[]>([]);
  const [customers, setCustomers] = useState<Record<number, Customer>>({});
  const [stats, setStats] = useState<SettlementStats>({
    totalUnsettled: 0,
    totalSettled: 0,
    unsettledAmount: 0,
    settledAmount: 0,
  });

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Settlement dialog state
  const [settleDialog, setSettleDialog] = useState<{
    open: boolean;
    item: SettlementItem | null;
  }>({ open: false, item: null });
  const [settlementAmount, setSettlementAmount] = useState('');
  const [settlementMemo, setSettlementMemo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSettlementData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [settlements, statusFilter, typeFilter, searchQuery]);

  const applyFilters = () => {
    let filtered = [...settlements];

    // Filter by settlement status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.settlement_status === statusFilter);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((s) => s.type === typeFilter);
    }

    // Search by customer name
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((s) =>
        s.customer_name.toLowerCase().includes(query)
      );
    }

    setFilteredSettlements(filtered);
  };

  const loadSettlementData = async () => {
    try {
      setLoading(true);

      // Load all job postings and job seekings
      const [postingsRes, seekingsRes, customersRes] = await Promise.all([
        jobPostingApi.listJobPostings({ limit: 1000 }),
        jobPostingApi.listJobSeekings({ limit: 1000 }),
        customerApi.list({ limit: 10000 }),
      ]);

      // Create customer map
      const customerMap: Record<number, Customer> = {};
      customersRes.customers.forEach((c) => {
        customerMap[c.id] = c;
      });
      setCustomers(customerMap);

      // Combine and transform settlements
      const allSettlements: SettlementItem[] = [];

      postingsRes.job_postings.forEach((posting) => {
        const customer = customerMap[posting.customer_id];
        allSettlements.push({
          id: posting.id,
          type: 'posting',
          customer_id: posting.customer_id,
          customer_name: customer?.name || '알 수 없음',
          description: posting.description,
          amount: posting.salary,
          settlement_status: posting.settlement_status,
          settlement_amount: posting.settlement_amount,
          settlement_memo: posting.settlement_memo,
          created_at: posting.created_at,
          original: posting,
        });
      });

      seekingsRes.job_seekings.forEach((seeking) => {
        const customer = customerMap[seeking.customer_id];
        allSettlements.push({
          id: seeking.id,
          type: 'seeking',
          customer_id: seeking.customer_id,
          customer_name: customer?.name || '알 수 없음',
          description: seeking.description,
          amount: seeking.desired_salary,
          settlement_status: seeking.settlement_status,
          settlement_amount: seeking.settlement_amount,
          settlement_memo: seeking.settlement_memo,
          created_at: seeking.created_at,
          original: seeking,
        });
      });

      // Sort by created_at descending
      allSettlements.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setSettlements(allSettlements);

      // Calculate stats
      const unsettled = allSettlements.filter(
        (s) => s.settlement_status === 'Unsettled'
      );
      const settled = allSettlements.filter(
        (s) => s.settlement_status === 'Settled'
      );

      const unsettledAmount = unsettled.reduce(
        (sum, s) => sum + parseFloat(s.settlement_amount || '0'),
        0
      );

      const settledAmount = settled.reduce(
        (sum, s) => sum + parseFloat(s.settlement_amount || '0'),
        0
      );

      setStats({
        totalUnsettled: unsettled.length,
        totalSettled: settled.length,
        unsettledAmount,
        settledAmount,
      });
    } catch (error) {
      console.error('Failed to load settlement data:', error);
      toast({
        title: '오류',
        description: '정산 데이터를 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openSettleDialog = (item: SettlementItem) => {
    setSettleDialog({ open: true, item });
    setSettlementAmount(item.settlement_amount || '');
    setSettlementMemo(item.settlement_memo || '');
  };

  const handleSettle = async () => {
    if (!settleDialog.item) return;

    try {
      setSubmitting(true);

      const endpoint =
        settleDialog.item.type === 'posting'
          ? `/api/job-postings/${settleDialog.item.id}`
          : `/api/job-seekings/${settleDialog.item.id}`;

      await apiClient.put(endpoint, {
        settlement_status: 'Settled',
        settlement_amount: settlementAmount ? parseFloat(settlementAmount) : null,
        settlement_memo: settlementMemo || null,
      });

      toast({
        title: '성공',
        description: '정산이 완료되었습니다.',
      });

      setSettleDialog({ open: false, item: null });
      await loadSettlementData();
    } catch (error) {
      console.error('Failed to settle:', error);
      toast({
        title: '오류',
        description: '정산 처리에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnsettle = async (item: SettlementItem) => {
    try {
      const endpoint =
        item.type === 'posting'
          ? `/api/job-postings/${item.id}`
          : `/api/job-seekings/${item.id}`;

      await apiClient.put(endpoint, {
        settlement_status: 'Unsettled',
      });

      toast({
        title: '성공',
        description: '정산 상태가 미정산으로 변경되었습니다.',
      });

      await loadSettlementData();
    } catch (error) {
      console.error('Failed to unsettle:', error);
      toast({
        title: '오류',
        description: '정산 상태 변경에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">정산 관리</h1>
        <p className="text-muted-foreground">수수료 정산 현황을 관리합니다</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-2 hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">미정산 건수</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUnsettled}</div>
            <p className="text-xs text-muted-foreground">정산 대기 중</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">정산 완료</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSettled}</div>
            <p className="text-xs text-muted-foreground">정산 완료됨</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">미정산 금액</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.unsettledAmount.toLocaleString()}원
            </div>
            <p className="text-xs text-muted-foreground">수령 예정</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">정산 완료 금액</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.settledAmount.toLocaleString()}원
            </div>
            <p className="text-xs text-muted-foreground">수령 완료</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="고객 이름으로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="정산 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="Unsettled">미정산</SelectItem>
                <SelectItem value="Settled">정산완료</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="posting">구인 공고</SelectItem>
                <SelectItem value="seeking">구직 공고</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Combined Settlement List */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>정산 목록</CardTitle>
          <CardDescription>
            구인 및 구직 공고의 수수료 정산을 통합 관리합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">유형</TableHead>
                <TableHead className="font-semibold">고객명</TableHead>
                <TableHead className="font-semibold">설명</TableHead>
                <TableHead className="font-semibold">금액</TableHead>
                <TableHead className="font-semibold">정산 상태</TableHead>
                <TableHead className="font-semibold">정산 금액</TableHead>
                <TableHead className="font-semibold">메모</TableHead>
                <TableHead className="font-semibold">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSettlements.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-8"
                  >
                    {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                      ? '검색 결과가 없습니다.'
                      : '정산할 항목이 없습니다.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSettlements.map((item) => (
                  <TableRow
                    key={`${item.type}-${item.id}`}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => openSettleDialog(item)}
                  >
                    <TableCell>
                      <Badge variant={item.type === 'posting' ? 'default' : 'secondary'}>
                        {item.type === 'posting' ? '구인' : '구직'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.customer_name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {item.description}
                    </TableCell>
                    <TableCell>
                      {parseFloat(item.amount).toLocaleString()}원
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.settlement_status === 'Settled' ? 'default' : 'outline'
                        }
                      >
                        {item.settlement_status === 'Settled' ? '정산완료' : '미정산'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.settlement_amount
                        ? `${parseFloat(item.settlement_amount).toLocaleString()}원`
                        : '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {item.settlement_memo || '-'}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {item.settlement_status === 'Unsettled' ? (
                        <Button size="sm" onClick={() => openSettleDialog(item)}>
                          정산 처리
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnsettle(item)}
                        >
                          미정산으로
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Settlement Dialog */}
      <Dialog
        open={settleDialog.open}
        onOpenChange={(open) => !open && setSettleDialog({ open: false, item: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정산 처리</DialogTitle>
            <DialogDescription>
              {settleDialog.item && (
                <>
                  {settleDialog.item.customer_name} -{' '}
                  <Badge
                    variant={
                      settleDialog.item.type === 'posting' ? 'default' : 'secondary'
                    }
                  >
                    {settleDialog.item.type === 'posting' ? '구인' : '구직'}
                  </Badge>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="settlement_amount">정산 금액 (원)</Label>
              <Input
                id="settlement_amount"
                type="number"
                placeholder="500000"
                value={settlementAmount}
                onChange={(e) => setSettlementAmount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="settlement_memo">정산 메모</Label>
              <Textarea
                id="settlement_memo"
                placeholder="2025-10-15 계좌 입금 완료"
                value={settlementMemo}
                onChange={(e) => setSettlementMemo(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSettleDialog({ open: false, item: null })}
              disabled={submitting}
            >
              취소
            </Button>
            <Button onClick={handleSettle} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                '정산 완료'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
