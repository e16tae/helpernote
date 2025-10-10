'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { matchingsApi } from '@/lib/api/matchings';
import { useToast } from '@/components/ui/use-toast';
import type { MatchingFormData } from '@/types/matching';

interface MatchingFormProps {
  initialData?: Partial<MatchingFormData>;
  onSubmit?: (data: MatchingFormData) => Promise<void>;
}

export function MatchingForm({ initialData, onSubmit }: MatchingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MatchingFormData>({
    defaultValues: {
      jobPostingId: initialData?.jobPostingId || '',
      jobSeekingId: initialData?.jobSeekingId || '',
      notes: initialData?.notes || '',
      agreedSalary: initialData?.agreedSalary || 0,
      agreedFeeRate: initialData?.agreedFeeRate || 10,
    },
  });

  const agreedSalary = watch('agreedSalary');
  const agreedFeeRate = watch('agreedFeeRate');
  const estimatedFee = (agreedSalary * agreedFeeRate) / 100;

  const handleFormSubmit = async (data: MatchingFormData) => {
    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        await matchingsApi.createMatching(data);
        toast({
          title: '매칭 등록 완료',
          description: '매칭이 성공적으로 등록되었습니다.',
        });
        router.push('/dashboard/matches');
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '매칭 등록 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>매칭 정보</CardTitle>
          <CardDescription>구인 공고와 구직 공고를 매칭합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="jobPostingId">구인 공고 ID *</Label>
            <Input
              id="jobPostingId"
              {...register('jobPostingId', { required: true })}
              placeholder="구인 공고 ID를 입력하세요"
            />
          </div>

          <div>
            <Label htmlFor="jobSeekingId">구직 공고 ID *</Label>
            <Input
              id="jobSeekingId"
              {...register('jobSeekingId', { required: true })}
              placeholder="구직 공고 ID를 입력하세요"
            />
          </div>

          <div>
            <Label htmlFor="notes">메모</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="매칭에 대한 메모를 입력하세요"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>급여 및 수수료</CardTitle>
          <CardDescription>합의된 급여와 수수료율을 설정합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="agreedSalary">합의 급여 *</Label>
              <Input
                id="agreedSalary"
                type="number"
                {...register('agreedSalary', { valueAsNumber: true, required: true })}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="agreedFeeRate">수수료율 (%) *</Label>
              <Input
                id="agreedFeeRate"
                type="number"
                {...register('agreedFeeRate', { valueAsNumber: true, required: true })}
                step="0.1"
                min="0"
                max="100"
              />
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">예상 수수료</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(estimatedFee)}
            </p>
          </div>
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
          {isSubmitting ? '저장 중...' : '매칭 생성'}
        </Button>
      </div>
    </form>
  );
}
