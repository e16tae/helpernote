import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MessageSquare, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: '문의하기',
  description: 'Helpernote에 대한 문의사항이 있으시면 언제든 연락주세요. 성심껏 답변드리겠습니다.',
};

export default function ContactPage() {
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
            <h1 className="text-4xl md:text-5xl font-bold">문의하기</h1>
            <p className="text-xl text-muted-foreground">
              궁금하신 사항이 있으시면 언제든 연락주세요.
              <br />
              빠르고 정확하게 답변드리겠습니다.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">이메일</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    이메일로 문의하시면 24시간 내에 답변드립니다.
                  </p>
                  <a
                    href="mailto:contact@helpernote.com"
                    className="text-primary hover:underline font-medium"
                  >
                    contact@helpernote.com
                  </a>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Phone className="h-8 w-8 text-secondary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">전화</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    평일 오전 9시부터 오후 6시까지 상담 가능합니다.
                  </p>
                  <a
                    href="tel:1588-0000"
                    className="text-secondary hover:underline font-medium"
                  >
                    1588-0000
                  </a>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                    <MessageSquare className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">카카오톡</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    카카오톡 채널로 빠르게 문의하실 수 있습니다.
                  </p>
                  <a
                    href="https://pf.kakao.com/_helpernote"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline font-medium"
                  >
                    @helpernote
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Business Hours */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-4">운영 시간</h2>
                    <div className="space-y-2 text-muted-foreground">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="font-medium">평일 (월~금)</span>
                        <span>오전 9:00 - 오후 6:00</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="font-medium">토요일</span>
                        <span>오전 9:00 - 오후 1:00</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="font-medium">일요일 및 공휴일</span>
                        <span className="text-muted-foreground">휴무</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      * 이메일 문의는 24시간 접수 가능하며, 운영 시간 내 순차적으로 답변드립니다.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Quick Links */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">자주 묻는 질문</h2>
            <div className="space-y-4 text-left">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Q. Helpernote는 어떤 서비스인가요?</h3>
                  <p className="text-sm text-muted-foreground">
                    A. Helpernote는 소개소를 위한 통합 관리 플랫폼으로,
                    고용주와 근로자 관리, 매칭, 수수료 정산까지 모든 업무를
                    하나의 시스템에서 처리할 수 있습니다.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Q. 가격 정책은 어떻게 되나요?</h3>
                  <p className="text-sm text-muted-foreground">
                    A. 기본 플랜은 무료로 제공되며, 고급 기능이 필요한 경우
                    프리미엄 플랜을 선택하실 수 있습니다. 자세한 내용은
                    이메일로 문의해주세요.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Q. 모바일에서도 사용할 수 있나요?</h3>
                  <p className="text-sm text-muted-foreground">
                    A. 네, Helpernote는 반응형 웹 디자인으로 제작되어
                    PC, 태블릿, 스마트폰 등 모든 기기에서 사용 가능합니다.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold">지금 바로 시작해보세요</h2>
            <p className="text-lg opacity-90">
              무료로 시작하고, Helpernote의 모든 기능을 체험해보세요.
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link href="/register">무료로 시작하기</Link>
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
