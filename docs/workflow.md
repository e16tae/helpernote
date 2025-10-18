# Helpernote | Engineering Workflow

Helpernote는 모노레포 구조이므로 백엔드와 프런트엔드, 인프라 변경 사항을 하나의 Git 흐름으로 관리합니다. 이 문서는 브랜치 전략, 테스트 정책, 자동화 파이프라인을 정의합니다.

## 브랜치 전략

```
develop ──┬── feature/<topic>
          └── agent/<issue-id>
             (자동화 에이전트 작업)
   │
   └── CI (lint/test)
main ──(자동 배포)──► 프로덕션
```

- **develop**: 기능 브랜치의 통합 브랜치. CI를 통해 코드 품질을 검증하고, 리뷰 후 main으로 머지합니다.
- **feature/**: 사람이 수행하는 기능/버그 작업용 브랜치입니다.
- **agent/**: 자동화 에이전트 작업용 브랜치입니다. 형식은 `agent/<issue-id>-<slug>`를 사용합니다.
- **main**: 배포 전용 브랜치. push 시 CD 파이프라인이 실행됩니다.

## 자동화 에이전트 협업 흐름

1. **이슈 준비**
   - 작업 요구 사항을 Issue에 정리하고 `automation-ready` 라벨을 부여합니다.
   - 필요한 입력(디자인, DB 예시, 수동 절차)을 정리합니다.

2. **브랜치 생성**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b agent/415-sync-commission-report
   ```
   - 에이전트가 해당 브랜치에서 작업합니다.
   - 사람이 보완할 내용이 있으면 같은 브랜치에 커밋을 추가합니다.

3. **작업 및 검증**
   - `make test`, `npm run lint`, `npm run build` 등을 실행하고 출력 요약을 기록합니다.
   - UI 플로우 검증은 Chrome DevTools Recorder 시나리오를 기반으로 수동 점검합니다.

4. **PR 생성**
   - 제목 예시: `feat: sync commission report columns`
   - 본문에 실행한 명령어, 테스트 결과, 남은 후속 작업을 기재합니다.

5. **사람 검수**
   - 코드 리뷰와 QA를 수행하고 필요한 변경을 apply합니다.
   - 문제 없으면 승인합니다.

6. **develop 병합**
   ```bash
   git checkout develop
   git merge --no-ff agent/415-sync-commission-report
   git push origin develop
   ```
   - 작업 완료 후 에이전트 브랜치를 삭제합니다.

7. **main 배포**
   - main으로 PR을 열어 승인 후 merge하면 CD 파이프라인이 배포를 수행합니다.

> 자동화 에이전트 작업은 반드시 사람 검토와 테스트 확인을 거친 뒤 main에 반영합니다.

## 개발 흐름

1. 기능 브랜치 생성  
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/<summary>
   ```
2. 로컬 검증  
   - `make dev-up` → PostgreSQL + MinIO 기동  
   - 백엔드: `cargo fmt --check && cargo clippy --all-targets && cargo test`  
   - 프런트엔드: `npm run lint && npm run test && npm run build`
3. 커밋 & 푸시  
   ```bash
   git commit -m "feat(matching): add bulk assignment"
   git push origin feat/<summary>
   ```
4. PR 생성 → 코드 리뷰 → develop 머지
5. 배포 준비  
   ```bash
   git checkout main
   git merge --ff-only develop
   git push origin main
   ```
6. 배포 후 `develop` 브랜치 동기화

## 커밋 메시지 컨벤션

| type | 설명 | 예시 |
| ---- | ---- | ---- |
| `feat` | 신규 기능 | `feat(schedule): add recurring reminder job` |
| `fix` | 버그 수정 | `fix(frontend): correct match summary stats` |
| `chore` | 설정, 의존성 | `chore(ci): enable npm cache` |
| `docs` | 문서 업데이트 | `docs(operations): add minio retention note` |
| `refactor` | 구조 개선 | `refactor(backend): split auth routes` |
| `test` | 테스트 코드 | `test(matching): cover commission edge cases` |

## GitHub Actions 파이프라인

- `ci-develop.yaml` (develop 브랜치):
  - Backend: `cargo fmt`, `cargo clippy`, `cargo test`
  - Frontend: `npm run lint`, `npm run test`, `npm run build`
  - Docker 이미지 빌드 검증 (푸시 없음)
- `cd-production.yaml` (main 브랜치):
  1. 백엔드/프런트엔드 이미지 빌드, 태그(`main-<sha>`, `latest`)로 GHCR 푸시
  2. `k8s/overlays/production/kustomization.yaml` 이미지 태그 업데이트
  3. ArgoCD 동기화 트리거 (토큰 등록 시)

CI/CD 실패 시 GitHub Actions 로그와 ArgoCD 이벤트(`argocd app history helpernote-production`)를 확인합니다.

## 코드 리뷰 체크포인트

- 민감 정보가 하드코딩되어 있지 않은가?
- 마이그레이션/스키마 변경 시 롤백 계획이 포함되어 있는가?
- 프런트엔드 API 호출이 `NEXT_PUBLIC_API_URL`을 통해 구성되는가?
- UI 변경 시 접근성/반응형 요구 사항이 충족되는가?
- 테스트 커버리지가 추가되었거나 수동 테스트 계획이 문서화되어 있는가?
- 자동화 에이전트가 남긴 테스트 로그와 실행 방법이 충분한가?

## 배포 후 검증

1. GitHub Actions 및 ArgoCD가 성공했는지 확인
2. `https://www.example.com` 접속 후 핵심 흐름(구직자 등록 → 매칭 → 정산)을 점검
3. MinIO 업로드/다운로드 확인
4. `kubectl logs -n helpernote deployment/prod-backend` 에 에러 로그가 없는지 확인
5. `scripts/post-deploy-smoke.sh` (존재 시) 실행

## 정기 점검

- **주간**: `make test`, Lighthouse 리포트, MinIO 버킷 용량 체크
- **월간**: JWT Secret/MinIO 키 로테이션, PostgreSQL 백업 복원 테스트
- **분기**: 도메인/TLS 만료일, CI/CD 시크릿, 문서 업데이트
