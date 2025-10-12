"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { Save, User as UserIcon, DollarSign, Palette } from "lucide-react";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { User, UpdateUserProfileRequest } from "@/types/user";
import { useToast } from "@/hooks/use-toast";
import { toNumber } from "@/lib/utils/currency";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(theme === "dark");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Profile form state
  const [phone, setPhone] = useState("");
  const [defaultEmployerFeeRate, setDefaultEmployerFeeRate] = useState("");
  const [defaultEmployeeFeeRate, setDefaultEmployeeFeeRate] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get("/api/profile");
      const userData = response.data.user;
      setUser(userData);

      // Set form data
      setPhone(userData.phone || "");
      setDefaultEmployerFeeRate(userData.default_employer_fee_rate);
      setDefaultEmployeeFeeRate(userData.default_employee_fee_rate);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      const errorMessage = getErrorMessage(error);
      toast({
        variant: "destructive",
        title: "오류",
        description: errorMessage,
      });
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: UpdateUserProfileRequest = {
        phone: phone || null,
        default_employer_fee_rate: parseFloat(defaultEmployerFeeRate),
        default_employee_fee_rate: parseFloat(defaultEmployeeFeeRate),
      };

      const response = await apiClient.put("/api/profile", payload);
      const updatedUser = response.data.user;
      setUser(updatedUser);

      toast({
        title: "성공",
        description: "프로필이 업데이트되었습니다.",
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      const errorMessage = getErrorMessage(error);
      toast({
        variant: "destructive",
        title: "오류",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleThemeToggle = (checked: boolean) => {
    setIsDarkMode(checked);
    setTheme(checked ? "dark" : "light");
  };

  const calculateFeeAmount = (salary: number, rate: number) => {
    return (salary * rate) / 100;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const employerFee = calculateFeeAmount(5000000, toNumber(defaultEmployerFeeRate));
  const employeeFee = calculateFeeAmount(5000000, toNumber(defaultEmployeeFeeRate));
  const totalFee = employerFee + employeeFee;

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-32 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>

        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-32" />
          ))}
        </div>

        <div className="grid gap-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-96" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end">
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">설정</h1>
        <p className="text-muted-foreground">
          계정 정보 및 기본 설정을 관리합니다
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">프로필</TabsTrigger>
          <TabsTrigger value="appearance">테마</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-blue-500" />
                  <CardTitle>프로필 정보</CardTitle>
                </div>
                <CardDescription>
                  계정의 기본 정보를 관리합니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">사용자명</Label>
                  <Input
                    id="username"
                    value={user.username}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    사용자명은 변경할 수 없습니다
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">연락처</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010-1234-5678"
                  />
                </div>

                <div className="space-y-2">
                  <Label>계정 생성일</Label>
                  <Input
                    value={new Date(user.created_at).toLocaleString("ko-KR")}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <CardTitle>기본 수수료율 설정</CardTitle>
                </div>
                <CardDescription>
                  새로운 매칭에 적용될 기본 수수료율을 설정합니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="default_employer_fee_rate">
                      구인자 기본 수수료율 (%) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="default_employer_fee_rate"
                      type="number"
                      step="0.1"
                      value={defaultEmployerFeeRate}
                      onChange={(e) => setDefaultEmployerFeeRate(e.target.value)}
                      required
                      min="0"
                      max="100"
                    />
                    <p className="text-xs text-muted-foreground">
                      구인자에게 부과되는 기본 수수료율입니다
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="default_employee_fee_rate">
                      구직자 기본 수수료율 (%) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="default_employee_fee_rate"
                      type="number"
                      step="0.1"
                      value={defaultEmployeeFeeRate}
                      onChange={(e) => setDefaultEmployeeFeeRate(e.target.value)}
                      required
                      min="0"
                      max="100"
                    />
                    <p className="text-xs text-muted-foreground">
                      구직자에게 부과되는 기본 수수료율입니다
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <h4 className="text-sm font-medium mb-2">예시 계산 (급여 5,000,000원 기준)</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex justify-between">
                      <span>구인자 수수료:</span>
                      <span className="font-medium">{formatCurrency(employerFee)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>구직자 수수료:</span>
                      <span className="font-medium">{formatCurrency(employeeFee)}</span>
                    </li>
                    <li className="flex justify-between border-t pt-1 mt-1">
                      <span className="font-medium">총 수수료:</span>
                      <span className="font-bold text-primary">{formatCurrency(totalFee)}</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-purple-500" />
                <CardTitle>테마 설정</CardTitle>
              </div>
              <CardDescription>
                애플리케이션의 외관을 설정합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark-mode">다크 모드</Label>
                    <p className="text-sm text-muted-foreground">
                      어두운 배경색을 사용합니다
                    </p>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={isDarkMode}
                    onCheckedChange={handleThemeToggle}
                  />
                </div>

                <div className="rounded-lg border p-4">
                  <h4 className="text-sm font-medium mb-4">미리보기</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded bg-primary" />
                      <span className="text-sm">Primary</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded bg-secondary" />
                      <span className="text-sm">Secondary</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded bg-muted" />
                      <span className="text-sm">Muted</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded bg-accent" />
                      <span className="text-sm">Accent</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
