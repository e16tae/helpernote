'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authApi } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
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

const forgotPasswordSchema = z.object({
  username: z.string().min(1, '아이디를 입력해주세요'),
  security_question_id: z.string().min(1, '보안 질문을 선택해주세요'),
  security_answer: z.string().min(1, '보안 답변을 입력해주세요'),
  new_password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .max(100, '비밀번호는 최대 100자까지 가능합니다'),
  confirmPassword: z.string(),
}).refine((data) => data.new_password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

interface SecurityQuestion {
  id: number;
  question_text: string;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [securityQuestions] = useState<SecurityQuestion[]>([
    { id: 1, question_text: '당신의 출생지는 어디입니까?' },
    { id: 2, question_text: '당신의 첫 번째 반려동물 이름은?' },
    { id: 3, question_text: '당신이 다녔던 초등학교 이름은?' },
    { id: 4, question_text: '당신의 어머니 성함은?' },
    { id: 5, question_text: '당신의 첫 직장은 어디입니까?' },
  ]);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      username: '',
      security_question_id: '',
      security_answer: '',
      new_password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      const { confirmPassword, security_question_id, ...rest } = data;
      const resetData = {
        ...rest,
        security_question_id: parseInt(security_question_id),
      };

      await authApi.resetPassword(resetData);
      toast({
        title: '비밀번호 재설정 성공',
        description: '새로운 비밀번호로 로그인해주세요.',
      });
      router.push('/login');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '비밀번호 재설정 실패',
        description:
          error.response?.data?.error ||
          '보안 답변이 일치하지 않거나 오류가 발생했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>비밀번호 재설정</CardTitle>
        <CardDescription>
          보안 질문에 답변하여 비밀번호를 재설정하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>아이디</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="아이디를 입력하세요"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium">보안 질문</h3>
              <FormField
                control={form.control}
                name="security_question_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>보안 질문</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="보안 질문을 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {securityQuestions.map((q) => (
                          <SelectItem key={q.id} value={q.id.toString()}>
                            {q.question_text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="security_answer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>보안 답변</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="답변을 입력하세요"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium">새 비밀번호</h3>
              <FormField
                control={form.control}
                name="new_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>새 비밀번호</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="새 비밀번호를 입력하세요"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>비밀번호 확인</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="비밀번호를 다시 입력하세요"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '재설정 중...' : '비밀번호 재설정'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-sm text-muted-foreground text-center">
          비밀번호가 기억나셨나요?{' '}
          <Link href="/login" className="text-primary hover:underline">
            로그인
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
