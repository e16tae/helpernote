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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { jobPostingsApi } from '@/lib/api/job-postings';
import { useToast } from '@/components/ui/use-toast';
import type { JobPostingFormData } from '@/types/job-posting';

const jobPostingSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  description: z.string().min(10, '상세 설명을 10자 이상 입력해주세요'),
  customerId: z.string().min(1, '고객을 선택해주세요'),
  location: z.string().min(1, '근무지를 입력해주세요'),
  workType: z.enum(['daily', 'weekly', 'monthly', 'long-term']),
  salary: z.number().min(0, '급여는 0 이상이어야 합니다'),
  salaryType: z.enum(['hourly', 'daily', 'monthly']),
  requiredWorkers: z.number().min(1, '필요 인원은 1명 이상이어야 합니다'),
  workStartDate: z.string().min(1, '근무 시작일을 선택해주세요'),
  workEndDate: z.string().optional(),
  workHours: z.string().min(1, '근무 시간을 입력해주세요'),
  feeRate: z.number().min(0).max(100, '수수료율은 0-100 사이여야 합니다'),
});

interface JobPostingFormProps {
  initialData?: Partial<JobPostingFormData>;
  onSubmit?: (data: JobPostingFormData) => Promise<void>;
}

export function JobPostingForm({ initialData, onSubmit }: JobPostingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requirements, setRequirements] = useState<string[]>(initialData?.requirements || []);
  const [benefits, setBenefits] = useState<string[]>(initialData?.benefits || []);
  const [newRequirement, setNewRequirement] = useState('');
  const [newBenefit, setNewBenefit] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<JobPostingFormData>({
    resolver: zodResolver(jobPostingSchema as any),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      customerId: initialData?.customerId || '',
      location: initialData?.location || '',
      workType: initialData?.workType || 'daily',
      salary: initialData?.salary || 0,
      salaryType: initialData?.salaryType || 'daily',
      requiredWorkers: initialData?.requiredWorkers || 1,
      workStartDate: initialData?.workStartDate || '',
      workEndDate: initialData?.workEndDate || '',
      workHours: initialData?.workHours || '',
      feeRate: initialData?.feeRate || 10,
    },
  });

  const salary = watch('salary');
  const feeRate = watch('feeRate');
  const estimatedFee = (salary * feeRate) / 100;

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setRequirements([...requirements, newRequirement.trim()]);
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const addBenefit = () => {
    if (newBenefit.trim()) {
      setBenefits([...benefits, newBenefit.trim()]);
      setNewBenefit('');
    }
  };

  const removeBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (data: JobPostingFormData) => {
    setIsSubmitting(true);
    try {
      const formData = {
        ...data,
        requirements,
        benefits,
      };

      if (onSubmit) {
        await onSubmit(formData);
      } else {
        await jobPostingsApi.createJobPosting(formData);
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
            <Label htmlFor="title">공고 제목 *</Label>
            <Input id="title" {...register('title')} placeholder="예: 건설 현장 일용직 모집" />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
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
            <Label htmlFor="customerId">고객 *</Label>
            <Input id="customerId" {...register('customerId')} placeholder="고객 ID" />
            {errors.customerId && (
              <p className="text-sm text-destructive mt-1">{errors.customerId.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="location">근무지 *</Label>
            <Input id="location" {...register('location')} placeholder="예: 서울시 강남구" />
            {errors.location && (
              <p className="text-sm text-destructive mt-1">{errors.location.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>근무 조건</CardTitle>
          <CardDescription>근무 조건 및 급여 정보를 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="workType">근무 형태 *</Label>
              <Select
                value={watch('workType')}
                onValueChange={(value: any) => setValue('workType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">일용직</SelectItem>
                  <SelectItem value="weekly">주간</SelectItem>
                  <SelectItem value="monthly">월간</SelectItem>
                  <SelectItem value="long-term">장기</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="requiredWorkers">필요 인원 *</Label>
              <Input
                id="requiredWorkers"
                type="number"
                {...register('requiredWorkers', { valueAsNumber: true })}
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="salary">급여 *</Label>
              <Input
                id="salary"
                type="number"
                {...register('salary', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="salaryType">급여 형태 *</Label>
              <Select
                value={watch('salaryType')}
                onValueChange={(value: any) => setValue('salaryType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">시급</SelectItem>
                  <SelectItem value="daily">일급</SelectItem>
                  <SelectItem value="monthly">월급</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="workStartDate">근무 시작일 *</Label>
              <Input id="workStartDate" type="date" {...register('workStartDate')} />
            </div>

            <div>
              <Label htmlFor="workEndDate">근무 종료일</Label>
              <Input id="workEndDate" type="date" {...register('workEndDate')} />
            </div>
          </div>

          <div>
            <Label htmlFor="workHours">근무 시간 *</Label>
            <Input
              id="workHours"
              {...register('workHours')}
              placeholder="예: 09:00 - 18:00"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>수수료 설정</CardTitle>
          <CardDescription>중개 수수료율을 설정하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="feeRate">수수료율 (%) *</Label>
            <Input
              id="feeRate"
              type="number"
              {...register('feeRate', { valueAsNumber: true })}
              min="0"
              max="100"
              step="0.1"
            />
            {errors.feeRate && (
              <p className="text-sm text-destructive mt-1">{errors.feeRate.message}</p>
            )}
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">예상 수수료</p>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('ko-KR', {
                style: 'currency',
                currency: 'KRW',
              }).format(estimatedFee)}
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
          {isSubmitting ? '저장 중...' : '저장'}
        </Button>
      </div>
    </form>
  );
}
