import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Target, Users, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: '서비스 소개',
  description: 'Helpernote는 소개소의 업무 효율을 극대화하는 통합 관리 플랫폼입니다.',
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Helpernote Logo" width="160" height={36} priority />
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
              홈
            </Link>
            <Button asChild variant="outline" size="sm">
              <Link href="/login">로그인</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-muted to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">서비스 소개</h1>
            <p className="text-xl text-muted-foreground">
              Helpernote는 소개소의 성공을 돕는 파트너입니다.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-3">우리의 미션</h2>
                <p className="text-muted-foreground">
                  매칭 업무를 디지털화하여 효율성을 높이고, 더 많은 성공적인 매칭을 만들어냅니다.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Lightbulb className="h-8 w-8 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold mb-3">우리의 비전</h2>
                <p className="text-muted-foreground">
                  모든 소개소가 최고의 도구를 사용하여 비즈니스를 성장시킬 수 있도록 지원합니다.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-accent" />
                </div>
                <h2 className="text-2xl font-bold mb-3">우리의 가치</h2>
                <p className="text-muted-foreground">
                  고객의 성공이 곧 우리의 성공입니다. 신뢰와 투명성을 최우선으로 합니다.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-center mb-8">우리의 이야기</h2>
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <p className="text-muted-foreground text-lg leading-relaxed">
                Helpernote는 실제 소개소 운영자들의 고민에서 시작되었습니다.
                엑셀과 종이 문서로 고객을 관리하고, 매칭 현황을 추적하며, 수수료를
                계산하는 과정에서 발생하는 비효율성과 오류를 직접 경험했습니다.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                이러한 문제를 해결하기 위해, 우리는 매칭 업무에 특화된 통합 관리
                플랫폼을 개발했습니다. Helpernote는 고객 관리, 매칭, 정산까지
                모든 프로세스를 하나의 플랫폼에서 처리할 수 있도록 설계되었습니다.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                현재 수많은 소개소가 Helpernote를 사용하여 업무 효율을 높이고,
                더 많은 성공적인 매칭을 만들어가고 있습니다. 우리는 앞으로도
                지속적인 개선과 혁신을 통해 고객의 성공을 지원하겠습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold">함께 성장하세요</h2>
            <p className="text-lg opacity-90">
              Helpernote와 함께 소개소 관리의 새로운 기준을 만들어보세요.
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link href="/register">지금 시작하기</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="Helpernote" width={120} height={28} />
            </Link>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/about" className="hover:text-foreground transition-colors">소개</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">문의</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">개인정보처리방침</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">이용약관</Link>
            </div>
          </div>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Helpernote. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
