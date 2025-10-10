'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { customerApi } from '@/lib/customer';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { tagApi } from '@/lib/tag';
import apiClient from '@/lib/api';
import type { Tag } from '@/types/tag';

const customerSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  phone: z.string()
    .min(1, '전화번호를 입력해주세요')
    .regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'),
  birth_date: z.string().optional(),
  address: z.string().optional(),
  customer_type: z.enum(['Employer', 'Employee', 'Both'], {
    required_error: '고객 유형을 선택해주세요',
  }),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function NewCustomerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '',
      birth_date: '',
      address: '',
    },
  });

  useEffect(() => {
    const loadTags = async () => {
      try {
        const response = await tagApi.list();
        setTags(response.tags || []);
      } catch (error) {
        console.error('Failed to load tags:', error);
      }
    };
    loadTags();
  }, []);

  const toggleTag = (tagId: number) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const onSubmit = async (data: CustomerFormData) => {
    try {
      setIsSubmitting(true);

      // Remove empty optional fields
      const submitData = {
        ...data,
        birth_date: data.birth_date || undefined,
        address: data.address || undefined,
      };

      const customer = await customerApi.create(submitData);

      // Attach tags if any selected
      if (selectedTags.length > 0) {
        try {
          await apiClient.post(`/api/customers/${customer.id}/tags`, {
            tag_ids: selectedTags,
          });
        } catch (error) {
          console.error('Failed to attach tags:', error);
          // Don't fail the whole operation, just warn
          toast({
            title: '경고',
            description: '고객은 생성되었지만 태그 연결에 실패했습니다.',
            variant: 'destructive',
          });
        }
      }

      toast({
        title: '성공',
        description: '고객이 등록되었습니다.',
      });

      router.push('/dashboard/customers');
    } catch (error) {
      console.error('Failed to create customer:', error);
      toast({
        title: '오류',
        description: '고객 등록에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/customers')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          목록으로
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">새 고객 등록</h1>
        <p className="text-muted-foreground">
          새로운 고객 정보를 입력하세요
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>고객 정보</CardTitle>
          <CardDescription>
            필수 항목을 모두 입력해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이름 *</FormLabel>
                    <FormControl>
                      <Input placeholder="홍길동" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>전화번호 *</FormLabel>
                    <FormControl>
                      <Input placeholder="010-1234-5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customer_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>고객 유형 *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="고객 유형을 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Employer">고용주</SelectItem>
                        <SelectItem value="Employee">근로자</SelectItem>
                        <SelectItem value="Both">양쪽</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      일자리를 제공하는 고용주인지, 일자리를 찾는 근로자인지 선택하세요
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birth_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>생년월일</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>주소</FormLabel>
                    <FormControl>
                      <Input placeholder="서울시 강남구..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tags Section */}
              <div className="space-y-3">
                <FormLabel>태그</FormLabel>
                <FormDescription>
                  이 고객에게 연결할 태그를 선택하세요
                </FormDescription>
                {tags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    등록된 태그가 없습니다. 태그 관리 페이지에서 태그를 먼저 생성하세요.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/customers')}
                  disabled={isSubmitting}
                >
                  취소
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      등록 중...
                    </>
                  ) : (
                    '등록'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
