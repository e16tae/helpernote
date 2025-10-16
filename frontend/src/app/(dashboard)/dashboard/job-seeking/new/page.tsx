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
import { useCreateJobSeeking } from "@/hooks/queries/use-job-seekings";
import { CreateJobSeekingRequest } from "@/types/job-posting";
import { Customer } from "@/types/customer";
import { useToast } from "@/hooks/use-toast";

const formSchema = z
  .object({
    customerId: z.string().min(1, "구직자를 선택하세요."),
    desiredSalary: z
      .string()
      .min(1, "희망 급여를 입력하세요.")
      .refine(
        (value) => {
          const parsed = Number(value);
          return Number.isFinite(parsed) && parsed > 0;
        },
        { message: "0보다 큰 숫자를 입력해야 합니다." }
      ),
    preferredLocation: z.string().min(1, "선호 근무지를 입력하세요."),
    description: z.string().min(1, "공고 설명을 입력하세요."),
    useDefaultFeeRate: z.boolean(),
    employeeFeeRate: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.useDefaultFeeRate) {
      if (!data.employeeFeeRate || data.employeeFeeRate.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "수수료율을 입력하세요.",
          path: ["employeeFeeRate"],
        });
        return;
      }

      const parsed = Number(data.employeeFeeRate);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "0 이상 100 이하의 숫자를 입력하세요.",
          path: ["employeeFeeRate"],
        });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

type CustomerState = {
  data: Customer[];
  loading: boolean;
  error: string | null;
};

export default function NewJobSeekingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [state, setState] = useState<CustomerState>({
    data: [],
    loading: true,
    error: null,
  });
  const createJobSeeking = useCreateJobSeeking();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: "",
      desiredSalary: "",
      preferredLocation: "",
      description: "",
      useDefaultFeeRate: true,
      employeeFeeRate: "",
    },
  });

  const useDefaultFeeRate = form.watch("useDefaultFeeRate");

  const fetchCustomers = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const allCustomers = await customerApi.getAll();
      const employees = allCustomers.filter(
        (customer) =>
          customer.customer_type === "Employee" ||
          customer.customer_type === "Both"
      );
      setState({ data: employees, loading: false, error: null });
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

  useEffect(() => {
    if (!state.loading && state.data.length > 0) {
      const current = form.getValues("customerId");
      if (!current) {
        form.setValue("customerId", state.data[0].id.toString(), {
          shouldDirty: false,
        });
      }
    }
  }, [state, form]);

  const isSubmitting =
    form.formState.isSubmitting || createJobSeeking.isPending || state.loading;

  const onSubmit = async (values: FormValues) => {
    try {
      const employeeFee =
        values.useDefaultFeeRate || !values.employeeFeeRate
          ? null
          : Number(values.employeeFeeRate);

      const payload: CreateJobSeekingRequest = {
        customer_id: Number(values.customerId),
        desired_salary: Number(values.desiredSalary),
        description: values.description,
        preferred_location: values.preferredLocation,
        employee_fee_rate: employeeFee,
      };

      const created = await createJobSeeking.mutateAsync(payload);
      toast({ title: "성공", description: "구직 공고가 생성되었습니다." });
      router.push(`/dashboard/job-seeking/${created.id}`);
    } catch (error) {
      console.error("Failed to create job seeking posting:", error);
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
          <Link href="/dashboard/job-seeking">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">새 구직 공고</h1>
          <p className="text-muted-foreground">새로운 구직 공고를 등록합니다</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>
                구직 공고의 기본 정보를 입력하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {state.error && (
                <Alert variant="destructive">
                  <AlertTitle>고객 정보를 불러오지 못했습니다</AlertTitle>
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>구직자 *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={state.loading || state.data.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              state.loading
                                ? "불러오는 중..."
                                : "구직자를 선택하세요"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {state.data.length > 0 ? (
                          state.data.map((customer) => (
                            <SelectItem
                              key={customer.id}
                              value={customer.id.toString()}
                            >
                              {customer.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            등록된 구직자가 없습니다. 먼저 고객을 추가하세요.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {!state.loading && state.data.length === 0 && (
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
                name="desiredSalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>희망 급여 (원) *</FormLabel>
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
                name="preferredLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>선호 근무지 *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="서울 강남/서초"
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
                        placeholder="구직 공고 내용을 입력하세요"
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
                  name="employeeFeeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>구직자 수수료율 (%)</FormLabel>
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
                isSubmitting ||
                state.data.length === 0 ||
                !form.getValues("customerId")
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
