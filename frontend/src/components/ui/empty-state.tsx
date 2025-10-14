import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        {Icon && (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Icon className="h-10 w-10 text-muted-foreground" />
          </div>
        )}

        <h3 className="mt-4 text-lg font-semibold">{title}</h3>

        {description && (
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            {description}
          </p>
        )}

        {action && (
          <Button onClick={action.onClick} className="mt-4">
            {action.label}
          </Button>
        )}

        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
}
