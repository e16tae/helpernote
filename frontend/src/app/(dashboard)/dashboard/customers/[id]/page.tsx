'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Customer, CustomerType } from '@/types/customer';
import { customerApi } from '@/lib/customer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Edit, Loader2, Phone, MapPin, Calendar, Plus, MessageSquare } from 'lucide-react';
import apiClient from '@/lib/api';
import { ProfilePhotoUpload } from '@/components/profile-photo-upload';

interface CustomerMemo {
  id: number;
  customer_id: number;
  memo_content: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

const customerTypeLabels: Record<CustomerType, string> = {
  employer: '고용주',
  employee: '근로자',
  both: '양쪽',
};

const customerTypeVariants: Record<CustomerType, 'default' | 'secondary' | 'outline'> = {
  employer: 'default',
  employee: 'secondary',
  both: 'outline',
};

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [memos, setMemos] = useState<CustomerMemo[]>([]);
  const [newMemo, setNewMemo] = useState('');
  const [addingMemo, setAddingMemo] = useState(false);
  const [tags, setTags] = useState<{ id: number; name: string }[]>([]);

  const customerId = params.id as string;

  useEffect(() => {
    const loadCustomer = async () => {
      try {
        setLoading(true);
        const data = await customerApi.getById(parseInt(customerId));
        setCustomer(data);

        // Load memos and tags
        await Promise.all([loadMemos(), loadTags()]);
      } catch (error) {
        console.error('Failed to load customer:', error);
        toast({
          title: '오류',
          description: '고객 정보를 불러오는데 실패했습니다.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      loadCustomer();
    }
  }, [customerId, toast]);

  const loadTags = async () => {
    try {
      const response = await apiClient.get(`/api/customers/${customerId}/tags`);
      setTags(response.data.tags || []);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const loadMemos = async () => {
    try {
      const response = await apiClient.get(`/api/customers/${customerId}/memos`);
      setMemos(response.data.memos || []);
    } catch (error) {
      console.error('Failed to load memos:', error);
    }
  };

  const handleAddMemo = async () => {
    if (!newMemo.trim()) return;

    try {
      setAddingMemo(true);
      await apiClient.post(`/api/customers/${customerId}/memos`, {
        customer_id: parseInt(customerId),
        memo_content: newMemo,
      });
      setNewMemo('');
      await loadMemos();
      toast({
        title: '성공',
        description: '메모가 추가되었습니다.',
      });
    } catch (error) {
      console.error('Failed to add memo:', error);
      toast({
        title: '오류',
        description: '메모 추가에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setAddingMemo(false);
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/customers/${customerId}/edit`);
  };

  const handleBack = () => {
    router.push('/dashboard/customers');
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">고객을 찾을 수 없습니다.</p>
          <Button onClick={handleBack} className="mt-4">
            목록으로
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
          <p className="text-muted-foreground">
            등록일: {new Date(customer.created_at).toLocaleDateString('ko-KR')}
          </p>
        </div>
        <Button onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          수정
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Photo */}
        <div className="md:col-span-1">
          <ProfilePhotoUpload
            customerId={parseInt(customerId)}
            currentPhotoUrl={null}
            customerName={customer.name}
            onPhotoUploaded={() => {
              // Reload customer data to get updated profile photo
              loadCustomer();
            }}
          />
        </div>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">고객 유형</span>
              <Badge variant={customerTypeVariants[customer.customer_type]}>
                {customerTypeLabels[customer.customer_type]}
              </Badge>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">전화번호</p>
                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                </div>
              </div>

              {customer.birth_date && (
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">생년월일</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(customer.birth_date).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
              )}

              {customer.profile_photo_id && (
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">프로필 사진 ID</p>
                    <p className="text-sm text-muted-foreground">{customer.profile_photo_id}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>주소 및 태그</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">주소</p>
              {customer.address ? (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">{customer.address}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">주소 정보가 없습니다.</p>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-2">태그</p>
              {tags.length === 0 ? (
                <p className="text-sm text-muted-foreground">연결된 태그가 없습니다.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              메모
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new memo */}
          <div className="space-y-2">
            <Textarea
              placeholder="새 메모를 입력하세요..."
              value={newMemo}
              onChange={(e) => setNewMemo(e.target.value)}
              className="min-h-[80px]"
            />
            <Button
              onClick={handleAddMemo}
              disabled={!newMemo.trim() || addingMemo}
              size="sm"
            >
              {addingMemo ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  추가 중...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  메모 추가
                </>
              )}
            </Button>
          </div>

          <Separator />

          {/* Memos list */}
          <div className="space-y-3">
            {memos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                등록된 메모가 없습니다
              </p>
            ) : (
              memos.map((memo) => (
                <div
                  key={memo.id}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <p className="text-sm whitespace-pre-wrap">{memo.memo_content}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(memo.created_at).toLocaleString('ko-KR')}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
