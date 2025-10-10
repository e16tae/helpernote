'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { matchingApi } from '@/lib/matching';
import { jobPostingApi } from '@/lib/job-posting';
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
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft, Calculator } from 'lucide-react';
import { formatCurrency, calculateFeeAmount } from '@/lib/format';
import type { JobPosting, JobSeekingPosting } from '@/types/job-posting';
import apiClient from '@/lib/api';

const matchingSchema = z.object({
  job_posting_id: z.string().min(1, '구인 공고를 선택해주세요'),
  job_seeking_posting_id: z.string().min(1, '구직 공고를 선택해주세요'),
  agreed_salary: z.string().min(1, '합의 급여를 입력해주세요'),
  employer_fee_rate: z.string().min(1, '고용주 수수료율을 입력해주세요'),
  employee_fee_rate: z.string().min(1, '근로자 수수료율을 입력해주세요'),
});

type MatchingFormData = z.infer<typeof matchingSchema>;

interface User {
  id: number;
  default_employer_fee_rate?: string;
  default_employee_fee_rate?: string;
}

export default function NewMatchingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [jobSeekings, setJobSeekings] = useState<JobSeekingPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const form = useForm<MatchingFormData>({
    resolver: zodResolver(matchingSchema),
    defaultValues: {
      job_posting_id: '',
      job_seeking_posting_id: '',
      agreed_salary: '',
      employer_fee_rate: '',
      employee_fee_rate: '',
    },
  });

  const watchedSalary = form.watch('agreed_salary');
  const watchedEmployerRate = form.watch('employer_fee_rate');
  const watchedEmployeeRate = form.watch('employee_fee_rate');
  const watchedJobPostingId = form.watch('job_posting_id');
  const watchedJobSeekingId = form.watch('job_seeking_posting_id');

  // Calculate fee amounts in real-time
  const employerFeeAmount = useMemo(() => {
    if (!watchedSalary || !watchedEmployerRate) return 0;
    return calculateFeeAmount(watchedSalary, watchedEmployerRate);
  }, [watchedSalary, watchedEmployerRate]);

  const employeeFeeAmount = useMemo(() => {
    if (!watchedSalary || !watchedEmployeeRate) return 0;
    return calculateFeeAmount(watchedSalary, watchedEmployeeRate);
  }, [watchedSalary, watchedEmployeeRate]);

  const totalCommission = useMemo(() => {
    return employerFeeAmount + employeeFeeAmount;
  }, [employerFeeAmount, employeeFeeAmount]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load current user info for default rates
        const userResponse = await apiClient.get('/api/profile');
        setCurrentUser(userResponse.data.user);

        // Load job postings (only published and in_progress)
        const jobPostingsResponse = await jobPostingApi.listJobPostings({
          status: 'published',
          limit: 100,
        });
        setJobPostings(jobPostingsResponse.job_postings);

        // Load job seeking postings (only published and in_progress)
        const jobSeekingsResponse = await jobPostingApi.listJobSeekings({
          status: 'published',
          limit: 100,
        });
        setJobSeekings(jobSeekingsResponse.job_seekings);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast({
          title: '오류',
          description: '데이터를 불러오는데 실패했습니다.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [toast]);

  // Auto-populate rates when job posting is selected
  useEffect(() => {
    if (!watchedJobPostingId || !currentUser) return;

    const selectedPosting = jobPostings.find(p => p.id.toString() === watchedJobPostingId);
    if (selectedPosting) {
      // Set agreed salary to job posting salary by default
      if (!watchedSalary) {
        form.setValue('agreed_salary', selectedPosting.salary);
      }

      // Set employer fee rate (use posting's rate if set, otherwise user's default)
      const employerRate = selectedPosting.employer_fee_rate || currentUser.default_employer_fee_rate || '10';
      form.setValue('employer_fee_rate', employerRate);
    }
  }, [watchedJobPostingId, jobPostings, currentUser, form]);

  // Auto-populate employee rate when job seeking is selected
  useEffect(() => {
    if (!watchedJobSeekingId || !currentUser) return;

    const selectedSeeking = jobSeekings.find(s => s.id.toString() === watchedJobSeekingId);
    if (selectedSeeking) {
      // Set employee fee rate (use seeking's rate if set, otherwise user's default)
      const employeeRate = selectedSeeking.employee_fee_rate || currentUser.default_employee_fee_rate || '10';
      form.setValue('employee_fee_rate', employeeRate);
    }
  }, [watchedJobSeekingId, jobSeekings, currentUser, form]);

  const onSubmit = async (data: MatchingFormData) => {
    try {
      setIsSubmitting(true);

      await matchingApi.create({
        job_posting_id: parseInt(data.job_posting_id),
        job_seeking_posting_id: parseInt(data.job_seeking_posting_id),
        agreed_salary: data.agreed_salary,
        employer_fee_rate: data.employer_fee_rate,
        employee_fee_rate: data.employee_fee_rate,
      });

      toast({
        title: '성공',
        description: '매칭이 등록되었습니다.',
      });

      router.push('/dashboard/matchings');
    } catch (error) {
      console.error('Failed to create matching:', error);
      toast({
        title: '오류',
        description: '매칭 등록에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/matchings')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          목록으로
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">새 매칭 등록</h1>
        <p className="text-muted-foreground">
          구인-구직 매칭을 생성하고 수수료를 자동 계산합니다
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>매칭 정보</CardTitle>
              <CardDescription>
                구인/구직 공고를 선택하고 급여 정보를 입력하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="job_posting_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>구인 공고 (고용주) *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="구인 공고를 선택하세요" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {jobPostings.length === 0 ? (
                              <SelectItem value="none" disabled>
                                등록된 구인 공고가 없습니다
                              </SelectItem>
                            ) : (
                              jobPostings.map((posting) => (
                                <SelectItem key={posting.id} value={posting.id.toString()}>
                                  #{posting.id} - 급여: {formatCurrency(parseFloat(posting.salary))} - {posting.description.substring(0, 30)}...
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          일자리를 제공하는 고용주의 구인 공고
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="job_seeking_posting_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>구직 공고 (근로자) *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="구직 공고를 선택하세요" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {jobSeekings.length === 0 ? (
                              <SelectItem value="none" disabled>
                                등록된 구직 공고가 없습니다
                              </SelectItem>
                            ) : (
                              jobSeekings.map((seeking) => (
                                <SelectItem key={seeking.id} value={seeking.id.toString()}>
                                  #{seeking.id} - 희망급여: {formatCurrency(parseFloat(seeking.desired_salary))} - {seeking.description.substring(0, 30)}...
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          일자리를 찾는 근로자의 구직 공고
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="agreed_salary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>합의 급여 (원) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="3000000"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          고용주와 근로자가 합의한 최종 급여액
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="employer_fee_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>고용주 수수료율 (%) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="10"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          고용주에게 청구할 수수료 비율 (구인 공고에서 자동 설정)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="employee_fee_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>근로자 수수료율 (%) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="10"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          근로자에게 청구할 수수료 비율 (구직 공고에서 자동 설정)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/dashboard/matchings')}
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

        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                수수료 계산
              </CardTitle>
              <CardDescription>
                실시간 자동 계산 결과
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">합의 급여</div>
                <div className="text-2xl font-bold">
                  {watchedSalary ? formatCurrency(parseFloat(watchedSalary)) : '₩0'}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-sm text-muted-foreground mb-1">고용주 수수료</div>
                <div className="text-xl font-semibold text-green-600">
                  {formatCurrency(employerFeeAmount)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {watchedEmployerRate}% 적용
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-sm text-muted-foreground mb-1">근로자 수수료</div>
                <div className="text-xl font-semibold text-green-600">
                  {formatCurrency(employeeFeeAmount)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {watchedEmployeeRate}% 적용
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-sm text-muted-foreground mb-1">총 수수료</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalCommission)}
                </div>
              </div>

              <div className="bg-muted p-3 rounded-md text-xs text-muted-foreground">
                <p className="font-semibold mb-1">계산 방식</p>
                <p>고용주: {watchedSalary || 0} × {watchedEmployerRate || 0}% = {formatCurrency(employerFeeAmount)}</p>
                <p>근로자: {watchedSalary || 0} × {watchedEmployeeRate || 0}% = {formatCurrency(employeeFeeAmount)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
