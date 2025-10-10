# Deployment Checklist

배포 전후 확인해야 할 항목들입니다.

## Pre-Deployment Checklist

### 1. Code Quality
- [x] TypeScript 타입 에러 없음
- [x] Rust rustfmt 통과
- [x] Rust clippy 경고 없음 (또는 허용 가능)
- [x] 로컬 빌드 성공
- [x] 코드 커밋 및 푸시

### 2. Tests
- [ ] Backend 유닛 테스트 통과
- [ ] Frontend 컴파일 성공
- [ ] Docker 이미지 빌드 성공

### 3. Configuration
- [ ] 환경 변수 검증
- [ ] 시크릿 설정 확인
- [ ] ConfigMap 업데이트

### 4. Database
- [ ] 마이그레이션 스크립트 준비
- [ ] 백업 완료
- [ ] 롤백 계획 수립

## Kubernetes Secrets & ConfigMap Checklist

### ConfigMap (app-config)
```bash
kubectl get configmap app-config -n helpernote -o yaml
```

Required keys:
- [ ] `BACKEND_PORT`: 8000
- [ ] `FRONTEND_PORT`: 3000
- [ ] `NODE_ENV`: production
- [ ] `RUST_LOG`: info
- [ ] `JWT_EXPIRATION`: 86400
- [ ] `API_URL`: https://api.helpernote.com
- [ ] `MINIO_ENDPOINT`: http://minio:9000
- [ ] `MINIO_BUCKET`: helpernote

### Backend Secrets (backend-secret)
```bash
kubectl get secret backend-secret -n helpernote
```

Required keys:
- [ ] `database-url`: PostgreSQL connection string
  - Format: `postgresql://user:password@host:5432/dbname`
- [ ] `jwt-secret`: Random secure string (min 32 characters)

### MinIO Secrets (minio-secret)
```bash
kubectl get secret minio-secret -n helpernote
```

Required keys:
- [ ] `access-key`: MinIO access key
- [ ] `secret-key`: MinIO secret key

### Creating Secrets (if not exists)
```bash
# Backend Secret
kubectl create secret generic backend-secret \
  --from-literal=database-url='postgresql://helpernote:PASSWORD@postgres:5432/helpernote' \
  --from-literal=jwt-secret='YOUR_RANDOM_JWT_SECRET_MIN_32_CHARS' \
  -n helpernote

# MinIO Secret
kubectl create secret generic minio-secret \
  --from-literal=access-key='minio' \
  --from-literal=secret-key='minio123' \
  -n helpernote
```

## GitHub Actions Checklist

### CI Workflow (develop branch)
- [x] rustfmt check 통과
- [ ] clippy check 통과
- [ ] Backend tests 통과
- [ ] Frontend lint 통과
- [ ] Frontend build 통과
- [ ] Docker build test 성공

### CD Workflow (main branch)
- [ ] Backend Docker image pushed
- [ ] Frontend Docker image pushed
- [ ] Kubernetes manifests updated
- [ ] ArgoCD sync triggered

## ArgoCD Deployment Checklist

### Before Sync
```bash
# Check ArgoCD application status
argocd app get helpernote-production

# Check current resources
kubectl get all -n helpernote
```

### During Sync
- [ ] ArgoCD detects changes
- [ ] Sync starts automatically
- [ ] No sync errors

### After Sync
- [ ] All pods running
- [ ] Services accessible
- [ ] Ingress configured
- [ ] Health checks passing

## Post-Deployment Verification

### 1. Pods Status
```bash
# Check all pods are running
kubectl get pods -n helpernote

# Expected output:
# - backend pods: 3/3 Running
# - frontend pods: 3/3 Running
# - postgres pod: 1/1 Running
# - minio pod: 1/1 Running
```

### 2. Services
```bash
# Check services
kubectl get svc -n helpernote

# Expected services:
# - backend (ClusterIP)
# - frontend (ClusterIP)
# - postgres (ClusterIP)
# - minio (ClusterIP)
```

### 3. Ingress
```bash
# Check ingress
kubectl get ingress -n helpernote

# Expected hosts:
# - api.helpernote.com → backend:8000
# - www.helpernote.com → frontend:3000
```

### 4. Health Endpoints
```bash
# Backend health
curl https://api.helpernote.com/health
# Expected: {"status":"healthy"}

# Frontend health
curl https://www.helpernote.com/api/health
# Expected: {"status":"ok"}
```

