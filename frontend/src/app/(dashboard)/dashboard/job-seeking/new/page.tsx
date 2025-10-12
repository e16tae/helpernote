"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus } from "lucide-react";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { customerApi } from "@/lib/customer";
import { CreateJobSeekingRequest } from "@/types/job-posting";
import { Customer } from "@/types/customer";
import { useToast } from "@/hooks/use-toast";

export default function NewJobSeekingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Form state
  const [customerId, setCustomerId] = useState("");
  const [desiredSalary, setDesiredSalary] = useState("");
  const [description, setDescription] = useState("");
  const [preferredLocation, setPreferredLocation] = useState("");
  const [employeeFeeRate, setEmployeeFeeRate] = useState("");
  const [useDefaultFeeRate, setUseDefaultFeeRate] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const allCustomers = await customerApi.getAll();
      // Filter for employees only
      const employees = allCustomers.filter(
        (c) => c.customer_type === "Employee" || c.customer_type === "Both"
      );
      setCustomers(employees);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: CreateJobSeekingRequest = {
        customer_id: parseInt(customerId),
        desired_salary: parseFloat(desiredSalary),
        description,
        preferred_location: preferredLocation,
        employee_fee_rate: useDefaultFeeRate ? null : parseFloat(employeeFeeRate),
      };

      const response = await apiClient.post("/api/job-seekings", payload);
      router.push(`/dashboard/job-seeking/${response.data.id}`);
    } catch (error) {
      console.error("Failed to create job seeking posting:", error);
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

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>구직 공고의 기본 정보를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer">구직자 *</Label>
                <Select value={customerId} onValueChange={setCustomerId} required>
                  <SelectTrigger id="customer">
                    <SelectValue placeholder="구직자를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="desiredSalary">희망 급여 (원) *</Label>
                <Input
                  id="desiredSalary"
                  type="number"
                  placeholder="3500000"
                  value={desiredSalary}
                  onChange={(e) => setDesiredSalary(e.target.value)}
                  required
                  min="0"
                  step="10000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredLocation">선호 근무지 *</Label>
                <Input
                  id="preferredLocation"
                  type="text"
                  placeholder="서울 강남/서초"
                  value={preferredLocation}
                  onChange={(e) => setPreferredLocation(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">공고 설명 *</Label>
                <Textarea
                  id="description"
                  placeholder="구직 공고 내용을 입력하세요"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>수수료 정보</CardTitle>
              <CardDescription>수수료율 정보를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useDefaultFeeRate"
                  checked={useDefaultFeeRate}
                  onCheckedChange={(checked) => setUseDefaultFeeRate(checked as boolean)}
                />
                <Label htmlFor="useDefaultFeeRate" className="font-normal">
                  기본 수수료율 사용
                </Label>
              </div>

              {!useDefaultFeeRate && (
                <div className="space-y-2">
                  <Label htmlFor="feeRate">구직자 수수료율 (%)</Label>
                  <Input
                    id="feeRate"
                    type="number"
                    placeholder="10.0"
                    value={employeeFeeRate}
                    onChange={(e) => setEmployeeFeeRate(e.target.value)}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              <Plus className="mr-2 h-4 w-4" />
              {loading ? "생성 중..." : "생성"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
