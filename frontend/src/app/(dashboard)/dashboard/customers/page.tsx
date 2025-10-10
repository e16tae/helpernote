'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Customer, CustomerType } from '@/types/customer';
import { customerApi } from '@/lib/customer';
import { tagApi } from '@/lib/tag';
import type { Tag } from '@/types/tag';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Loader2, Eye, Pencil, Trash2, Filter, X } from 'lucide-react';
import { getErrorMessage, getErrorTitle } from '@/lib/error-handler';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
} from '@/components/ui/card';

export default function CustomersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType | 'ALL'>('ALL');
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    customer: Customer | null;
  }>({ open: false, customer: null });
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [tagsOpen, setTagsOpen] = useState(false);

  const loadCustomers = async () => {
    try {
      setLoading(true);

      let response;
      if (search) {
        // Use search API
        response = await customerApi.search({
          q: search,
          limit: 20,
          offset: (page - 1) * 20,
        });
      } else {
        // Use list API
        response = await customerApi.list({
          customer_type: customerType !== 'ALL' ? customerType : undefined,
          tag_ids: selectedTagIds.length > 0 ? selectedTagIds.join(',') : undefined,
          limit: 20,
          offset: (page - 1) * 20,
        });
      }

      setCustomers(response.customers);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load customers:', error);
      toast({
        title: getErrorTitle(error),
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const response = await tagApi.list();
      setTags(response.tags);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [search, customerType, selectedTagIds, page]);

  const handleView = (customer: Customer) => {
    router.push(`/dashboard/customers/${customer.id}`);
  };

  const handleEdit = (customer: Customer) => {
    router.push(`/dashboard/customers/${customer.id}/edit`);
  };

  const handleDeleteClick = (customer: Customer) => {
    setDeleteDialog({ open: true, customer });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.customer) return;

    try {
      setDeleting(true);
      await customerApi.delete(deleteDialog.customer.id);
      toast({
        title: '성공',
        description: '고객이 삭제되었습니다.',
      });
      setDeleteDialog({ open: false, customer: null });
      loadCustomers();
    } catch (error) {
      console.error('Failed to delete customer:', error);
      toast({
        title: getErrorTitle(error),
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateNew = () => {
    router.push('/dashboard/customers/new');
  };

  const handleToggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
    setPage(1); // Reset to first page when filter changes
  };

  const handleClearTagFilters = () => {
    setSelectedTagIds([]);
    setPage(1);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">고객 관리</h1>
          <p className="text-muted-foreground">
            등록된 고객 정보를 관리합니다
          </p>
        </div>
        <Button onClick={handleCreateNew} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          새 고객 등록
        </Button>
      </div>

      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="고객 이름 또는 전화번호로 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              value={customerType}
              onValueChange={(value) => setCustomerType(value as CustomerType | 'ALL')}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                <SelectItem value="employer">고용주</SelectItem>
                <SelectItem value="employee">근로자</SelectItem>
                <SelectItem value="both">양쪽</SelectItem>
              </SelectContent>
            </Select>
            <Popover open={tagsOpen} onOpenChange={setTagsOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-start">
                  <Filter className="mr-2 h-4 w-4" />
                  태그 필터
                  {selectedTagIds.length > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {selectedTagIds.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0" align="start">
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">태그 선택</h4>
                    {selectedTagIds.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearTagFilters}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {tags.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        태그가 없습니다
                      </p>
                    ) : (
                      tags.map((tag) => (
                        <div
                          key={tag.id}
                          className="flex items-center space-x-2 hover:bg-accent rounded-md p-2 cursor-pointer"
                          onClick={() => handleToggleTag(tag.id)}
                        >
                          <Checkbox
                            checked={selectedTagIds.includes(tag.id)}
                            onCheckedChange={() => handleToggleTag(tag.id)}
                          />
                          <Badge
                            variant="secondary"
                            style={{
                              backgroundColor: tag.color ? `${tag.color}20` : undefined,
                              color: tag.color || undefined,
                              borderColor: tag.color || undefined,
                            }}
                            className="flex-1"
                          >
                            {tag.name}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          {selectedTagIds.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">선택된 태그:</span>
              {selectedTagIds.map((tagId) => {
                const tag = tags.find((t) => t.id === tagId);
                if (!tag) return null;
                return (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    style={{
                      backgroundColor: tag.color ? `${tag.color}20` : undefined,
                      color: tag.color || undefined,
                      borderColor: tag.color || undefined,
                    }}
                    className="cursor-pointer"
                    onClick={() => handleToggleTag(tag.id)}
                  >
                    {tag.name}
                    <X className="ml-1 h-3 w-3" />
                  </Badge>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <Card className="border-2">
          <CardContent className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-2">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">이름</TableHead>
                    <TableHead className="font-semibold">전화번호</TableHead>
                    <TableHead className="font-semibold">고객 유형</TableHead>
                    <TableHead className="font-semibold">주소</TableHead>
                    <TableHead className="font-semibold">등록일</TableHead>
                    <TableHead className="text-right font-semibold">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-10 w-10 text-muted-foreground/50" />
                          <p>등록된 고객이 없습니다</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((customer) => (
                      <TableRow
                        key={customer.id}
                        className="hover:bg-accent/50 transition-colors"
                      >
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.phone}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-medium">
                            {customer.customer_type === 'Employer' && '고용주'}
                            {customer.customer_type === 'Employee' && '근로자'}
                            {customer.customer_type === 'Both' && '양쪽'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{customer.address || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(customer.created_at).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(customer)}
                              className="hover:bg-primary/10 hover:text-primary"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(customer)}
                              className="hover:bg-primary/10 hover:text-primary"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(customer)}
                              className="hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {total > 20 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                이전
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {Math.ceil(total / 20)}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / 20)}
              >
                다음
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={deleteDialog.open} onOpenChange={(open) => !deleting && setDeleteDialog({ open, customer: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>고객 삭제</DialogTitle>
            <DialogDescription>
              정말로 {deleteDialog.customer?.name} 고객을 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, customer: null })}
              disabled={deleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  삭제 중...
                </>
              ) : (
                '삭제'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
