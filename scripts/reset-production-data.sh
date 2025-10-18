#!/bin/bash
# Reset production data (PostgreSQL + MinIO) in Kubernetes
# Usage: ./scripts/reset-production-data.sh <namespace>
#
# ⚠️  EXTREME CAUTION: This script PERMANENTLY DELETES production data!
#
# Prerequisites:
# - kubectl configured and authenticated
# - Backup completed and verified
# - Approval from team lead/manager

set -e

NAMESPACE="${1}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Usage message
usage() {
    echo "Usage: $0 <namespace>"
    echo ""
    echo "Example:"
    echo "  $0 helpernote-staging    # Reset staging environment"
    echo "  $0 helpernote-prod       # Reset production environment"
    echo ""
    echo "⚠️  WARNING: This will DELETE ALL production data!"
    exit 1
}

# Check if namespace provided
if [ -z "$NAMESPACE" ]; then
    echo -e "${RED}Error: Namespace not specified${NC}"
    usage
fi

echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║                                                            ║${NC}"
echo -e "${RED}║       PRODUCTION DATA RESET - EXTREME CAUTION              ║${NC}"
echo -e "${RED}║                                                            ║${NC}"
echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Verify kubectl access
echo -e "${BLUE}[1/9] Verifying kubectl access...${NC}"
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}Error: Cannot connect to Kubernetes cluster${NC}"
    echo "Please check your kubeconfig and authentication"
    exit 1
fi
echo -e "${GREEN}✓ kubectl access verified${NC}"
echo ""

# 2. Verify namespace exists
echo -e "${BLUE}[2/9] Verifying namespace: $NAMESPACE${NC}"
if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
    echo -e "${RED}Error: Namespace '$NAMESPACE' does not exist${NC}"
    echo "Available namespaces:"
    kubectl get namespaces
    exit 1
fi
echo -e "${GREEN}✓ Namespace exists${NC}"
echo ""

# 3. Show current resources
echo -e "${BLUE}[3/9] Current resources in namespace '$NAMESPACE':${NC}"
echo ""
echo -e "${YELLOW}Deployments:${NC}"
kubectl get deployments -n "$NAMESPACE" 2>/dev/null || echo "  None"
echo ""
echo -e "${YELLOW}StatefulSets:${NC}"
kubectl get statefulsets -n "$NAMESPACE" 2>/dev/null || echo "  None"
echo ""
echo -e "${YELLOW}PersistentVolumeClaims:${NC}"
kubectl get pvc -n "$NAMESPACE" 2>/dev/null || echo "  None"
echo ""
echo -e "${YELLOW}Pods:${NC}"
kubectl get pods -n "$NAMESPACE" 2>/dev/null || echo "  None"
echo ""

# 4. First confirmation
echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
echo -e "${RED}                    FIRST CONFIRMATION                       ${NC}"
echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}This action will PERMANENTLY DELETE:${NC}"
echo "  ❌ All database tables and records"
echo "  ❌ All uploaded files in MinIO"
echo "  ❌ All Kubernetes PersistentVolumeClaims"
echo "  ❌ All user accounts and data"
echo ""
echo -e "${MAGENTA}Environment: $NAMESPACE${NC}"
echo ""
read -p "Type the namespace name to confirm (${NAMESPACE}): " -r
echo ""
if [ "$REPLY" != "$NAMESPACE" ]; then
    echo -e "${YELLOW}Cancelled - namespace mismatch${NC}"
    exit 0
fi

# 5. Backup verification
echo -e "${BLUE}[4/9] Backup verification${NC}"
echo ""
echo -e "${YELLOW}Have you completed and VERIFIED a backup?${NC}"
echo "Required backups:"
echo "  1. PostgreSQL database dump"
echo "  2. MinIO bucket backup"
echo "  3. Kubernetes resource manifests"
echo ""
read -p "Have you completed and verified all backups? (yes/no): " -r
echo ""
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${RED}STOPPED - Please complete backups before proceeding${NC}"
    echo ""
    echo "Backup commands:"
    echo "  # PostgreSQL backup"
    echo "  kubectl exec -n $NAMESPACE <postgres-pod> -- pg_dump -U helpernote helpernote > backup.sql"
    echo ""
    echo "  # MinIO backup"
    echo "  mc mirror <source>/<bucket> <backup-location>"
    echo ""
    echo "  # K8s resources backup"
    echo "  kubectl get all,pvc,secrets,configmaps -n $NAMESPACE -o yaml > k8s-backup.yaml"
    exit 0
fi

