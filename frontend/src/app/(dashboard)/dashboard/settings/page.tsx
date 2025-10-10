'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, User, DollarSign, Phone } from 'lucide-react';
import apiClient from '@/lib/api';

interface UserProfile {
  id: number;
  username: string;
  phone: string | null;
  default_employer_fee_rate: string;
  default_employee_fee_rate: string;
  created_at: string;
}

const settingsSchema = z.object({
  phone: z.string()
    .regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)')
    .optional()
    .or(z.literal('')),
  default_employer_fee_rate: z.string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, '수수료율은 0 이상이어야 합니다')
    .refine((val) => Number(val) <= 100, '수수료율은 100 이하여야 합니다'),
  default_employee_fee_rate: z.string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, '수수료율은 0 이상이어야 합니다')
    .refine((val) => Number(val) <= 100, '수수료율은 100 이하여야 합니다'),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      phone: '',
      default_employer_fee_rate: '0',
      default_employee_fee_rate: '0',
    },
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/profile');
      const userProfile = response.data.user;
      setProfile(userProfile);

      // Update form with profile data
      form.reset({
        phone: userProfile.phone || '',
        default_employer_fee_rate: userProfile.default_employer_fee_rate,
        default_employee_fee_rate: userProfile.default_employee_fee_rate,
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast({
        title: '오류',
        description: '프로필을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SettingsFormData) => {
    try {
      setIsSubmitting(true);

      const updateData: {
        phone?: string | null;
        default_employer_fee_rate?: number;
        default_employee_fee_rate?: number;
      } = {};

      // Only include fields that have changed
      if (data.phone !== profile?.phone) {
        updateData.phone = data.phone || null;
      }

      if (data.default_employer_fee_rate !== profile?.default_employer_fee_rate) {
        updateData.default_employer_fee_rate = parseFloat(data.default_employer_fee_rate);
      }

      if (data.default_employee_fee_rate !== profile?.default_employee_fee_rate) {
        updateData.default_employee_fee_rate = parseFloat(data.default_employee_fee_rate);
      }

      await apiClient.put('/api/profile', updateData);

      toast({
        title: '성공',
        description: '설정이 저장되었습니다.',
      });

      // Reload profile to get updated data
      await loadProfile();
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast({
        title: '오류',
        description: '설정 저장에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">프로필을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">계정 설정</h1>
        <p className="text-muted-foreground">
          프로필 정보와 기본 수수료율을 관리합니다
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Information */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              계정 정보
            </CardTitle>
            <CardDescription>
              로그인 정보 및 계정 생성일
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">사용자 이름</p>
              <p className="text-sm text-muted-foreground">{profile.username}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium">계정 ID</p>
              <p className="text-sm text-muted-foreground">{profile.id}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium">가입일</p>
              <p className="text-sm text-muted-foreground">
                {new Date(profile.created_at).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings Form */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>프로필 설정</CardTitle>
            <CardDescription>
              연락처 정보를 수정합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        전화번호
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="010-1234-5678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      '저장'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Fee Settings */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            기본 수수료율 설정
          </CardTitle>
          <CardDescription>
            새로운 공고를 생성할 때 기본으로 적용될 수수료율을 설정합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="default_employer_fee_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>구인자 기본 수수료율 (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="10.00" {...field} />
                      </FormControl>
                      <FormDescription>
                        구인 공고를 생성할 때 기본으로 적용될 수수료율입니다.
                        구인자가 사용자에게 지불합니다.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="default_employee_fee_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>구직자 기본 수수료율 (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="5.00" {...field} />
                      </FormControl>
                      <FormDescription>
                        구직 공고를 생성할 때 기본으로 적용될 수수료율입니다.
                        구직자가 사용자에게 지불합니다.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    '저장'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={isSubmitting}
                >
                  초기화
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                수수료율 안내
              </p>
              <p className="text-sm text-muted-foreground">
                • 기본 수수료율은 새로운 공고를 생성할 때 자동으로 적용됩니다.
              </p>
              <p className="text-sm text-muted-foreground">
                • 개별 공고에서 수수료율을 별도로 설정할 수 있습니다.
              </p>
              <p className="text-sm text-muted-foreground">
                • 수수료율은 0%에서 100% 사이의 값으로 설정할 수 있습니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
