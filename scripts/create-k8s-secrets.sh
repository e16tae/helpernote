#!/bin/bash
# Kubernetes Secrets 일괄 생성 스크립트
# 프로덕션 환경에 필요한 모든 Secrets를 안전하게 생성합니다.

set -euo pipefail

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 설정
NAMESPACE="${NAMESPACE:-helpernote}"
CONTEXT="${KUBE_CONTEXT:-$(kubectl config current-context)}"
POSTGRES_HOST="${POSTGRES_HOST:-prod-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DATABASE="${POSTGRES_DATABASE:-helpernote}"
POSTGRES_USERNAME="${POSTGRES_USERNAME:-helpernote}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Helpernote Kubernetes Secrets Generator              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 현재 컨텍스트 확인
echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  Namespace:       $NAMESPACE"
echo "  Context:         $CONTEXT"
echo "  PostgreSQL Host: $POSTGRES_HOST"
echo ""

read -p "Continue with these settings? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Aborted.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔐 Generating secure credentials...${NC}"

# 1. PostgreSQL Password
DB_PASSWORD=$(openssl rand -base64 32)
echo -e "${GREEN}✓${NC} PostgreSQL password generated (32 bytes)"

# 2. MinIO Credentials
MINIO_ACCESS_KEY=$(openssl rand -base64 15 | tr -d '/+=' | head -c 20)
MINIO_SECRET_KEY=$(openssl rand -base64 30 | tr -d '/+=' | head -c 40)
echo -e "${GREEN}✓${NC} MinIO credentials generated"

# 3. JWT Secret
JWT_SECRET=$(openssl rand -base64 48)
echo -e "${GREEN}✓${NC} JWT secret generated (64 bytes)"

# 4. Database URL
DATABASE_URL="postgresql://${POSTGRES_USERNAME}:${DB_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DATABASE}"
echo -e "${GREEN}✓${NC} Database URL constructed"

echo ""
echo -e "${BLUE}📦 Creating Kubernetes resources...${NC}"

# Namespace 생성 (이미 있으면 스킵)
if kubectl get namespace "$NAMESPACE" --context="$CONTEXT" &> /dev/null; then
    echo -e "${YELLOW}⚠${NC}  Namespace '$NAMESPACE' already exists (skipping)"
else
    kubectl create namespace "$NAMESPACE" --context="$CONTEXT"
    echo -e "${GREEN}✓${NC} Namespace '$NAMESPACE' created"
fi

echo ""
echo -e "${BLUE}🔑 Creating secrets...${NC}"

# Secret 1: postgres-secret
if kubectl get secret postgres-secret -n "$NAMESPACE" --context="$CONTEXT" &> /dev/null; then
    read -p "Secret 'postgres-secret' already exists. Overwrite? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}⚠${NC}  Skipping postgres-secret"
    else
        kubectl create secret generic postgres-secret \
          --from-literal=database="$POSTGRES_DATABASE" \
          --from-literal=username="$POSTGRES_USERNAME" \
          --from-literal=password="$DB_PASSWORD" \
          --namespace="$NAMESPACE" \
          --context="$CONTEXT" \
          --dry-run=client -o yaml | kubectl apply -f -
        echo -e "${GREEN}✓${NC} postgres-secret updated"
    fi
else
    kubectl create secret generic postgres-secret \
      --from-literal=database="$POSTGRES_DATABASE" \
      --from-literal=username="$POSTGRES_USERNAME" \
      --from-literal=password="$DB_PASSWORD" \
      --namespace="$NAMESPACE" \
      --context="$CONTEXT"
    echo -e "${GREEN}✓${NC} postgres-secret created"
fi

# Secret 2: minio-secret
if kubectl get secret minio-secret -n "$NAMESPACE" --context="$CONTEXT" &> /dev/null; then
    read -p "Secret 'minio-secret' already exists. Overwrite? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}⚠${NC}  Skipping minio-secret"
    else
        kubectl create secret generic minio-secret \
          --from-literal=access-key="$MINIO_ACCESS_KEY" \
          --from-literal=secret-key="$MINIO_SECRET_KEY" \
          --namespace="$NAMESPACE" \
          --context="$CONTEXT" \
          --dry-run=client -o yaml | kubectl apply -f -
        echo -e "${GREEN}✓${NC} minio-secret updated"
    fi
else
    kubectl create secret generic minio-secret \
      --from-literal=access-key="$MINIO_ACCESS_KEY" \
      --from-literal=secret-key="$MINIO_SECRET_KEY" \
      --namespace="$NAMESPACE" \
      --context="$CONTEXT"
    echo -e "${GREEN}✓${NC} minio-secret created"
fi

# Secret 3: backend-secret
if kubectl get secret backend-secret -n "$NAMESPACE" --context="$CONTEXT" &> /dev/null; then
    read -p "Secret 'backend-secret' already exists. Overwrite? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}⚠${NC}  Skipping backend-secret"
    else
        kubectl create secret generic backend-secret \
          --from-literal=database-url="$DATABASE_URL" \
          --from-literal=jwt-secret="$JWT_SECRET" \
          --namespace="$NAMESPACE" \
          --context="$CONTEXT" \
          --dry-run=client -o yaml | kubectl apply -f -
        echo -e "${GREEN}✓${NC} backend-secret updated"
    fi
else
    kubectl create secret generic backend-secret \
      --from-literal=database-url="$DATABASE_URL" \
      --from-literal=jwt-secret="$JWT_SECRET" \
      --namespace="$NAMESPACE" \
      --context="$CONTEXT"
    echo -e "${GREEN}✓${NC} backend-secret created"
fi

echo ""
echo -e "${GREEN}✅ All secrets created successfully!${NC}"
echo ""

# 생성된 Secrets 목록 표시
echo -e "${BLUE}📋 Created secrets:${NC}"
kubectl get secrets -n "$NAMESPACE" --context="$CONTEXT" | grep -E "postgres-secret|minio-secret|backend-secret" || true

echo ""
echo -e "${RED}⚠️  IMPORTANT: Save these credentials securely!${NC}"
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PostgreSQL Password:${NC} $DB_PASSWORD"
echo -e "${YELLOW}MinIO Access Key:   ${NC} $MINIO_ACCESS_KEY"
echo -e "${YELLOW}MinIO Secret Key:   ${NC} $MINIO_SECRET_KEY"
echo -e "${YELLOW}JWT Secret:         ${NC} $JWT_SECRET"
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}💾 Action required:${NC}"
echo "  1. Store these in your password manager (e.g., 1Password, LastPass)"
echo "  2. Delete this terminal output after saving"
echo "  3. If output was saved to a file, use: shred -u filename"
echo ""
echo -e "${BLUE}🔍 To verify secrets:${NC}"
echo "  kubectl get secret postgres-secret -n $NAMESPACE -o yaml"
echo "  kubectl get secret backend-secret -n $NAMESPACE -o jsonpath='{.data.jwt-secret}' | base64 -d"
echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
