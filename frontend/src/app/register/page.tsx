"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import type { RegisterRequest, SecurityQuestion } from "@/types/user";
import { Logo } from "@/components/logo";

const SECURITY_QUESTIONS: SecurityQuestion[] = [
  { id: 1, question_text: "당신의 출생지는 어디입니까?", created_at: "", updated_at: "" },
  { id: 2, question_text: "당신의 첫 번째 반려동물 이름은?", created_at: "", updated_at: "" },
  { id: 3, question_text: "당신이 다녔던 초등학교 이름은?", created_at: "", updated_at: "" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    security_question_id: 0,
    security_answer: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSecurityQuestionChange = (value: string) => {
    setFormData({
      ...formData,
      security_question_id: parseInt(value),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.security_question_id === 0) {
      setError("보안 질문을 선택해주세요.");
      return;
    }

    setLoading(true);

    try {
      const payload: RegisterRequest = {
        username: formData.username,
        password: formData.password,
        security_question_id: formData.security_question_id,
        security_answer: formData.security_answer,
        phone: formData.phone || undefined,
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
      setError(errorMessage);
    } finally {
      setLoading(false);
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
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">사용자명 *</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="사용자명을 입력하세요"
                value={formData.username}
                onChange={handleChange}
                required
                minLength={3}
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호 *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="비밀번호를 입력하세요 (최소 8자)"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">연락처</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="010-1234-5678"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="security_question_id">보안 질문 *</Label>
              <Select
                value={formData.security_question_id.toString()}
                onValueChange={handleSecurityQuestionChange}
                required
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="security_answer">보안 질문 답변 *</Label>
              <Input
                id="security_answer"
                name="security_answer"
                type="text"
                placeholder="답변을 입력하세요"
                value={formData.security_answer}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                비밀번호 복구 시 사용됩니다.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "계정 생성 중..." : "회원가입"}
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
