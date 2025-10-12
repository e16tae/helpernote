# 환경 변수 설정 가이드

## 📋 목차
1. [파일 구조](#파일-구조)
2. [로컬 개발 환경](#로컬-개발-환경)
3. [프로덕션 환경](#프로덕션-환경)
4. [보안 주의사항](#보안-주의사항)

---

## 📁 파일 구조

```
helpernote/
├── backend/
│   ├── .env                 # 개발용 환경 변수 (git 추적 안함)
│   └── .env.example         # 환경 변수 템플릿 (git 추적)
├── frontend/
│   ├── .env                 # 개발용 환경 변수 (git 추적 안함)
│   ├── .env.local          # 로컬 오버라이드 (git 추적 안함, 선택사항)
│   └── .env.example         # 환경 변수 템플릿 (git 추적)
└── .env.production.example  # 프로덕션 환경 예제
```

### 파일 우선순위 (Next.js)
1. `.env.local` (최우선, 모든 환경)
2. `.env.development` / `.env.production` (환경별)
3. `.env` (기본값)

---

## 🛠️ 로컬 개발 환경

### 1단계: 백엔드 환경 변수 설정

```bash
cd backend
cp .env.example .env
```

**backend/.env** 파일 내용:
```bash
# Database
DATABASE_URL=postgres://helpernote:helpernote@localhost:5432/helpernote

# JWT
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRATION=3600

# Server
PORT=8000
RUST_LOG=debug

# MinIO
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=helpernote
```

### 2단계: 프론트엔드 환경 변수 설정

```bash
cd frontend
cp .env.example .env
```

**frontend/.env** 파일 내용:
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3단계: 개발 환경 실행

```bash
# Terminal 1: 인프라 시작
make dev-up

# Terminal 2: 백엔드 실행
cd backend && cargo run

# Terminal 3: 프론트엔드 실행
cd frontend && npm run dev
```

---

## 🚀 프로덕션 환경

### Docker Compose

**docker-compose.prod.yml**:
```yaml
services:
  backend:
    image: ghcr.io/yourorg/helpernote-backend:latest
    environment:
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRATION: 3600
      PORT: 8000
      RUST_LOG: info
      MINIO_ENDPOINT: http://minio:9000
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY}
      MINIO_BUCKET: helpernote

  frontend:
    image: ghcr.io/yourorg/helpernote-frontend:latest
    build:
      args:
        NEXT_PUBLIC_API_URL: https://api.helpernote.my
```

### Kubernetes

**backend-secrets.yaml**:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: helpernote-backend-secrets
type: Opaque
stringData:
  DATABASE_URL: postgres://user:pass@postgres:5432/helpernote
  JWT_SECRET: your-production-secret
  MINIO_ACCESS_KEY: your-access-key
  MINIO_SECRET_KEY: your-secret-key
```

**backend-deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: helpernote-backend
spec:
  template:
    spec:
      containers:
      - name: backend
        image: ghcr.io/yourorg/helpernote-backend:latest
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: helpernote-backend-secrets
              key: DATABASE_URL
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: helpernote-backend-secrets
              key: JWT_SECRET
        - name: PORT
          value: "8000"
        - name: RUST_LOG
          value: "info"
```

### GitHub Actions

**.github/workflows/cd-production.yaml**:
```yaml
- name: Build and push frontend image
  uses: docker/build-push-action@v6
  with:
    context: ./frontend
    build-args: |
      NEXT_PUBLIC_API_URL=https://api.helpernote.my
    push: true
    tags: ghcr.io/${{ github.repository }}/helpernote-frontend:latest
```

---

## 🔒 보안 주의사항

### ❌ 절대 금지
1. **실제 프로덕션 값을 git에 커밋하지 마세요**
   - `.env` 파일은 `.gitignore`에 포함되어 있습니다
   - 실수로 커밋한 경우 즉시 비밀번호를 변경하세요

2. **JWT_SECRET은 반드시 변경**
   - 프로덕션에서 기본값 사용 금지
   - 강력한 랜덤 문자열 생성:
     ```bash
     openssl rand -base64 32
     ```

3. **데이터베이스 비밀번호 강화**
   - 개발: `helpernote/helpernote` (OK)
   - 프로덕션: 강력한 비밀번호 필수

### ✅ 권장사항

1. **환경별 비밀 관리**
   - 개발: `.env` 파일 (로컬만)
   - 스테이징: Kubernetes Secrets
   - 프로덕션: Kubernetes Secrets + Vault

2. **비밀 로테이션**
   - JWT_SECRET: 정기적으로 변경
   - DB 비밀번호: 90일마다 변경
   - API 키: 사용 추적 및 필요시 교체

3. **접근 제어**
   - Kubernetes Secrets: RBAC 설정
   - MinIO/S3: IAM 정책 최소 권한 원칙
   - 데이터베이스: 읽기/쓰기 분리

---

## 🧪 환경 변수 검증

### 백엔드 (자동 검증)
Rust 코드에서 필수 환경 변수 자동 검증:
```rust
// backend/src/config.rs
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    // ...
}

impl Config {
    pub fn from_env() -> Result<Self> {
        dotenv::dotenv().ok();

        Ok(Config {
            database_url: env::var("DATABASE_URL")
                .expect("DATABASE_URL must be set"),
            jwt_secret: env::var("JWT_SECRET")
                .expect("JWT_SECRET must be set"),
            // ...
        })
    }
}
```

### 프론트엔드 (자동 검증)
Zod 스키마로 런타임 검증:
```typescript
// frontend/src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .url('NEXT_PUBLIC_API_URL must be a valid URL')
    .default('http://localhost:8000'),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});
```

---

## 📝 체크리스트

### 로컬 개발 시작 전
- [ ] `backend/.env` 파일 생성
- [ ] `frontend/.env` 파일 생성
- [ ] PostgreSQL 및 MinIO 실행 (`make dev-up`)
- [ ] 환경 변수 로드 확인

### 프로덕션 배포 전
- [ ] JWT_SECRET 강력한 값으로 변경
- [ ] 데이터베이스 비밀번호 변경
- [ ] NEXT_PUBLIC_API_URL 프로덕션 도메인 설정
- [ ] MinIO/S3 접근 키 설정
- [ ] Kubernetes Secrets 생성
- [ ] 환경 변수 검증 통과 확인

### 보안 감사
- [ ] `.env` 파일이 git에 커밋되지 않았는지 확인
- [ ] GitHub Secrets에 민감한 정보 저장
- [ ] 프로덕션 로그에 비밀 정보 노출 여부 확인
- [ ] 접근 제어 정책 검토

---

## 🆘 문제 해결

### 환경 변수가 로드되지 않을 때

**증상**: "environment variable not found" 에러

**해결**:
1. `.env` 파일 존재 확인
2. 변수명 오타 확인 (대소문자 구분)
3. Next.js: `NEXT_PUBLIC_` 접두사 확인
4. 서버 재시작

### CORS 에러

**증상**: "Access to fetch has been blocked by CORS policy"

**해결**:
```bash
# frontend/.env
NEXT_PUBLIC_API_URL=http://localhost:8000  # 포트 확인
```

백엔드에서 CORS 허용 확인:
```rust
// backend/src/main.rs
.layer(
    CorsLayer::new()
        .allow_origin(/* frontend URL */)
        .allow_methods(/* methods */)
)
```

### Docker 빌드 시 환경 변수 없음

**증상**: Docker 컨테이너에서 변수 접근 불가

**해결**:
```dockerfile
# Dockerfile
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
```

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=https://api.example.com
```

---

## 📚 참고 자료

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [12 Factor App - Config](https://12factor.net/config)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
