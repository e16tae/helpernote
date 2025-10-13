"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import type { RegisterRequest, SecurityQuestion } from "@/types/user";
import { Logo } from "@/components/logo";
import { formatPhoneNumber } from "@/lib/utils/phone";

const SECURITY_QUESTIONS: SecurityQuestion[] = [
  { id: 1, question_text: "당신의 출생지는 어디입니까?", created_at: "", updated_at: "" },
  { id: 2, question_text: "당신의 첫 번째 반려동물 이름은?", created_at: "", updated_at: "" },
  { id: 3, question_text: "당신이 다녔던 초등학교 이름은?", created_at: "", updated_at: "" },
];

// Zod 스키마 정의
const registerSchema = z.object({
  username: z
    .string()
    .min(1, "사용자명을 입력하세요")
    .min(3, "사용자명은 최소 3자 이상이어야 합니다")
    .max(50, "사용자명은 최대 50자까지 가능합니다")
    .regex(/^[a-zA-Z0-9_]+$/, "사용자명은 영문, 숫자, 언더스코어만 사용 가능합니다"),
  password: z
    .string()
    .min(1, "비밀번호를 입력하세요")
    .min(8, "비밀번호는 최소 8자 이상이어야 합니다")
    .regex(/[A-Za-z]/, "비밀번호는 최소 1개의 영문자를 포함해야 합니다")
    .regex(/[0-9]/, "비밀번호는 최소 1개의 숫자를 포함해야 합니다"),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9-]+$/.test(val), {
      message: "올바른 전화번호 형식이 아닙니다",
    }),
  security_question_id: z
    .number()
    .min(1, "보안 질문을 선택하세요"),
  security_answer: z
    .string()
    .min(1, "보안 질문 답변을 입력하세요")
    .min(2, "답변은 최소 2자 이상이어야 합니다"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      phone: "",
      security_question_id: 0,
      security_answer: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const payload: RegisterRequest = {
        username: data.username,
        password: data.password,
        security_question_id: data.security_question_id,
        security_answer: data.security_answer,
        phone: data.phone || undefined,
      };

      await apiClient.post("/api/auth/register", payload);
      toast({
        title: "성공",
        description: "회원가입이 완료되었습니다!",
      });
      router.push("/login");
    } catch (err: any) {
      console.error("Registration failed:", err);
      const errorMessage = getErrorMessage(err);
      setError("root", {
        type: "manual",
        message: errorMessage,
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">회원가입</CardTitle>
          <CardDescription className="text-center">
            새 계정을 생성하여 시작하세요
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {errors.root && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {errors.root.message}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">사용자명 *</Label>
              <Input
                id="username"
                type="text"
                placeholder="사용자명을 입력하세요"
                {...register("username")}
                aria-invalid={errors.username ? "true" : "false"}
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호 *</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요 (최소 8자)"
                {...register("password")}
                aria-invalid={errors.password ? "true" : "false"}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                영문, 숫자를 포함하여 8자 이상 입력하세요
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">연락처</Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="010-1234-5678"
                    value={field.value}
                    onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))}
                    aria-invalid={errors.phone ? "true" : "false"}
                  />
                )}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="security_question_id">보안 질문 *</Label>
              <Controller
                name="security_question_id"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value.toString()}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <SelectTrigger id="security_question_id">
                      <SelectValue placeholder="보안 질문을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECURITY_QUESTIONS.map((q) => (
                        <SelectItem key={q.id} value={q.id.toString()}>
                          {q.question_text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.security_question_id && (
                <p className="text-sm text-destructive">{errors.security_question_id.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="security_answer">보안 질문 답변 *</Label>
              <Input
                id="security_answer"
                type="text"
                placeholder="답변을 입력하세요"
                {...register("security_answer")}
                aria-invalid={errors.security_answer ? "true" : "false"}
              />
              {errors.security_answer && (
                <p className="text-sm text-destructive">{errors.security_answer.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                비밀번호 복구 시 사용됩니다.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "계정 생성 중..." : "회원가입"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="text-primary hover:underline">
                로그인
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
