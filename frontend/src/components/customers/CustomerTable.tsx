'use client';

import { Customer, CustomerType } from '@/types/customer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface CustomerTableProps {
  customers: Customer[];
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

const customerTypeLabels: Record<CustomerType, string> = {
  [CustomerType.EMPLOYER]: '고용주',
  [CustomerType.EMPLOYEE]: '근로자',
  [CustomerType.BOTH]: '고용주 + 근로자',
};

const customerTypeVariants: Record<CustomerType, 'default' | 'secondary' | 'outline'> = {
  [CustomerType.EMPLOYER]: 'default',
  [CustomerType.EMPLOYEE]: 'secondary',
  [CustomerType.BOTH]: 'outline',
};

export function CustomerTable({ customers, onView, onEdit, onDelete }: CustomerTableProps) {
  if (customers.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">등록된 고객이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>이름</TableHead>
            <TableHead>전화번호</TableHead>
            <TableHead>유형</TableHead>
            <TableHead>주소</TableHead>
            <TableHead>등록일</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">{customer.name}</TableCell>
              <TableCell>{customer.phoneNumber}</TableCell>
              <TableCell>
                <Badge variant={customerTypeVariants[customer.customerType]}>
                  {customerTypeLabels[customer.customerType]}
                </Badge>
              </TableCell>
              <TableCell>
                {customer.address || '-'}
              </TableCell>
              <TableCell>
                {format(new Date(customer.createdAt), 'yyyy-MM-dd', { locale: ko })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">메뉴 열기</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(customer)}>
                      <Eye className="mr-2 h-4 w-4" />
                      상세보기
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(customer)}>
                      <Edit className="mr-2 h-4 w-4" />
                      수정
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(customer)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
