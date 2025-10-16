"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Briefcase, Plus, UserSearch } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getErrorMessage } from "@/lib/api-client";
import { customerApi } from "@/lib/customer";
import { jobPostingApi, jobSeekingApi } from "@/lib/job-posting";
import { matchingApi } from "@/lib/matching";
import { useJobPostings } from "@/hooks/queries/use-job-postings";
import { useJobSeekings } from "@/hooks/queries/use-job-seekings";
import { queryKeys } from "@/lib/query-keys";
import { JobPosting, JobSeekingPosting } from "@/types/job-posting";
import { CreateMatchingRequest } from "@/types/matching";
import { Customer } from "@/types/customer";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  jobPostingId: z.string().min(1, "구인 공고를 선택하세요."),
  jobSeekingId: z.string().min(1, "구직 공고를 선택하세요."),
  agreedSalary: z
    .string()
    .min(1, "합의 급여를 입력하세요.")
    .refine(
      (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0;
      },
      { message: "0보다 큰 숫자를 입력해야 합니다." }
    ),
  employerFeeRate: z
    .string()
    .min(1, "구인자 수수료율을 입력하세요.")
    .refine(
      (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100;
      },
      { message: "0 이상 100 이하의 숫자를 입력하세요." }
    ),
  employeeFeeRate: z
    .string()
    .min(1, "구직자 수수료율을 입력하세요.")
    .refine(
      (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100;
      },
      { message: "0 이상 100 이하의 숫자를 입력하세요." }
    ),
});

type FormValues = z.infer<typeof formSchema>;

type MatchingDataState = {
  customers: Customer[];
  jobPostings: JobPosting[];
  jobSeekings: JobSeekingPosting[];
  loading: boolean;
  error: string | null;
};

