import Link from 'next/link';
import Image from 'next/image';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: '개인정보처리방침',
  description: 'Helpernote의 개인정보처리방침을 확인하세요. 고객의 개인정보를 안전하게 보호합니다.',
};

export default function PrivacyPage() {
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
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">개인정보처리방침</h1>
            <p className="text-xl text-muted-foreground">
              Helpernote는 고객의 개인정보를 소중히 여기며,
              <br />
              관련 법령을 준수하여 안전하게 보호합니다.
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

            <h2>1. 개인정보의 수집 및 이용 목적</h2>
            <p>
              Helpernote(이하 "서비스 제공자")는 다음의 목적을 위하여 개인정보를 처리합니다.
              처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며,
              이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등
              필요한 조치를 이행할 예정입니다.
            </p>

            <h3>가. 회원 가입 및 관리</h3>
            <ul>
              <li>회원 가입 의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증</li>
              <li>회원자격 유지·관리, 서비스 부정이용 방지</li>
              <li>각종 고지·통지, 고충처리 등을 목적으로 개인정보를 처리합니다.</li>
            </ul>

            <h3>나. 서비스 제공</h3>
            <ul>
              <li>고객 관리(고용주, 근로자) 서비스 제공</li>
              <li>매칭 서비스 제공 및 관리</li>
              <li>수수료 정산 및 관리</li>
              <li>파일 업로드 및 저장 서비스 제공</li>
            </ul>

            <h3>다. 고충처리</h3>
            <ul>
              <li>민원인의 신원 확인, 민원사항 확인, 사실조사를 위한 연락·통지</li>
              <li>처리결과 통보 등의 목적으로 개인정보를 처리합니다.</li>
            </ul>

            <h2>2. 수집하는 개인정보의 항목</h2>

            <h3>가. 회원 정보</h3>
            <ul>
              <li>필수항목: 이메일, 사용자명, 비밀번호, 연락처</li>
              <li>선택항목: 프로필 사진</li>
            </ul>

            <h3>나. 고객 정보(고용주/근로자)</h3>
            <ul>
              <li>필수항목: 이름, 연락처, 고객 유형</li>
              <li>선택항목: 이메일, 주소, 메모, 태그, 파일</li>
            </ul>

            <h3>다. 자동 수집 정보</h3>
            <ul>
              <li>서비스 이용 기록, IP 주소, 쿠키, 접속 로그, 기기 정보</li>
            </ul>

            <h2>3. 개인정보의 처리 및 보유 기간</h2>
            <p>
              서비스 제공자는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를
              수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
            </p>

            <h3>가. 회원 정보</h3>
            <ul>
              <li>보유 기간: 회원 탈퇴 시까지</li>
              <li>단, 관련 법령에 따라 보존할 필요가 있는 경우 해당 기간 동안 보관</li>
            </ul>

            <h3>나. 고객 정보</h3>
            <ul>
              <li>보유 기간: 사용자가 삭제 요청 시까지</li>
              <li>단, 매칭 이력이 있는 경우 법령에 따라 최대 5년간 보관</li>
            </ul>

            <h3>다. 법령에 따른 보관</h3>
            <ul>
              <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
              <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</li>
              <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)</li>
              <li>웹사이트 방문 기록: 3개월 (통신비밀보호법)</li>
            </ul>

            <h2>4. 개인정보의 제3자 제공</h2>
            <p>
              서비스 제공자는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며,
              정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조에 해당하는 경우에만
              개인정보를 제3자에게 제공합니다.
            </p>
            <p>
              현재 서비스 제공자는 이용자의 개인정보를 제3자에게 제공하고 있지 않습니다.
            </p>

            <h2>5. 개인정보 처리의 위탁</h2>
            <p>
              서비스 제공자는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.
            </p>
            <ul>
              <li>
                <strong>클라우드 서비스 제공업체</strong>
                <br />
                위탁업무: 데이터 보관 및 서버 관리
                <br />
                보유 및 이용 기간: 회원 탈퇴 시 또는 위탁 계약 종료 시까지
              </li>
            </ul>

            <h2>6. 정보주체의 권리·의무 및 행사방법</h2>
            <p>
              정보주체는 서비스 제공자에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.
            </p>
            <ul>
              <li>개인정보 열람 요구</li>
              <li>개인정보 오류 등이 있을 경우 정정 요구</li>
              <li>개인정보 삭제 요구</li>
              <li>개인정보 처리정지 요구</li>
            </ul>
            <p>
              권리 행사는 서비스 제공자에 대해 서면, 전화, 전자우편 등을 통하여 하실 수 있으며,
              서비스 제공자는 이에 대해 지체 없이 조치하겠습니다.
            </p>

            <h2>7. 개인정보의 파기</h2>
            <p>
              서비스 제공자는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는
              지체 없이 해당 개인정보를 파기합니다.
            </p>

            <h3>가. 파기 절차</h3>
            <p>
              이용자가 입력한 정보는 목적 달성 후 별도의 DB에 옮겨져(종이의 경우 별도의 서류)
              내부 방침 및 기타 관련 법령에 따라 일정기간 저장된 후 혹은 즉시 파기됩니다.
            </p>

            <h3>나. 파기 방법</h3>
            <ul>
              <li>전자적 파일 형태: 복구 및 재생되지 않도록 안전하게 삭제</li>
              <li>종이에 출력된 개인정보: 분쇄기로 분쇄하거나 소각</li>
            </ul>

            <h2>8. 개인정보 보호책임자</h2>
            <p>
              서비스 제공자는 개인정보 처리에 관한 업무를 총괄해서 책임지고,
              개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여
              아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
            </p>
            <div className="not-prose p-6 bg-muted rounded-lg my-6">
              <h3 className="font-bold text-lg mb-4">개인정보 보호책임자</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <strong>성명:</strong> 개인정보보호팀
                </li>
                <li>
                  <strong>이메일:</strong>{' '}
                  <a href="mailto:privacy@helpernote.com" className="text-primary hover:underline">
                    privacy@helpernote.com
                  </a>
                </li>
                <li>
                  <strong>전화:</strong> 1588-0000
                </li>
              </ul>
            </div>

            <h2>9. 개인정보 처리방침의 변경</h2>
            <p>
              이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가,
              삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
            </p>

            <h2>10. 개인정보의 안전성 확보 조치</h2>
            <p>
              서비스 제공자는 개인정보보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적/관리적 및
              물리적 조치를 하고 있습니다.
            </p>
            <ul>
              <li>개인정보 취급 직원의 최소화 및 교육</li>
              <li>개인정보에 대한 접근 제한</li>
              <li>접속기록의 보관 및 위변조 방지</li>
              <li>개인정보의 암호화</li>
              <li>해킹 등에 대비한 기술적 대책</li>
              <li>비인가자에 대한 출입 통제</li>
            </ul>

            <div className="not-prose mt-12 p-6 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm text-muted-foreground">
                개인정보 처리방침에 대한 문의사항이 있으시면 언제든지{' '}
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