### 5. Logs Check
```bash
# Backend logs (check for errors)
kubectl logs -n helpernote -l app=backend --tail=50

# Frontend logs (check for errors)
kubectl logs -n helpernote -l app=frontend --tail=50

# Check for common issues:
# - Database connection errors
# - MinIO connection errors
# - JWT configuration errors
# - Port binding errors
```

### 6. Database Connectivity
```bash
# Test database connection from backend pod
kubectl exec -n helpernote -it deployment/backend -- \
  psql $DATABASE_URL -c "SELECT 1;"
```

### 7. MinIO Connectivity
```bash
# Check MinIO is accessible
kubectl port-forward -n helpernote svc/minio 9000:9000

# Access MinIO console
# http://localhost:9000
```

## Functional Testing

### Manual Tests
- [ ] Login with test credentials
- [ ] Create new customer
- [ ] View customer list
- [ ] Upload profile photo
- [ ] Create job posting
- [ ] Create matching
- [ ] View dashboard

### Test Credentials
```
Username: admin
Password: password123
```

## Performance Monitoring

### Resource Usage
```bash
# Check resource usage
kubectl top pods -n helpernote

# Backend CPU/Memory should be under limits
# Frontend CPU/Memory should be under limits
```

### Response Times
```bash
# Test backend response time
time curl -s https://api.helpernote.com/health

# Test frontend response time
time curl -s https://www.helpernote.com/api/health
```

## Rollback Procedure

If issues detected:

### Option 1: ArgoCD Rollback
```bash
# List previous revisions
argocd app history helpernote-production

# Rollback to previous revision
argocd app rollback helpernote-production <revision-number>
```

### Option 2: Git Revert
```bash
# Revert last commit
git revert HEAD
git push origin main

# ArgoCD will auto-sync to reverted state
```

### Option 3: Manual Rollback
```bash
# Scale down new deployment
kubectl scale deployment/backend -n helpernote --replicas=0
kubectl scale deployment/frontend -n helpernote --replicas=0

# Deploy previous version manually
kubectl set image deployment/backend \
  backend=ghcr.io/e16tae/helpernote-backend:previous-tag \
  -n helpernote

kubectl set image deployment/frontend \
  frontend=ghcr.io/e16tae/helpernote-frontend:previous-tag \
  -n helpernote
```

## Common Issues & Solutions

### Issue 1: Pods CrashLoopBackOff
**Symptoms**: Pods repeatedly crashing
**Check**:
```bash
kubectl describe pod <pod-name> -n helpernote
kubectl logs <pod-name> -n helpernote --previous
```
**Common Causes**:
- Database connection failure → Check DATABASE_URL secret
- MinIO connection failure → Check MINIO_* env vars
- JWT secret missing → Check backend-secret
- Port conflict → Check PORT env var

### Issue 2: Service Unavailable (503)
**Symptoms**: Ingress returns 503
**Check**:
```bash
kubectl get pods -n helpernote
kubectl get endpoints -n helpernote
```
**Common Causes**:
- Pods not ready → Check readiness probes
- Service selector mismatch → Check service/deployment labels
- Backend health check failing → Check /health endpoint

### Issue 3: Database Connection Errors
**Symptoms**: Backend logs show connection errors
**Check**:
```bash
# Verify DATABASE_URL secret
kubectl get secret backend-secret -n helpernote -o jsonpath='{.data.database-url}' | base64 -d

# Check postgres is running
kubectl get pods -n helpernote -l app=postgres

# Test connection manually
kubectl exec -n helpernote -it deployment/backend -- \
  psql $DATABASE_URL -c "SELECT version();"
```

### Issue 4: Frontend Can't Connect to Backend
**Symptoms**: Frontend shows API connection errors
**Check**:
```bash
# Check NEXT_PUBLIC_API_URL
kubectl get configmap app-config -n helpernote -o yaml | grep API_URL

# Should be: https://api.helpernote.com
# NOT: http://backend:8000 (internal address)
```

### Issue 5: Image Pull Errors
**Symptoms**: `ErrImagePull` or `ImagePullBackOff`
**Check**:
```bash
# Verify images exist in GHCR
https://github.com/e16tae?tab=packages

# Check image pull policy
kubectl get deployment backend -n helpernote -o yaml | grep imagePullPolicy

# Should be: Always
```

## Sign-off

### Deployment Team
- [ ] Developer: ______________________
- [ ] DevOps: ______________________
- [ ] QA: ______________________

### Timestamp
- Deployment Started: ______________________
- Deployment Completed: ______________________
- Verification Completed: ______________________

### Notes
```
Add any additional notes or observations here:
```

---

**Last Updated**: 2025-10-11
**Version**: 1.0