export default function NewMatchingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: cachedPostings = [] } = useJobPostings();
  const { data: cachedSeekings = [] } = useJobSeekings();

  const [state, setState] = useState<MatchingDataState>({
    customers: [],
    jobPostings: cachedPostings,
    jobSeekings: cachedSeekings,
    loading: true,
    error: null,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobPostingId: "",
      jobSeekingId: "",
      agreedSalary: "",
      employerFeeRate: "10",
      employeeFeeRate: "5",
    },
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [customersData, jobPostingsData, jobSeekingsData] = await Promise.all([
        customerApi.getAll(),
        jobPostingApi.getAll(),
        jobSeekingApi.getAll(),
      ]);

      setState({
        customers: customersData,
        jobPostings: jobPostingsData.length ? jobPostingsData : cachedPostings,
        jobSeekings: jobSeekingsData.length ? jobSeekingsData : cachedSeekings,
        loading: false,
        error: null,
      });
    } catch (error) {
      const message = getErrorMessage(error);
      toast({
        variant: "destructive",
        title: "매칭 데이터를 불러오지 못했습니다",
        description: message,
      });
      setState({
        customers: [],
        jobPostings: cachedPostings,
        jobSeekings: cachedSeekings,
        loading: false,
        error: message,
      });
    }
  }, [cachedPostings, cachedSeekings, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!state.loading) {
      if (state.jobPostings.length > 0 && !form.getValues("jobPostingId")) {
        form.setValue("jobPostingId", state.jobPostings[0].id.toString(), {
          shouldDirty: false,
        });
      }
      if (state.jobSeekings.length > 0 && !form.getValues("jobSeekingId")) {
        form.setValue("jobSeekingId", state.jobSeekings[0].id.toString(), {
          shouldDirty: false,
        });
      }
    }
  }, [state, form]);

  const createMatching = useMutation({
    mutationFn: (payload: CreateMatchingRequest) => matchingApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matchings.all });
    },
  });

  const isSubmitting =
    form.formState.isSubmitting || createMatching.isPending || state.loading;

  const jobPostingOptions = state.jobPostings;
  const jobSeekingOptions = state.jobSeekings;
  const jobPostingId = form.watch("jobPostingId");
  const jobSeekingId = form.watch("jobSeekingId");
  const selectedPosting = jobPostingOptions.find(
    (posting) => posting.id.toString() === jobPostingId
  );
  const selectedSeeking = jobSeekingOptions.find(
    (seeking) => seeking.id.toString() === jobSeekingId
  );

  const agreedSalaryValue = Number(form.watch("agreedSalary") || 0);
  const employerRateValue = Number(form.watch("employerFeeRate") || 0);
  const employeeRateValue = Number(form.watch("employeeFeeRate") || 0);
  const employerFee = (agreedSalaryValue * employerRateValue) / 100;
  const employeeFee = (agreedSalaryValue * employeeRateValue) / 100;
  const totalFee = employerFee + employeeFee;

  const getCustomerName = (customerId: number) => {
    const customer = state.customers.find((item) => item.id === customerId);
    return customer ? customer.name : "알 수 없음";
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const payload: CreateMatchingRequest = {
        job_posting_id: Number(values.jobPostingId),
        job_seeking_posting_id: Number(values.jobSeekingId),
        agreed_salary: Number(values.agreedSalary),
        employer_fee_rate: Number(values.employerFeeRate),
        employee_fee_rate: Number(values.employeeFeeRate),
      };

      const created = await createMatching.mutateAsync(payload);
      toast({ title: "성공", description: "매칭이 생성되었습니다." });
      router.push(`/dashboard/matchings/${created.id}`);
    } catch (error) {
      console.error("Failed to create matching:", error);
      toast({
        variant: "destructive",
        title: "오류",
        description: getErrorMessage(error),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/matchings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            취소
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">새 매칭 등록</h1>
          <p className="text-muted-foreground">
            구인 공고와 구직 공고를 매칭합니다
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>
                구인 공고와 구직 공고를 선택합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {state.error && (
                <Alert variant="destructive">
                  <AlertTitle>데이터를 불러오지 못했습니다</AlertTitle>
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="jobPostingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      구인 공고 <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={state.loading || jobPostingOptions.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              state.loading
                                ? "불러오는 중..."
                                : "구인 공고를 선택하세요"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {jobPostingOptions.length > 0 ? (
                          jobPostingOptions.map((posting) => (
                            <SelectItem
                              key={posting.id}
                              value={posting.id.toString()}
                            >
                              #{posting.id} - {getCustomerName(posting.customer_id)} (
                              {formatCurrency(posting.salary)})
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            등록된 구인 공고가 없습니다.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {!state.loading && jobPostingOptions.length === 0 && (
                      <Button
                        type="button"
                        variant="link"
                        className="px-0 text-primary"
                        onClick={() => router.push("/dashboard/job-postings/new")}
                      >
                        <Briefcase className="mr-2 h-4 w-4" />
                        새 구인 공고 만들기
                      </Button>
                    )}
                    {selectedPosting && (
                      <p className="text-sm text-muted-foreground">
                        구인자: {getCustomerName(selectedPosting.customer_id)} | 제시 급여:{" "}
                        {formatCurrency(selectedPosting.salary)}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobSeekingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      구직 공고 <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={state.loading || jobSeekingOptions.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              state.loading
                                ? "불러오는 중..."
                                : "구직 공고를 선택하세요"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {jobSeekingOptions.length > 0 ? (
                          jobSeekingOptions.map((seeking) => (
                            <SelectItem
                              key={seeking.id}
                              value={seeking.id.toString()}
                            >
                              #{seeking.id} - {getCustomerName(seeking.customer_id)} (
                              {formatCurrency(seeking.desired_salary)})
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            등록된 구직 공고가 없습니다.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {!state.loading && jobSeekingOptions.length === 0 && (
                      <Button
                        type="button"
                        variant="link"
                        className="px-0 text-primary"
                        onClick={() => router.push("/dashboard/job-seeking/new")}
                      >
                        <UserSearch className="mr-2 h-4 w-4" />
                        새 구직 공고 만들기
                      </Button>
                    )}
                    {selectedSeeking && (
                      <p className="text-sm text-muted-foreground">
                        구직자: {getCustomerName(selectedSeeking.customer_id)} | 희망 급여:{" "}
                        {formatCurrency(selectedSeeking.desired_salary)} | 선호 지역:{" "}
                        {selectedSeeking.preferred_location}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>급여 정보</CardTitle>
              <CardDescription>합의된 급여를 입력합니다</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="agreedSalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      합의 급여 (원/월) <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        inputMode="numeric"
                        placeholder="3500000"
                        min="0"
                        step="10000"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>수수료 설정</CardTitle>
              <CardDescription>
                구인자 및 구직자 수수료율을 설정합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="employerFeeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        구인자 수수료율 (%) <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          inputMode="decimal"
                          placeholder="10"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">
                        예상 수수료: {formatCurrency(employerFee)}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employeeFeeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        구직자 수수료율 (%) <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          inputMode="decimal"
                          placeholder="5"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">
                        예상 수수료: {formatCurrency(employeeFee)}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {agreedSalaryValue > 0 && (
                <div className="rounded-lg bg-muted p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">총 예상 수수료</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(totalFee)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Link href="/dashboard/matchings">
              <Button type="button" variant="outline">
                취소
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                jobPostingOptions.length === 0 ||
                jobSeekingOptions.length === 0
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              {isSubmitting ? "생성 중..." : "매칭 등록"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(amount || 0);
}
