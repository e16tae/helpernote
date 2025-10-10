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
import { Loader2, ArrowLeft, Star } from 'lucide-react';

const jobPostingSchema = z.object({
  customer_id: z.string().min(1, '고객을 선택해주세요'),
  salary: z.string()
    .min(1, '급여를 입력해주세요')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, '급여는 0 이상의 숫자여야 합니다')
    .refine((val) => Number(val) <= 100000000, '급여는 1억 이하여야 합니다 (100,000,000원)'),
  description: z.string().min(1, '설명을 입력해주세요'),
  employer_fee_rate: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100),
      '수수료율은 0에서 100 사이의 숫자여야 합니다'),
  is_favorite: z.boolean().default(false),
});

type JobPostingFormData = z.infer<typeof jobPostingSchema>;

export default function NewJobPostingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const form = useForm<JobPostingFormData>({
    resolver: zodResolver(jobPostingSchema),
    defaultValues: {
      customer_id: '',
      salary: '',
      description: '',
      employer_fee_rate: '',
      is_favorite: false,
    },
  });

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoadingCustomers(true);
        // Load only employer or both type customers
        const response = await customerApi.list({ limit: 100 });
        const employerCustomers = response.customers.filter(
          c => c.customer_type === 'Employer' || c.customer_type === 'Both'
        );
        setCustomers(employerCustomers);
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

  const onSubmit = async (data: JobPostingFormData) => {
    try {
      setIsSubmitting(true);

      const submitData = {
        customer_id: parseInt(data.customer_id),
        salary: data.salary,
        description: data.description,
        employer_fee_rate: data.employer_fee_rate || undefined,
        is_favorite: data.is_favorite,
      };

      await jobPostingApi.createJobPosting(submitData);

      toast({
        title: '성공',
        description: '구인 공고가 등록되었습니다.',
      });

      router.push('/dashboard/job-postings');
    } catch (error) {
      console.error('Failed to create job posting:', error);
      toast({
        title: '오류',
        description: '구인 공고 등록에 실패했습니다.',
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
          onClick={() => router.push('/dashboard/job-postings')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          목록으로
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">새 구인 공고 등록</h1>
        <p className="text-muted-foreground">
          새로운 구인 공고를 등록합니다
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
                    <FormLabel>고객 (고용주) *</FormLabel>
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
                      구인 공고를 등록할 고용주를 선택하세요
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>급여 *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="3000000"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      제시 급여를 숫자로 입력하세요 (원 단위)
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
                        placeholder="구인 공고 내용을 입력하세요"
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
                name="employer_fee_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>고용주 수수료율 (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="5.0"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      고용주에게 적용될 수수료율을 입력하세요 (선택사항, 미입력 시 기본 수수료율 적용)
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
                      <FormLabel className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        즐겨찾기에 추가
                      </FormLabel>
                      <FormDescription>
                        이 공고를 즐겨찾기에 추가하면 목록에서 쉽게 찾을 수 있습니다
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/job-postings')}
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
