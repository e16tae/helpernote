import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * FormField - Container for form fields with label and error display
 */
interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

export function FormField({
  label,
  error,
  required,
  children,
  className,
  htmlFor,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {children}
      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}

/**
 * FormInput - Input field wrapper with error handling
 */
interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, containerClassName, required, id, ...props }, ref) => {
    return (
      <FormField
        label={label}
        error={error}
        required={required}
        className={containerClassName}
        htmlFor={id}
      >
        <Input
          ref={ref}
          id={id}
          className={cn(error && "border-destructive")}
          {...props}
        />
      </FormField>
    );
  }
);
FormInput.displayName = "FormInput";

/**
 * FormTextarea - Textarea field wrapper with error handling
 */
interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const FormTextarea = React.forwardRef<
  HTMLTextAreaElement,
  FormTextareaProps
>(({ label, error, containerClassName, required, id, ...props }, ref) => {
  return (
    <FormField
      label={label}
      error={error}
      required={required}
      className={containerClassName}
      htmlFor={id}
    >
      <Textarea
        ref={ref}
        id={id}
        className={cn(error && "border-destructive")}
        {...props}
      />
    </FormField>
  );
});
FormTextarea.displayName = "FormTextarea";

/**
 * FormSelect - Select field wrapper with error handling
 */
interface FormSelectProps {
  label?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
  value?: string;
  onValueChange?: (value: string) => void;
  containerClassName?: string;
  disabled?: boolean;
}

export function FormSelect({
  label,
  error,
  required,
  placeholder = "선택하세요",
  options,
  value,
  onValueChange,
  containerClassName,
  disabled,
}: FormSelectProps) {
  return (
    <FormField
      label={label}
      error={error}
      required={required}
      className={containerClassName}
    >
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          className={cn(error && "border-destructive")}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}

/**
 * FormError - Displays form-level errors
 */
interface FormErrorProps {
  error?: string;
  className?: string;
}

export function FormError({ error, className }: FormErrorProps) {
  if (!error) return null;

  return (
    <div
      className={cn(
        "rounded-md bg-destructive/10 p-3 text-sm text-destructive",
        className
      )}
    >
      {error}
    </div>
  );
}
