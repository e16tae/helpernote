# Helpernote Brand Guidelines

## 브랜드 개요

**Helpernote**는 취업 중개 업체를 위한 통합 관리 플랫폼으로, 고용주와 근로자를 효율적으로 연결하고 매칭 현황과 수수료를 체계적으로 관리하는 전문 솔루션입니다.

### 브랜드 컨셉

- **전문성 (Professional)**: 비즈니스 도구로서의 신뢰감과 안정성
- **연결성 (Connection)**: 고용주와 근로자를 연결하는 중개자
- **효율성 (Efficiency)**: 업무 프로세스를 간소화하고 자동화
- **성장 (Growth)**: 중개 업체의 비즈니스 성장 지원

---

## 로고

### 로고 구성

Helpernote 로고는 **아이콘 + 워드마크** 조합으로 구성됩니다.

**아이콘**: 노트 모양 위에 체크마크
- 노트: 기록과 관리를 상징
- 체크마크: 완료, 성공, 매칭 성공을 의미

**워드마크**: "Helpernote" 텍스트
- "Helper": 기본 색상 (Black/White)
- "note": 그린 그라디언트 (브랜드 색상)

### 로고 파일

- `/public/logo.svg` - 전체 로고 (아이콘 + 워드마크)
- `/public/logo-icon.svg` - 아이콘만
- `/public/favicon.svg` - 파비콘

### 사용 규칙

✅ **올바른 사용**:
- 충분한 여백 확보 (로고 높이의 최소 50%)
- 명확한 배경 위에 배치
- 비율을 유지한 크기 조정

❌ **피해야 할 사용**:
- 로고 비율 왜곡
- 로고 색상 임의 변경
- 불충분한 여백
- 복잡한 배경 위에 배치

---

## 컬러 팔레트

### Primary Colors

#### Blue (Primary)
- **Light Mode**: `oklch(0.5530 0.1850 255.0000)` - #2563eb
- **Dark Mode**: `oklch(0.6390 0.1750 255.0000)` - #3b82f6
- **용도**: 주요 UI 요소, CTA 버튼, 링크
- **의미**: 신뢰, 전문성, 안정성

#### Green (Secondary)
- **Light Mode**: `oklch(0.5960 0.1620 145.0000)` - #16a34a
- **Dark Mode**: `oklch(0.6520 0.1520 145.0000)` - #22c55e
- **용도**: 성공 상태, 긍정 액션, 강조 요소
- **의미**: 성장, 성공, 매칭 성공

#### Amber (Accent)
- **Light Mode**: `oklch(0.7490 0.1480 65.0000)` - #f59e0b
- **Dark Mode**: `oklch(0.6990 0.1380 65.0000)` - #fbbf24
- **용도**: 강조, 경고, 중요 정보
- **의미**: 활력, 에너지, 주의

### Neutral Colors

- **Background**: Light gray to Dark gray (automatic theme adaptation)
- **Foreground**: Dark gray to Light gray
- **Muted**: Secondary text, borders
- **Border**: Dividers, outlines

### Semantic Colors

- **Destructive**: Red - 삭제, 오류, 위험
- **Success**: Green - 성공, 완료
- **Warning**: Amber - 경고, 주의
- **Info**: Blue - 정보, 알림

---

## 타이포그래피

### 폰트 패밀리

```css
--font-sans: Inter, system-ui, -apple-system, sans-serif;
--font-serif: Merriweather, serif;
--font-mono: JetBrains Mono, monospace;
```

### 폰트 사용

- **Sans-serif (Inter)**: UI 전체, 본문 텍스트
- **Serif (Merriweather)**: 특별한 강조, 인용구
- **Monospace (JetBrains Mono)**: 코드, 데이터, 숫자

### 타이포그래피 스케일

- **Heading 1**: 3xl-6xl (30px-60px) - 페이지 제목
- **Heading 2**: 2xl-4xl (24px-36px) - 섹션 제목
- **Heading 3**: xl-2xl (20px-24px) - 서브섹션
- **Body**: base-lg (16px-18px) - 본문
- **Small**: sm (14px) - 캡션, 보조 텍스트
- **Tiny**: xs (12px) - 라벨, 메타 정보

---

## UI Components

### 버튼

#### Primary Button
- Background: Primary blue
- Text: White
- 용도: 주요 액션 (등록, 저장, 시작하기)

#### Secondary Button
- Background: Secondary green
- Text: White
- 용도: 긍정 액션 (승인, 완료)

#### Outline Button
- Border: Border color
- Background: Transparent
- 용도: 보조 액션 (취소, 뒤로)

#### Destructive Button
- Background: Red
- Text: White
- 용도: 삭제, 위험한 액션

