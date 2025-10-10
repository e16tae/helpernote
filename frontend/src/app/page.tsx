import Link from 'next/link';
import { ArrowRight, Users, ClipboardCheck, TrendingUp, Shield, Zap, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/logo';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo href="/" />
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              기능
            </Link>
            <Link href="#benefits" className="text-sm font-medium hover:text-primary transition-colors">
              장점
            </Link>
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
              로그인
            </Link>
            <Button asChild className="shadow-sm">
              <Link href="/register">시작하기</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 md:py-40 bg-gradient-to-br from-green-50 via-background to-emerald-50 dark:from-green-950/20 dark:via-background dark:to-emerald-950/20 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 backdrop-blur px-4 py-2 text-sm shadow-sm mb-4">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="font-medium">소개소 관리의 새로운 기준</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
              소개소 매칭의 모든 것을
              <br />
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                하나의 플랫폼
              </span>
              에서
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              고용주와 근로자를 효율적으로 연결하고,
              <br className="hidden md:block" />
              매칭 현황과 수수료를 체계적으로 관리하세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" className="text-lg px-10 h-14 shadow-lg hover:shadow-xl transition-all">
                <Link href="/register">
                  무료로 시작하기
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-10 h-14 shadow-sm hover:shadow-md transition-all">
                <Link href="/login">로그인</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground pt-4">
              💳 신용카드 필요 없음 · ⚡ 30초 만에 시작
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              매칭 업무에 필요한 모든 기능
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Helpernote는 소개소의 업무 효율을 극대화하는 핵심 기능을 제공합니다.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-t-4 border-t-blue-500 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="rounded-lg bg-blue-100 dark:bg-blue-900/20 w-12 h-12 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">고객 관리</h3>
                <p className="text-muted-foreground">
                  고용주와 근로자 정보를 체계적으로 관리하고, 태그와 메모로 효율적으로 분류하세요.
                </p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-green-500 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="rounded-lg bg-green-100 dark:bg-green-900/20 w-12 h-12 flex items-center justify-center mb-4">
                  <ClipboardCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">매칭 관리</h3>
                <p className="text-muted-foreground">
                  구인/구직 공고를 등록하고 최적의 매칭을 진행하세요. 매칭 상태를 실시간으로 추적합니다.
                </p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-purple-500 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="rounded-lg bg-purple-100 dark:bg-purple-900/20 w-12 h-12 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">수수료 정산</h3>
                <p className="text-muted-foreground">
                  매칭별 수수료를 자동 계산하고 정산 현황을 한눈에 파악할 수 있습니다.
                </p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-amber-500 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="rounded-lg bg-amber-100 dark:bg-amber-900/20 w-12 h-12 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">빠른 검색</h3>
                <p className="text-muted-foreground">
                  고객 이름, 전화번호로 즉시 검색하고 필요한 정보를 빠르게 찾으세요.
                </p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-emerald-500 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/20 w-12 h-12 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">데이터 분석</h3>
                <p className="text-muted-foreground">
                  매칭 통계와 수익 분석으로 비즈니스 인사이트를 얻으세요.
                </p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-indigo-500 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="rounded-lg bg-indigo-100 dark:bg-indigo-900/20 w-12 h-12 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">안전한 보안</h3>
                <p className="text-muted-foreground">
                  고객 정보를 안전하게 보호하고 권한별 접근을 관리합니다.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                왜 Helpernote인가?
              </h2>
              <p className="text-lg text-muted-foreground">
                매칭 업무의 효율을 높이고 수익을 극대화하세요.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary text-primary-foreground w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">업무 시간 50% 단축</h3>
                    <p className="text-sm text-muted-foreground">
                      자동화된 워크플로우로 반복 작업을 줄이고 핵심 업무에 집중하세요.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary text-primary-foreground w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">매칭 성공률 증가</h3>
                    <p className="text-sm text-muted-foreground">
                      체계적인 고객 관리와 빠른 검색으로 최적의 매칭을 찾으세요.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-secondary text-secondary-foreground w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">정산 오류 제로</h3>
                    <p className="text-sm text-muted-foreground">
                      자동 수수료 계산으로 정산 실수를 방지하고 신뢰를 쌓으세요.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-secondary text-secondary-foreground w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">언제 어디서나 접근</h3>
                    <p className="text-sm text-muted-foreground">
                      웹 기반 플랫폼으로 PC, 태블릿, 모바일에서 자유롭게 이용하세요.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 md:py-32 bg-gradient-to-br from-green-600 via-green-500 to-emerald-600 text-white overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.3))]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-green-600/50 to-transparent"></div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur px-4 py-2 text-sm font-medium mb-4">
              <span>✨</span>
              <span>지금 무료로 시작하세요</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
              소개소 혁신,
              <br />
              오늘 바로 시작하세요
            </h2>

            <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto leading-relaxed">
              Helpernote와 함께 더 많은 성공적인 매칭을 만들고
              <br className="hidden md:block" />
              비즈니스를 성장시키세요
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" variant="secondary" className="text-lg px-10 h-14 shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                <Link href="/register">
                  무료로 시작하기
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-10 h-14 border-white/30 bg-white/10 hover:bg-white/20 text-white hover:text-white backdrop-blur shadow-lg">
                <Link href="/login">로그인</Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-sm opacity-80">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">✓</div>
                <span>신용카드 불필요</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">✓</div>
                <span>30초 만에 시작</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">✓</div>
                <span>언제든 무료</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="mb-4">
                <Logo href="/" />
              </div>
              <p className="text-sm text-muted-foreground">
                소개소를 위한 통합 관리 플랫폼
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">제품</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">기능</Link></li>
                <li><Link href="#benefits" className="hover:text-foreground transition-colors">장점</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">서비스</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground transition-colors">소개</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">문의</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">법적 고지</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">개인정보처리방침</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">이용약관</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Helpernote. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