# 6. Second confirmation (require exact phrase)
echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
echo -e "${RED}                   SECOND CONFIRMATION                       ${NC}"
echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${RED}This is your LAST CHANCE to cancel!${NC}"
echo ""
echo -e "${YELLOW}Type EXACTLY: 'I understand this will delete all data in $NAMESPACE'${NC}"
read -p "> " -r
echo ""
EXPECTED="I understand this will delete all data in $NAMESPACE"
if [ "$REPLY" != "$EXPECTED" ]; then
    echo -e "${YELLOW}Cancelled - confirmation phrase mismatch${NC}"
    exit 0
fi

# 7. Scale down deployments
echo -e "${BLUE}[5/9] Scaling down deployments...${NC}"
DEPLOYMENTS=$(kubectl get deployments -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}')
if [ -n "$DEPLOYMENTS" ]; then
    for deploy in $DEPLOYMENTS; do
        echo "  Scaling down: $deploy"
        kubectl scale deployment "$deploy" -n "$NAMESPACE" --replicas=0
    done
    echo -e "${GREEN}✓ Deployments scaled down${NC}"
else
    echo "  No deployments found"
fi
echo ""

# 8. Delete StatefulSets (if any)
echo -e "${BLUE}[6/9] Scaling down StatefulSets...${NC}"
STATEFULSETS=$(kubectl get statefulsets -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}')
if [ -n "$STATEFULSETS" ]; then
    for sts in $STATEFULSETS; do
        echo "  Scaling down: $sts"
        kubectl scale statefulset "$sts" -n "$NAMESPACE" --replicas=0
    done
    echo -e "${GREEN}✓ StatefulSets scaled down${NC}"
else
    echo "  No StatefulSets found"
fi
echo ""

# 9. Wait for pods to terminate
echo -e "${BLUE}[7/9] Waiting for pods to terminate...${NC}"
kubectl wait --for=delete pod --all -n "$NAMESPACE" --timeout=120s 2>/dev/null || true
sleep 5
echo -e "${GREEN}✓ Pods terminated${NC}"
echo ""

# 10. Delete PersistentVolumeClaims
echo -e "${BLUE}[8/9] Deleting PersistentVolumeClaims...${NC}"
PVCS=$(kubectl get pvc -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}')
if [ -n "$PVCS" ]; then
    for pvc in $PVCS; do
        echo "  Deleting PVC: $pvc"
        kubectl delete pvc "$pvc" -n "$NAMESPACE" --wait=false
    done
    echo "  Waiting for PVC deletion..."
    kubectl wait --for=delete pvc --all -n "$NAMESPACE" --timeout=300s 2>/dev/null || true
    echo -e "${GREEN}✓ PVCs deleted${NC}"
else
    echo "  No PVCs found"
fi
echo ""

# 11. Scale up deployments
echo -e "${BLUE}[9/9] Scaling up deployments...${NC}"
if [ -n "$DEPLOYMENTS" ]; then
    for deploy in $DEPLOYMENTS; do
        # Get original replica count from deployment spec (default to 1)
        REPLICAS=$(kubectl get deployment "$deploy" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "1")
        if [ "$REPLICAS" = "0" ] || [ -z "$REPLICAS" ]; then
            REPLICAS=1
        fi
        echo "  Scaling up: $deploy to $REPLICAS replicas"
        kubectl scale deployment "$deploy" -n "$NAMESPACE" --replicas="$REPLICAS"
    done
fi

if [ -n "$STATEFULSETS" ]; then
    for sts in $STATEFULSETS; do
        REPLICAS=$(kubectl get statefulset "$sts" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "1")
        if [ "$REPLICAS" = "0" ] || [ -z "$REPLICAS" ]; then
            REPLICAS=1
        fi
        echo "  Scaling up: $sts to $REPLICAS replicas"
        kubectl scale statefulset "$sts" -n "$NAMESPACE" --replicas="$REPLICAS"
    done
fi
echo ""

# 12. Wait for pods to be ready
echo "Waiting for pods to be ready..."
sleep 10
kubectl wait --for=condition=ready pod --all -n "$NAMESPACE" --timeout=300s 2>/dev/null || true
echo ""

# 13. Show final status
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║            PRODUCTION DATA RESET COMPLETE                  ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Final resource status:${NC}"
kubectl get pods,pvc -n "$NAMESPACE"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Verify pods are running and healthy"
echo "  2. Run database migrations:"
echo "     kubectl exec -n $NAMESPACE <backend-pod> -- ./migrate"
echo ""
echo "  3. Create MinIO bucket (if needed):"
echo "     kubectl exec -n $NAMESPACE <minio-pod> -- mc mb /data/helpernote"
echo ""
echo "  4. Create initial admin user"
echo "  5. Verify application functionality"
echo "  6. Update monitoring alerts"
echo ""
echo -e "${MAGENTA}Backup reminder:${NC}"
echo "  Make sure you have saved the backup files in a secure location!"
echo ""