### Cards

- Border radius: `0.5rem` (8px)
- Background: Card background
- Border: 1px solid border color
- Shadow: Subtle elevation

### Forms

- Input height: 40px (default)
- Border radius: `0.375rem` (6px)
- Focus ring: 2px primary color
- Placeholder: Muted foreground

---

## 아이콘

### 아이콘 라이브러리

**Lucide React** - 일관된 스타일의 아이콘 세트 사용

### 주요 아이콘

- **Users**: 고객 관리
- **ClipboardCheck**: 매칭
- **TrendingUp**: 수수료/정산
- **Search**: 검색
- **Plus**: 새로 추가
- **Edit (Pencil)**: 수정
- **Trash**: 삭제
- **Eye**: 상세보기

### 사용 규칙

- 크기: 16px, 20px, 24px (h-4, h-5, h-6)
- 색상: 기본적으로 currentColor 사용
- Stroke width: 2 (일관성 유지)

---

## 간격 (Spacing)

### 기본 단위

```css
--spacing: 0.25rem; /* 4px */
```

### Tailwind 스케일

- xs: 0.5 (8px)
- sm: 1 (16px)
- md: 1.5 (24px)
- lg: 2 (32px)
- xl: 3 (48px)
- 2xl: 4 (64px)

### 레이아웃 간격

- Section padding: py-12 ~ py-20 (48px-80px)
- Container padding: px-4 ~ px-8 (16px-32px)
- Card padding: p-4 ~ p-6 (16px-24px)
- Button padding: px-4 py-2 (16px 8px)

---

## Shadow (그림자)

### 그림자 레벨

- **xs**: 미세한 elevation
- **sm**: 카드, 드롭다운
- **md**: 모달, 오버레이
- **lg**: 팝업, 다이얼로그
- **xl**: 최상위 레이어

### 사용 규칙

- 기본: `shadow-sm` (대부분의 카드)
- 호버: `hover:shadow-md` (interactive 요소)
- 모달: `shadow-lg` (다이얼로그, 팝업)

---

## 애니메이션

### Transition

```css
transition-colors /* 색상 변화 */
transition-all /* 모든 속성 */
duration-200 /* 200ms - 빠른 피드백 */
duration-300 /* 300ms - 표준 */
```

### 사용 예시

- Button hover: `transition-colors duration-200`
- Modal open: `animate-in fade-in-0 zoom-in-95`
- Toast: `animate-in slide-in-from-bottom-4`

---

## Voice & Tone

### 브랜드 보이스

- **전문적이지만 친근하게**: 과도한 전문 용어 지양
- **명확하고 간결하게**: 핵심만 전달
- **긍정적이고 도움되게**: 문제보다 해결책 중심
- **존중하며 격려적으로**: 사용자의 성공 지원

### 문구 예시

✅ **좋은 예**:
- "고객을 추가해보세요"
- "매칭이 완료되었습니다"
- "잠시만 기다려주세요"

❌ **피해야 할 예**:
- "고객 데이터베이스에 엔트리를 삽입하십시오"
- "매칭 프로세스가 성공적으로 종료됨"
- "처리 중입니다. 대기하세요"

---

## 접근성 (Accessibility)

### 색상 대비

- WCAG AA 기준 준수 (4.5:1 이상)
- 중요한 정보는 색상만으로 전달하지 않기
- Dark mode 자동 지원

### 키보드 네비게이션

- 모든 interactive 요소 tab 접근 가능
- Focus ring 명확하게 표시
- 논리적인 tab 순서

### 스크린 리더

- 의미 있는 alt text
- aria-label 적절히 사용
- 시맨틱 HTML 구조

---

## 파일 구조

```
/public/
├── logo.svg                 # 전체 로고
├── logo-icon.svg            # 아이콘만
├── favicon.svg              # 파비콘
├── manifest.json            # PWA manifest
└── images/
    └── og-image.svg         # Open Graph 이미지
```

---

## 브랜딩 체크리스트

프로젝트에 브랜딩을 적용할 때 확인사항:

- [ ] 로고를 올바른 크기와 여백으로 사용했는가?
- [ ] 브랜드 컬러 팔레트를 준수했는가?
- [ ] 일관된 타이포그래피를 사용했는가?
- [ ] 적절한 간격과 레이아웃을 유지했는가?
- [ ] 접근성 기준을 충족했는가?
- [ ] 브랜드 보이스를 반영한 문구인가?

---

## 업데이트 이력

- 2025-10-10: 초기 브랜드 가이드라인 작성
  - 컬러 시스템: Blue (Trust) + Green (Success) + Amber (Energy)
  - 로고 디자인: Note with checkmark
  - OKLCH 색상 시스템 적용
