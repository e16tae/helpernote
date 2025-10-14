# Helpernote | Security & Public Release

Helpernote는 구직자/구인자 정보를 다루는 서비스이므로 강력한 보안 정책과 공개 저장소 운영 수칙이 필요합니다. 이 문서는 비밀 정보 관리, 접근 제어, 사고 대응 절차를 정리합니다.

## 1. 보안 이슈 보고
- 취약점을 발견하면 공개 이슈 대신 GitHub Security Advisory 또는 비공개 채널(보안 담당 이메일)을 통해 공유합니다.
- 재현 절차, 영향 범위, 임시 완화 방안, 타임라인을 포함해 보고합니다.

## 2. 비밀 정보 관리

- `.env`, `backend/.env`, `frontend/.env`, `k8s/**/secrets.yaml`은 git에 커밋하지 않습니다.
- 실 운영 값은 Kubernetes Secret, GitHub Secrets, Vault/Secret Manager에 저장합니다.
- 최소 권한 원칙을 적용해 PAT, API 키를 발급하고, 정기적으로 로테이션합니다.

### GitHub Actions Secrets
| 이름 | 설명 |
| ---- | ---- |
| `GH_PAT` | GHCR 푸시 & 매니페스트 업데이트용 토큰 (`repo`, `write:packages`) |
| `ARGOCD_SERVER` | ArgoCD API 주소 |
| `ARGOCD_TOKEN` | `argocd account generate-token` 으로 발급한 토큰 |
| (옵션) `SLACK_WEBHOOK_URL` | 배포/장애 알림 |

### Kubernetes Secrets
| Secret | 용도 |
| ------ | ---- |
| `postgres-secret` | PostgreSQL DB 이름/사용자/비밀번호 |
| `minio-secret` | MinIO Access Key / Secret Key |
| `backend-secret` | `DATABASE_URL`, `JWT_SECRET`, MinIO 키 등 |
| `ghcr-secret` | GitHub Container Registry pull 자격 증명 |
| `helpernote-wildcard-tls` | TLS 인증서 (cert-manager 또는 수동 생성) |

## 3. 접근 제어 & 데이터 보호

- 사용자/운영자 역할을 RBAC로 정의하고, 권한 상승 요청은 Change Log로 기록합니다.
- 개인정보는 최소한으로 저장하고, 주민등록번호 등 민감 데이터는 절대 저장하지 않습니다.
- 백엔드 API에서 감사 목적의 로깅을 할 때 개인정보가 노출되지 않도록 주의합니다.
- MinIO 버킷은 비공개로 유지하고, presigned URL 만료 시간을 짧게 설정합니다.

## 4. 네트워크 & TLS

- Kong Ingress에서 다음 플러그인을 고려합니다: Rate Limiting, Bot Detection, Request Size Limit.
- cert-manager를 사용하여 TLS 인증서를 자동 발급/갱신하거나, 수동 Secret을 사용합니다.
- 내부 서비스 간 통신(예: 백엔드 ↔ MinIO)은 클러스터 내부 DNS를 활용해 노출을 최소화합니다.

## 5. 공개 전 점검표

- [ ] `.env.example`, `backend/.env.example`, `frontend/.env.example`에서 모든 값이 플레이스홀더로 제공된다.
- [ ] 코드와 문서, 이슈에 실 운영 도메인/계정/전화번호가 노출되지 않는다.
- [ ] GitHub Actions 출력 로그에 시크릿이 포함되지 않는다.
- [ ] Docker 이미지에 비밀번호/토큰이 하드코딩되어 있지 않다.
- [ ] `npm run lint`, `npm run build`, `cargo test`, `make test`가 통과한다.
- [ ] README 및 `docs/` 문서가 최신 배포 절차와 일치한다.

## 6. 의존성 & 취약점 관리

- Rust: `cargo audit`, `cargo outdated`로 취약점과 버전 업그레이드를 확인합니다.
- Frontend: `npm audit`, Dependabot 알림을 주기적으로 검토합니다.
- 컨테이너: Trivy, Grype 등을 사용해 Docker 이미지 스캔을 자동화합니다.

## 7. 사고 대응 절차

1. **탐지**: 알림/모니터링/사용자 신고로 이상 징후 인지
2. **격리**: 영향을 받는 서비스(Deployment) 스케일 다운, 네트워크 차단
3. **분석**: `kubectl logs`, MinIO access log, PostgreSQL 감사 로그 조사
4. **조치**: 패치 및 시크릿 로테이션 → CI 재배포 → 상태 확인
5. **보고**: 사고 타임라인, 영향 범위, 재발 방지 계획 문서화

## 8. 백업 & 복구

- PostgreSQL 백업은 CronJob 또는 외부 백업 시스템을 통해 최소 하루 1회 실행합니다.
- MinIO에 저장되는 파일은 버전닝 또는 별도의 백업 정책을 적용합니다.
- 복구 테스트는 최소 월 1회 수행하며, 절차를 Runbook으로 유지합니다.

