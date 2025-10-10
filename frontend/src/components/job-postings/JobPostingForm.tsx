'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { jobPostingsApi } from '@/lib/api/job-postings';
import { useToast } from '@/components/ui/use-toast';
import type { JobPostingFormData } from '@/types/job-posting';

const jobPostingSchema = z.object({
  customer_id: z.number().min(1, '고객을 선택해주세요'),
  salary: z.string().min(1, '급여를 입력해주세요'),
  description: z.string().min(10, '상세 설명을 10자 이상 입력해주세요'),
  employer_fee_rate: z.string().optional(),
});

interface JobPostingFormProps {
  initialData?: Partial<JobPostingFormData>;
  onSubmit?: (data: JobPostingFormData) => Promise<void>;
}

export function JobPostingForm({ initialData, onSubmit }: JobPostingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<JobPostingFormData>({
    resolver: zodResolver(jobPostingSchema as any),
    defaultValues: {
      customer_id: initialData?.customer_id || 0,
      salary: initialData?.salary || '',
      description: initialData?.description || '',
      employer_fee_rate: initialData?.employer_fee_rate || '',
    },
  });

  const salary = watch('salary');
  const employerFeeRate = watch('employer_fee_rate');
  const estimatedFee = salary && employerFeeRate
    ? (parseFloat(salary) * parseFloat(employerFeeRate)) / 100
    : 0;

  const handleFormSubmit = async (data: JobPostingFormData) => {
    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        await jobPostingsApi.createJobPosting(data);
        toast({
          title: '구인 공고 등록 완료',
          description: '구인 공고가 성공적으로 등록되었습니다.',
        });
        router.push('/dashboard/job-postings');
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '구인 공고 등록 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>구인 공고의 기본 정보를 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="customer_id">고객 ID *</Label>
            <Input
              id="customer_id"
              type="number"
              {...register('customer_id', { valueAsNumber: true })}
              placeholder="고객 ID를 입력하세요"
            />
            {errors.customer_id && (
              <p className="text-sm text-destructive mt-1">{errors.customer_id.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="salary">급여 *</Label>
            <Input
              id="salary"
              {...register('salary')}
              placeholder="예: 150000.00"
            />
            {errors.salary && (
              <p className="text-sm text-destructive mt-1">{errors.salary.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">상세 설명 *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="구인 공고의 상세 내용을 입력하세요"
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="employer_fee_rate">고용주 수수료율 (%)</Label>
            <Input
              id="employer_fee_rate"
              {...register('employer_fee_rate')}
              placeholder="예: 10.00 (비워두면 기본값 사용)"
            />
            {errors.employer_fee_rate && (
              <p className="text-sm text-destructive mt-1">{errors.employer_fee_rate.message}</p>
            )}
          </div>

          {employerFeeRate && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">예상 수수료</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('ko-KR', {
                  style: 'currency',
                  currency: 'KRW',
                }).format(estimatedFee)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '저장 중...' : '저장'}
        </Button>
      </div>
    </form>
  );
}
