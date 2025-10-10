'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { jobSeekingsApi } from '@/lib/api/job-seekings';
import { useToast } from '@/components/ui/use-toast';
import type { JobSeekingFormData } from '@/types/job-posting';

interface JobSeekingFormProps {
  initialData?: Partial<JobSeekingFormData>;
  onSubmit?: (data: JobSeekingFormData) => Promise<void>;
}

export function JobSeekingForm({ initialData, onSubmit }: JobSeekingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<JobSeekingFormData>({
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      seekerName: initialData?.seekerName || '',
      seekerPhone: initialData?.seekerPhone || '',
      seekerEmail: initialData?.seekerEmail || '',
      age: initialData?.age || 20,
      gender: initialData?.gender || 'male',
      expectedSalary: initialData?.expectedSalary || 0,
      salaryType: initialData?.salaryType || 'daily',
      availableStartDate: initialData?.availableStartDate || '',
      experience: initialData?.experience || '',
      preferredLocation: initialData?.preferredLocation || [],
      preferredWorkType: initialData?.preferredWorkType || [],
      skills: initialData?.skills || [],
      certifications: initialData?.certifications || [],
    },
  });

  const handleFormSubmit = async (data: JobSeekingFormData) => {
    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        await jobSeekingsApi.createJobSeeking(data);
        toast({
          title: '구직 공고 등록 완료',
          description: '구직 공고가 성공적으로 등록되었습니다.',
        });
        router.push('/dashboard/job-seekers');
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '구직 공고 등록 중 오류가 발생했습니다.',
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
          <CardTitle>구직자 정보</CardTitle>
          <CardDescription>구직자의 기본 정보를 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">제목 *</Label>
            <Input id="title" {...register('title', { required: true })} />
          </div>

          <div>
            <Label htmlFor="description">상세 설명 *</Label>
            <Textarea id="description" {...register('description', { required: true })} rows={4} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="seekerName">이름 *</Label>
              <Input id="seekerName" {...register('seekerName', { required: true })} />
            </div>
            <div>
              <Label htmlFor="age">나이 *</Label>
              <Input id="age" type="number" {...register('age', { valueAsNumber: true })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="seekerPhone">연락처 *</Label>
              <Input id="seekerPhone" {...register('seekerPhone', { required: true })} />
            </div>
            <div>
              <Label htmlFor="seekerEmail">이메일</Label>
              <Input id="seekerEmail" type="email" {...register('seekerEmail')} />
            </div>
          </div>

          <div>
            <Label htmlFor="gender">성별 *</Label>
            <Select
              value={watch('gender')}
              onValueChange={(value: any) => setValue('gender', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">남성</SelectItem>
                <SelectItem value="female">여성</SelectItem>
                <SelectItem value="other">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>희망 근무 조건</CardTitle>
          <CardDescription>희망하는 근무 조건을 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expectedSalary">희망 급여 *</Label>
              <Input
                id="expectedSalary"
                type="number"
                {...register('expectedSalary', { valueAsNumber: true })}
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

          <div>
            <Label htmlFor="availableStartDate">근무 가능 시작일 *</Label>
            <Input id="availableStartDate" type="date" {...register('availableStartDate')} />
          </div>

          <div>
            <Label htmlFor="experience">경력 사항</Label>
            <Textarea id="experience" {...register('experience')} rows={3} />
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
