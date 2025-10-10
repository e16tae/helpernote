'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { jobPostingApi } from '@/lib/job-posting';
import { customerApi } from '@/lib/customer';
import type { Customer } from '@/types/customer';
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
import { Loader2, ArrowLeft } from 'lucide-react';

const jobSeekingSchema = z.object({
  customer_id: z.string().min(1, '고객을 선택해주세요'),
  desired_salary: z.string()
    .min(1, '희망 급여를 입력해주세요')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, '급여는 0 이상의 숫자여야 합니다')
    .refine((val) => Number(val) <= 100000000, '급여는 1억 이하여야 합니다 (100,000,000원)'),
  description: z.string().min(1, '설명을 입력해주세요'),
  preferred_location: z.string().min(1, '선호 지역을 입력해주세요'),
  employee_fee_rate: z.string().optional(),
  is_favorite: z.boolean().default(false),
});

type JobSeekingFormData = z.infer<typeof jobSeekingSchema>;

export default function NewJobSeekingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const form = useForm<JobSeekingFormData>({
    resolver: zodResolver(jobSeekingSchema),
    defaultValues: {
      customer_id: '',
      desired_salary: '',
      description: '',
      preferred_location: '',
      employee_fee_rate: '',
      is_favorite: false,
    },
  });

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoadingCustomers(true);
        // Load only employee or both type customers
        const response = await customerApi.list({ limit: 100 });
        const employeeCustomers = response.customers.filter(
          c => c.customer_type === 'Employee' || c.customer_type === 'Both'
        );
        setCustomers(employeeCustomers);
      } catch (error) {
        console.error('Failed to load customers:', error);
        toast({
          title: '오류',
          description: '고객 목록을 불러오는데 실패했습니다.',
          variant: 'destructive',
        });
      } finally {
        setLoadingCustomers(false);
      }
    };

    loadCustomers();
  }, [toast]);

  const onSubmit = async (data: JobSeekingFormData) => {
    try {
      setIsSubmitting(true);

      const submitData = {
        customer_id: parseInt(data.customer_id),
        desired_salary: data.desired_salary,
        description: data.description,
        preferred_location: data.preferred_location,
        employee_fee_rate: data.employee_fee_rate || undefined,
      };

      const jobSeeking = await jobPostingApi.createJobSeeking(submitData);

      // Update favorite status if needed
      if (data.is_favorite) {
        await jobPostingApi.updateJobSeeking(jobSeeking.id, {
          is_favorite: true,
        });
      }

      toast({
        title: '성공',
        description: '구직 공고가 등록되었습니다.',
      });

      router.push('/dashboard/job-seekers');
    } catch (error) {
      console.error('Failed to create job seeking:', error);
      toast({
        title: '오류',
        description: '구직 공고 등록에 실패했습니다.',
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
          onClick={() => router.push('/dashboard/job-seekers')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          목록으로
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">새 구직 공고 등록</h1>
        <p className="text-muted-foreground">
          새로운 구직 공고를 등록합니다
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>공고 정보</CardTitle>
          <CardDescription>
            필수 항목을 모두 입력해주세요
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
                      disabled={loadingCustomers}
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
                  onClick={() => router.push('/dashboard/job-seekers')}
                  disabled={isSubmitting}
                >
                  취소
                </Button>
                <Button type="submit" disabled={isSubmitting || loadingCustomers}>
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
