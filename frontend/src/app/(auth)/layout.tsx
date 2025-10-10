import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication - Helpernote',
  description: 'Login to your Helpernote account',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">Helpernote</h1>
          <p className="text-muted-foreground mt-2">헬퍼노트 관리 시스템</p>
        </div>
        {children}
      </div>
    </div>
  );
}
