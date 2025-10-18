"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, UserPlus } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getErrorMessage } from "@/lib/api-client";
import { customerApi } from "@/lib/customer";
import { useCreateJobPosting } from "@/hooks/queries/use-job-postings";
import { CreateJobPostingRequest } from "@/types/job-posting";
import { Customer } from "@/types/customer";
import { useToast } from "@/hooks/use-toast";

const formSchema = z
  .object({
    customerId: z.string().min(1, "구인자를 선택하세요."),
    salary: z
      .string()
      .min(1, "제시 급여를 입력하세요.")
      .refine(
        (value) => {
          const parsed = Number(value);
          return Number.isFinite(parsed) && parsed > 0;
        },
        { message: "0보다 큰 숫자를 입력해야 합니다." }
      ),
    description: z.string().min(1, "공고 설명을 입력하세요."),
    useDefaultFeeRate: z.boolean(),
    employerFeeRate: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.useDefaultFeeRate) {
      if (!data.employerFeeRate || data.employerFeeRate.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "수수료율을 입력하세요.",
          path: ["employerFeeRate"],
        });
        return;
      }

      const parsed = Number(data.employerFeeRate);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "0 이상 100 이하의 숫자를 입력하세요.",
          path: ["employerFeeRate"],
        });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

export default function NewJobPostingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [customers, customersLoading, customersError] = useCustomerOptions();
  const createMutation = useCreateJobPosting();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: "",
      salary: "",
      description: "",
      useDefaultFeeRate: true,
      employerFeeRate: "",
    },
  });

  const useDefaultFeeRate = form.watch("useDefaultFeeRate");

  useEffect(() => {
    if (!customersLoading && customers.length > 0) {
      const current = form.getValues("customerId");
      if (!current) {
        form.setValue("customerId", customers[0].id.toString(), {
          shouldDirty: false,
        });
      }
    }
  }, [customers, customersLoading, form]);

  const isSubmitting =
    form.formState.isSubmitting || createMutation.isPending || customersLoading;

  const onSubmit = async (values: FormValues) => {
    try {
      const employerFee =
        values.useDefaultFeeRate || !values.employerFeeRate
          ? null
          : Number(values.employerFeeRate);

      const payload: CreateJobPostingRequest = {
        customer_id: Number(values.customerId),
        salary: Number(values.salary),
        description: values.description,
        employer_fee_rate: employerFee,
      };

      const created = await createMutation.mutateAsync(payload);
      toast({ title: "성공", description: "구인 공고가 생성되었습니다." });
      router.push(`/dashboard/job-postings/${created.id}`);
    } catch (error) {
      console.error("Failed to create job posting:", error);
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
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/job-postings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">새 구인 공고</h1>
          <p className="text-muted-foreground">새로운 구인 공고를 등록합니다</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>
                구인 공고의 기본 정보를 입력하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {customersError && (
                <Alert variant="destructive">
                  <AlertTitle>고객 정보를 불러오지 못했습니다</AlertTitle>
                  <AlertDescription>{customersError}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>구인자 *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={customersLoading || customers.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              customersLoading
                                ? "불러오는 중..."
                                : "구인자를 선택하세요"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.length > 0 ? (
                          customers.map((customer) => (
                            <SelectItem
                              key={customer.id}
                              value={customer.id.toString()}
                            >
                              {customer.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            등록된 구인자가 없습니다. 먼저 고객을 추가하세요.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {!customersLoading && customers.length === 0 && (
                      <Button
                        type="button"
                        variant="link"
                        className="px-0 text-primary"
                        onClick={() => router.push("/dashboard/customers/new")}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        새 고객 등록하러 가기
                      </Button>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>제시 급여 (원) *</FormLabel>
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

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>공고 설명 *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="구인 공고 내용을 입력하세요"
                        rows={6}
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
              <CardTitle>수수료 정보</CardTitle>
              <CardDescription>수수료율 정보를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="useDefaultFeeRate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(!!checked)}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      기본 수수료율 사용
                    </FormLabel>
                  </FormItem>
                )}
              />

              {!useDefaultFeeRate && (
                <FormField
                  control={form.control}
                  name="employerFeeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>구인자 수수료율 (%)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          inputMode="decimal"
                          placeholder="10.0"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              취소
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting || customers.length === 0 || !form.getValues("customerId")
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              {isSubmitting ? "생성 중..." : "생성"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

type CustomerState = {
  data: Customer[];
  loading: boolean;
  error: string | null;
};

function useCustomerOptions(): [Customer[], boolean, string | null] {
  const { toast } = useToast();
  const [state, setState] = useState<CustomerState>({
    data: [],
    loading: true,
    error: null,
  });

  const fetchCustomers = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const allCustomers = await customerApi.getAll();
      const employers = allCustomers.filter(
        (customer) =>
          customer.customer_type === "Employer" ||
          customer.customer_type === "Both"
      );
      setState({ data: employers, loading: false, error: null });
    } catch (error) {
      const message = getErrorMessage(error);
      toast({
        variant: "destructive",
        title: "고객 목록을 가져오지 못했습니다",
        description: message,
      });
      setState({ data: [], loading: false, error: message });
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return [state.data, state.loading, state.error];
}
