'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { jobPostingApi } from '@/lib/job-posting';
import { customerApi } from '@/lib/customer';
import type { JobSeekingPosting } from '@/types/job-posting';
import type { Customer } from '@/types/customer';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';

const jobSeekingSchema = z.object({
  customer_id: z.string().min(1, '고객을 선택해주세요'),
  desired_salary: z.string()
    .min(1, '희망 급여를 입력해주세요')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, '급여는 0 이상의 숫자여야 합니다')
    .refine((val) => Number(val) <= 100000000, '급여는 1억 이하여야 합니다 (100,000,000원)'),
  description: z.string().min(1, '설명을 입력해주세요'),
  preferred_location: z.string().min(1, '선호 지역을 입력해주세요'),
  employee_fee_rate: z.string().optional(),
  posting_status: z.enum(['published', 'in_progress', 'closed', 'cancelled']),
  settlement_status: z.enum(['unsettled', 'settled']),
  settlement_amount: z.string().optional(),
  settlement_memo: z.string().optional(),
  is_favorite: z.boolean().default(false),
});

type JobSeekingFormData = z.infer<typeof jobSeekingSchema>;

export default function EditJobSeekingPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [jobSeeking, setJobSeeking] = useState<JobSeekingPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const seekingId = params.id as string;

  const form = useForm<JobSeekingFormData>({
    resolver: zodResolver(jobSeekingSchema),
    defaultValues: {
      customer_id: '',
      desired_salary: '',
      description: '',
      preferred_location: '',
      employee_fee_rate: '',
      posting_status: 'published',
      settlement_status: 'unsettled',
      settlement_amount: '',
      settlement_memo: '',
      is_favorite: false,
    },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load job seeking and customers in parallel
        const [seekingData, customersResponse] = await Promise.all([
          jobPostingApi.getJobSeekingById(parseInt(seekingId)),
          customerApi.list({ limit: 100 }),
        ]);

        setJobSeeking(seekingData);
        const employeeCustomers = customersResponse.customers.filter(
          c => c.customer_type === 'Employee' || c.customer_type === 'Both'
        );
        setCustomers(employeeCustomers);

        // Update form with job seeking data
        form.reset({
          customer_id: seekingData.customer_id.toString(),
          desired_salary: seekingData.desired_salary,
          description: seekingData.description,
          preferred_location: seekingData.preferred_location,
          employee_fee_rate: seekingData.employee_fee_rate || '',
          posting_status: seekingData.posting_status,
          settlement_status: seekingData.settlement_status,
          settlement_amount: seekingData.settlement_amount || '',
          settlement_memo: seekingData.settlement_memo || '',
          is_favorite: seekingData.is_favorite,
        });
      } catch (error) {
        console.error('Failed to load job seeking:', error);
        toast({
          title: '오류',
          description: '구직 공고 정보를 불러오는데 실패했습니다.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (seekingId) {
      loadData();
    }
  }, [seekingId, form, toast]);

  const onSubmit = async (data: JobSeekingFormData) => {
    try {
      setIsSubmitting(true);

      const submitData = {
        desired_salary: data.desired_salary,
        description: data.description,
        preferred_location: data.preferred_location,
        employee_fee_rate: data.employee_fee_rate || undefined,
        posting_status: data.posting_status,
        settlement_status: data.settlement_status,
        settlement_amount: data.settlement_amount || undefined,
        settlement_memo: data.settlement_memo || undefined,
        is_favorite: data.is_favorite,
      };

      await jobPostingApi.updateJobSeeking(parseInt(seekingId), submitData);

      toast({
        title: '성공',
        description: '구직 공고가 수정되었습니다.',
      });

      router.push(`/dashboard/job-seekers/${seekingId}`);
    } catch (error) {
      console.error('Failed to update job seeking:', error);
      toast({
        title: '오류',
        description: '구직 공고 수정에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!jobSeeking) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">구직 공고를 찾을 수 없습니다.</p>
          <Button onClick={() => router.push('/dashboard/job-seekers')} className="mt-4">
            목록으로
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dashboard/job-seekers/${seekingId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">구직 공고 수정</h1>
        <p className="text-muted-foreground">
          구직 공고 정보를 수정합니다
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>공고 정보</CardTitle>
          <CardDescription>
            수정할 항목을 변경하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>고객 (근로자) *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="고객을 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name} ({customer.phone})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      구직 공고를 등록할 근로자를 선택하세요
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="desired_salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>희망 급여 *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="3000000"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      희망하는 급여를 숫자로 입력하세요 (원 단위)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferred_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>선호 지역 *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="서울특별시 강남구"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      근무를 희망하는 지역을 입력하세요
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>설명 *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="구직 공고 내용을 입력하세요"
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employee_fee_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>근로자 수수료율 (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="5.0"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      근로자에게 적용될 수수료율을 입력하세요 (선택사항)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="posting_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>공고 상태 *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="published">공개</SelectItem>
                          <SelectItem value="in_progress">진행중</SelectItem>
                          <SelectItem value="closed">마감</SelectItem>
                          <SelectItem value="cancelled">취소</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="settlement_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>정산 상태 *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unsettled">미정산</SelectItem>
                          <SelectItem value="settled">정산완료</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="settlement_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>정산 금액</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="150000"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      정산 금액을 입력하세요 (선택사항)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="settlement_memo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>정산 메모</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="정산 관련 메모를 입력하세요"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_favorite"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        즐겨찾기
                      </FormLabel>
                      <FormDescription>
                        이 공고를 즐겨찾기에 추가합니다
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/job-seekers/${seekingId}`)}
                  disabled={isSubmitting}
                >
                  취소
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      수정 중...
                    </>
                  ) : (
                    '수정'
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
