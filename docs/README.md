# Helpernote | Documentation Index

취업 중개 플랫폼 Helpernote의 환경 구성, 배포, 운영, 보안 문서를 모아둔 디렉터리입니다. 각 문서를 참고해 실제 서비스 환경에 맞게 값을 교체하고, 변경 사항은 PR과 함께 문서에 반영하세요.

## 핵심 문서
- [환경 구성](./environment.md): Backend/Frontend/인프라 환경 변수와 시크릿 설계
- [배포 가이드](./deployment.md): Docker Compose, Kubernetes, ArgoCD 흐름
- [워크플로](./workflow.md): 브랜치 전략, 테스트 정책, GitHub Actions
- [운영 가이드](./operations.md): 브랜드, 데이터 관리, 검증 체크리스트
- [보안 가이드](./security.md): 비밀 관리, 접근 제어, 공개 전 점검표

## 참고 자료
- `Makefile`: 로컬 개발, 빌드, 테스트 자동화 명령어
- `scripts/`: 시크릿 생성, 데이터 마이그레이션, 헬스체크 스크립트
- `reset-git-history.sh`: 저장소 커밋 히스토리를 초기화할 때 사용

## 문서 유지 원칙
1. 문서를 수정하면 PR에 변경 요약을 추가하고, 필요 시 `Last updated` 표기를 갱신합니다.
2. 민감 정보는 문서에 기재하지 않고 예시 값 또는 마스킹된 값을 사용합니다.
3. 운영 과정에서 발견한 개선 사항은 즉시 관련 문서에 반영해 템플릿 품질을 유지합니다.

