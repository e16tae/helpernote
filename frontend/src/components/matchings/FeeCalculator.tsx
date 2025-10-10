'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FeeCalculatorProps {
  baseSalary: number;
  feeRate: number;
  workDays?: number;
  onChange?: (calculatedFee: number) => void;
}

export function FeeCalculator({ baseSalary, feeRate, workDays = 1, onChange }: FeeCalculatorProps) {
  const [days, setDays] = useState(workDays);

  const totalSalary = baseSalary * days;
  const calculatedFee = (totalSalary * feeRate) / 100;
  const netAmount = totalSalary - calculatedFee;

  useEffect(() => {
    if (onChange) {
      onChange(calculatedFee);
    }
  }, [calculatedFee, onChange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>수수료 계산</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="workDays">근무 일수</Label>
            <Input
              id="workDays"
              type="number"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              min="1"
            />
          </div>
          <div>
            <Label>일당</Label>
            <p className="text-2xl font-bold mt-2">{formatCurrency(baseSalary)}</p>
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between">
            <span className="text-muted-foreground">총 급여</span>
            <span className="font-medium">{formatCurrency(totalSalary)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">수수료율</span>
            <span className="font-medium">{feeRate}%</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>중개 수수료</span>
            <span className="text-green-600">{formatCurrency(calculatedFee)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>실수령액 (구직자)</span>
            <span>{formatCurrency(netAmount)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
