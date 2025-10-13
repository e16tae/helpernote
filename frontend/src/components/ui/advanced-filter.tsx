"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface FilterField {
  id: string;
  label: string;
  type: "text" | "select" | "date" | "number";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface FilterValue {
  [key: string]: string | null;
}

interface AdvancedFilterProps {
  fields: FilterField[];
  value: FilterValue;
  onChange: (value: FilterValue) => void;
  onReset?: () => void;
}

export function AdvancedFilter({
  fields,
  value,
  onChange,
  onReset,
}: AdvancedFilterProps) {
  const [open, setOpen] = useState(false);
  const [localValue, setLocalValue] = useState<FilterValue>(value);

  const activeFilterCount = Object.values(value).filter(
    (v) => v !== null && v !== ""
  ).length;

  const handleFieldChange = (fieldId: string, fieldValue: string | null) => {
    setLocalValue((prev) => ({
      ...prev,
      [fieldId]: fieldValue,
    }));
  };

  const handleApply = () => {
    onChange(localValue);
    setOpen(false);
  };

  const handleReset = () => {
    const resetValue = Object.keys(localValue).reduce(
      (acc, key) => ({ ...acc, [key]: null }),
      {}
    );
    setLocalValue(resetValue);
    onChange(resetValue);
    onReset?.();
  };

  const handleRemoveFilter = (fieldId: string) => {
    const newValue = { ...value, [fieldId]: null };
    onChange(newValue);
    setLocalValue(newValue);
  };

  return (
    <div className="space-y-2">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="mr-2 h-4 w-4" />
            고급 필터
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>고급 필터</SheetTitle>
            <SheetDescription>
              원하는 조건을 설정하여 데이터를 필터링하세요.
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-4 py-4">
            {fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>{field.label}</Label>
                {field.type === "text" && (
                  <Input
                    id={field.id}
                    value={localValue[field.id] || ""}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                  />
                )}
                {field.type === "number" && (
                  <Input
                    id={field.id}
                    type="number"
                    value={localValue[field.id] || ""}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                  />
                )}
                {field.type === "date" && (
                  <Input
                    id={field.id}
                    type="date"
                    value={localValue[field.id] || ""}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  />
                )}
                {field.type === "select" && field.options && (
                  <Select
                    value={localValue[field.id] || ""}
                    onValueChange={(v) => handleFieldChange(field.id, v)}
                  >
                    <SelectTrigger id={field.id}>
                      <SelectValue placeholder={field.placeholder || "선택하세요"} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>

          <SheetFooter className="gap-2">
            <Button variant="outline" onClick={handleReset}>
              초기화
            </Button>
            <SheetClose asChild>
              <Button onClick={handleApply}>적용</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {fields.map((field) => {
            const fieldValue = value[field.id];
            if (!fieldValue) return null;

            let displayValue = fieldValue;
            if (field.type === "select" && field.options) {
              const option = field.options.find((o) => o.value === fieldValue);
              displayValue = option?.label || fieldValue;
            }

            return (
              <Badge key={field.id} variant="secondary" className="gap-1">
                <span className="text-xs">
                  {field.label}: {displayValue}
                </span>
                <button
                  onClick={() => handleRemoveFilter(field.id)}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  aria-label={`${field.label} 필터 제거`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
