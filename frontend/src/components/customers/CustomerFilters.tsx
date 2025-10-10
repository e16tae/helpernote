'use client';

import { CustomerType, CUSTOMER_TYPES, CUSTOMER_TYPE_LABELS } from '@/types/customer';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

interface CustomerFiltersProps {
  search: string;
  onSearchChange: (search: string) => void;
  customerType?: CustomerType | 'ALL';
  onCustomerTypeChange: (type: CustomerType | 'ALL') => void;
}

const customerTypeLabels: Record<CustomerType | 'ALL', string> = {
  ALL: '전체',
  ...CUSTOMER_TYPE_LABELS,
};

export function CustomerFilters({
  search,
  onSearchChange,
  customerType = 'ALL',
  onCustomerTypeChange,
}: CustomerFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="이름 또는 전화번호로 검색..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="w-full sm:w-[200px]">
        <Select
          value={customerType}
          onValueChange={(value) => onCustomerTypeChange(value as CustomerType | 'ALL')}
        >
          <SelectTrigger>
            <SelectValue placeholder="고객 유형" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(customerTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
