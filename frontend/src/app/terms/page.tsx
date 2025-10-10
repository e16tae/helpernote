import Link from 'next/link';
import Image from 'next/image';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: '이용약관',
  description: 'Helpernote 서비스 이용약관을 확인하세요.',
};

export default function TermsPage() {
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
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">이용약관</h1>
            <p className="text-xl text-muted-foreground">
              Helpernote 서비스 이용을 위한 약관입니다.
              <br />
              서비스 이용 전 반드시 확인해주세요.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-slate dark:prose-invert prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-p:text-muted-foreground">
            <div className="not-prose mb-8 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>시행일자:</strong> 2025년 10월 10일
                <br />
                <strong>최종 수정일:</strong> 2025년 10월 10일
              </p>
            </div>

            <h2>제1조 (목적)</h2>
            <p>
              본 약관은 Helpernote(이하 &ldquo;서비스 제공자&rdquo;)가 제공하는 소개소 관리 시스템 서비스(이하 &ldquo;서비스&rdquo;)의
              이용과 관련하여 서비스 제공자와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을
              목적으로 합니다.
            </p>

            <h2>제2조 (정의)</h2>
            <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
            <ol>
              <li>
                &ldquo;서비스&rdquo;라 함은 서비스 제공자가 제공하는 소개소를 위한 통합 관리 플랫폼으로,
                고객 관리, 매칭 관리, 수수료 정산 등의 기능을 포함합니다.
              </li>
              <li>
                &ldquo;이용자&rdquo;라 함은 본 약관에 따라 서비스 제공자가 제공하는 서비스를 이용하는 회원을 말합니다.
              </li>
              <li>
                &ldquo;회원&rdquo;이라 함은 서비스 제공자와 서비스 이용계약을 체결하고 회원 아이디(ID)를 부여받은 자를 말합니다.
              </li>
              <li>
                &ldquo;고객&rdquo;이라 함은 회원이 관리하는 고용주 및 근로자를 말합니다.
              </li>
              <li>
                &ldquo;콘텐츠&rdquo;라 함은 정보통신망법의 규정에 따라 정보통신망에서 사용되는
                부호·문자·음성·음향·이미지·영상 등으로 표현된 자료 또는 정보를 말합니다.
              </li>
            </ol>

            <h2>제3조 (약관의 게시와 개정)</h2>
            <ol>
              <li>
                서비스 제공자는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면 또는
                연결화면에 게시합니다.
              </li>
              <li>
                서비스 제공자는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.
              </li>
              <li>
                서비스 제공자가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여
                현행 약관과 함께 서비스 초기 화면에 그 적용일자 7일 전부터 적용일자 전일까지 공지합니다.
              </li>
              <li>
                이용자가 개정약관의 적용에 동의하지 않는 경우 서비스 제공자 또는 이용자는
                서비스 이용계약을 해지할 수 있습니다.
              </li>
            </ol>

            <h2>제4조 (서비스의 제공)</h2>
            <ol>
              <li>
                서비스 제공자는 다음과 같은 서비스를 제공합니다.
                <ul>
                  <li>고객 관리 서비스 (고용주 및 근로자 정보 관리)</li>
                  <li>구인/구직 공고 등록 및 관리</li>
                  <li>매칭 관리 및 추적</li>
                  <li>수수료 계산 및 정산 관리</li>
                  <li>태그 및 메모 기능</li>
                  <li>파일 업로드 및 저장</li>
                  <li>통계 및 분석 기능</li>
                  <li>기타 서비스 제공자가 정하는 서비스</li>
                </ul>
              </li>
              <li>
                서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다. 다만, 서비스 제공자는 서비스 설비의
                장애, 서비스 이용의 폭주, 시스템 점검 등 부득이한 경우에는 서비스의 전부 또는
                일부를 제한하거나 중지할 수 있습니다.
              </li>
            </ol>

            <h2>제5조 (회원가입)</h2>
            <ol>
              <li>
                이용자는 서비스 제공자가 정한 가입 양식에 따라 회원정보를 기입한 후 본 약관에 동의한다는
                의사표시를 함으로써 회원가입을 신청합니다.
              </li>
              <li>
                서비스 제공자는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는
                한 회원으로 등록합니다.
                <ul>
                  <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                  <li>기타 회원으로 등록하는 것이 서비스 제공자의 기술상 현저히 지장이 있다고 판단되는 경우</li>
                </ul>
              </li>
              <li>
                회원가입계약의 성립 시기는 서비스 제공자의 승낙이 회원에게 도달한 시점으로 합니다.
              </li>
            </ol>

            <h2>제6조 (회원정보의 변경)</h2>
            <ol>
              <li>
                회원은 개인정보관리화면을 통하여 언제든지 본인의 개인정보를 열람하고 수정할 수 있습니다.
              </li>
              <li>
                회원은 회원가입 신청 시 기재한 사항이 변경되었을 경우 온라인으로 수정을 하거나
                전자우편 기타 방법으로 서비스 제공자에 대하여 그 변경사항을 알려야 합니다.
              </li>
            </ol>

            <h2>제7조 (회원 탈퇴 및 자격 상실)</h2>
            <ol>
              <li>
                회원은 서비스 제공자에 언제든지 탈퇴를 요청할 수 있으며 서비스 제공자는 즉시 회원탈퇴를 처리합니다.
              </li>
              <li>
                회원이 다음 각 호의 사유에 해당하는 경우, 서비스 제공자는 회원자격을 제한 및 정지시킬 수 있습니다.
                <ul>
                  <li>가입 신청 시에 허위 내용을 등록한 경우</li>
                  <li>다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 등 전자상거래 질서를 위협하는 경우</li>
                  <li>서비스를 이용하여 법령 또는 본 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우</li>
                </ul>
              </li>
            </ol>

            <h2>제8조 (회원의 의무)</h2>
            <ol>
              <li>
                회원은 다음 행위를 하여서는 안 됩니다.
                <ul>
                  <li>신청 또는 변경 시 허위 내용의 등록</li>
                  <li>타인의 정보 도용</li>
                  <li>서비스 제공자에 게시된 정보의 변경</li>
                  <li>서비스 제공자가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
                  <li>서비스 제공자 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                  <li>서비스 제공자 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                  <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
                </ul>
              </li>
            </ol>

            <h2>제9조 (저작권의 귀속 및 이용제한)</h2>
            <ol>
              <li>
                서비스 제공자가 작성한 저작물에 대한 저작권 기타 지적재산권은 서비스 제공자에 귀속합니다.
              </li>
              <li>
                이용자는 서비스를 이용함으로써 얻은 정보 중 서비스 제공자에게 지적재산권이 귀속된 정보를
                서비스 제공자의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여
                영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안됩니다.
              </li>
              <li>
                회원이 서비스 내에 게시한 게시물의 저작권은 해당 게시물의 저작자에게 귀속됩니다.
              </li>
            </ol>

            <h2>제10조 (개인정보보호)</h2>
            <ol>
              <li>
                서비스 제공자는 이용자의 개인정보를 보호하기 위하여 정보통신망법 및 개인정보보호법 등
                관계 법령에서 정하는 바를 준수합니다.
              </li>
              <li>
                서비스 제공자는 개인정보의 수집·이용·제공에 관한 동의란을 미리 선택한 것으로 설정해두지 않습니다.
              </li>
              <li>
                서비스 제공자의 개인정보 처리에 관한 상세한 사항은 개인정보처리방침에 따릅니다.
              </li>
            </ol>

            <h2>제11조 (서비스 제공자의 의무)</h2>
            <ol>
              <li>
                서비스 제공자는 법령과 본 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며
                본 약관이 정하는 바에 따라 지속적이고, 안정적으로 서비스를 제공하는데 최선을 다하여야 합니다.
              </li>
              <li>
                서비스 제공자는 이용자가 안전하게 서비스를 이용할 수 있도록 이용자의 개인정보(신용정보 포함)
                보호를 위한 보안 시스템을 갖추어야 합니다.
              </li>
            </ol>

            <h2>제12조 (서비스 이용요금)</h2>
            <ol>
              <li>
                서비스 제공자가 제공하는 서비스는 기본적으로 무료입니다. 다만, 서비스 제공자는 유료 서비스를
                제공할 수 있으며, 이 경우 해당 서비스 이용 전에 이용자에게 고지합니다.
              </li>
              <li>
                유료 서비스의 요금 및 결제 방법은 별도로 정하는 바에 따릅니다.
              </li>
            </ol>

            <h2>제13조 (면책조항)</h2>
            <ol>
              <li>
                서비스 제공자는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는
                서비스 제공에 관한 책임이 면제됩니다.
              </li>
              <li>
                서비스 제공자는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.
              </li>
              <li>
                서비스 제공자는 회원이 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며,
                그 밖에 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.
              </li>
              <li>
                서비스 제공자는 회원이 서비스에 게재한 정보, 자료, 사실의 신뢰도, 정확성 등의 내용에 관하여는
                책임을 지지 않습니다.
              </li>
            </ol>

            <h2>제14조 (분쟁해결)</h2>
            <ol>
              <li>
                서비스 제공자는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위하여
                피해보상처리기구를 설치·운영합니다.
              </li>
              <li>
                서비스 제공자와 이용자 간에 발생한 전자상거래 분쟁과 관련하여 이용자의 피해구제신청이 있는 경우에는
                공정거래위원회 또는 시·도지사가 의뢰하는 분쟁조정기관의 조정에 따를 수 있습니다.
              </li>
            </ol>

            <h2>제15조 (재판권 및 준거법)</h2>
            <ol>
              <li>
                서비스 제공자와 이용자 간에 발생한 서비스 이용에 관한 분쟁에 대하여는 대한민국 법을 적용합니다.
              </li>
              <li>
                서비스 제공자와 이용자 간에 발생한 분쟁에 관한 소송은 민사소송법상의 관할법원에 제소합니다.
              </li>
            </ol>

            <h2>부칙</h2>
            <p>본 약관은 2025년 10월 10일부터 시행됩니다.</p>

            <div className="not-prose mt-12 p-6 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm text-muted-foreground">
                이용약관에 대한 문의사항이 있으시면{' '}
                <Link href="/contact" className="text-primary hover:underline font-medium">
                  문의하기
                </Link>
                를 통해 연락주시기 바랍니다.
              </p>
            </div>
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
              <Link href="/about" className="hover:text-foreground transition-colors">
                소개
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                문의
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                개인정보처리방침
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                이용약관
              </Link>
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
