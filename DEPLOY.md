# Helpernote Deployment Guide

## 🚀 Quick Deployment Steps

### Prerequisites
- ✅ Kong Gateway installed
- ✅ ArgoCD installed
- ✅ SSL/TLS certificates configured
- ✅ Domain DNS configured:
  - `www.helpernote.com` → Your cluster IP
  - `api.helpernote.com` → Your cluster IP

---

## 📋 Step 1: Initialize Git Repository

```bash
cd /Users/lmuffin/Documents/Workspace/helpernote

# Initialize Git
git init
git branch -M main

# Add all files
git add .

# Create initial commit
git commit -m "chore: initial commit - helpernote v1.0

- Backend (Rust/Axum) with PostgreSQL and MinIO
- Frontend (Next.js 15) with shadcn/ui
- K8s manifests with Kong Ingress
- ArgoCD GitOps configuration
- GitHub Actions CI/CD pipeline
"
```

---

## 📋 Step 2: Create GitHub Repository

### Option A: GitHub CLI
```bash
gh repo create e16tae/helpernote --public --source=. --remote=origin
```

### Option B: GitHub Web UI
1. Go to https://github.com/new
2. Repository name: `helpernote`
3. Owner: `e16tae`
4. Visibility: **Public** (for ghcr.io)
5. **DO NOT** initialize with README
6. Click "Create repository"

Then connect:
```bash
git remote add origin https://github.com/e16tae/helpernote.git
```

---

## 📋 Step 3: Push Code to GitHub

```bash
# Push to GitHub
git push -u origin main
```

---

## 📋 Step 4: Configure GitHub Container Registry

### Enable GitHub Packages
1. Go to repository Settings → Packages
2. Enable "Improved container support"
3. Ensure GitHub Actions has **write** permissions:
   - Settings → Actions → General
   - Workflow permissions → **Read and write permissions**

---

## 📋 Step 5: Build and Push Docker Images

### Manual Build (First Time)
```bash
# Build backend image
docker build -t ghcr.io/e16tae/helpernote-backend:latest ./backend
docker push ghcr.io/e16tae/helpernote-backend:latest

# Build frontend image
docker build -t ghcr.io/e16tae/helpernote-frontend:latest \
  --build-arg NEXT_PUBLIC_API_URL=https://api.helpernote.com \
  ./frontend
docker push ghcr.io/e16tae/helpernote-frontend:latest
```

**Note:** After first push to `main` branch, GitHub Actions will automatically build and push images.

---

## 📋 Step 6: Apply Kubernetes Secrets

```bash
# Apply secrets to cluster
kubectl apply -f k8s/base/secrets.yaml

# Verify secrets were created
kubectl get secrets -n helpernote
```

**🔐 Important Security Notes:**
- The `secrets.yaml` file contains **production secrets**
- Consider using **Sealed Secrets** or **External Secrets Operator** for better security
- **DO NOT** commit secrets to public repositories in production

**Generated Secrets:**
- PostgreSQL Password: `-2-CxJ73KTz59YO4LuEyDRksaywbrIvrFg5YtCROP-0`
- MinIO Access Key: `go5MhNPcqZUy_4N6RQPF2k9e7HdA42DA`
- MinIO Secret Key: `JarcVqkws74swoR9Jp5K22fMN_xS0ZigdCPz_B9BOfo`
- JWT Secret: `WVx_sXcKujymajAzrLnNs-5IKUG9kWpIc9f4mWS3lf2a4Vr1JpUfQWjsULfhy8TF`

---

## 📋 Step 7: Deploy with ArgoCD

```bash
# Apply ArgoCD application
kubectl apply -f argocd/helpernote-production.yaml

# Check ArgoCD application status
kubectl get application -n argocd

# View ArgoCD sync status
kubectl describe application helpernote-production -n argocd
```

### ArgoCD Web UI
```bash
# Port forward ArgoCD server (if not exposed)
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Access at: https://localhost:8080
# Default username: admin
# Get password:
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d && echo
```

---

## 📋 Step 8: Verify Deployment

```bash
# Check namespace
kubectl get all -n helpernote

# Check pods
kubectl get pods -n helpernote

# Expected output:
# NAME                        READY   STATUS    RESTARTS   AGE
# postgres-0                  1/1     Running   0          2m
# minio-xxx                   1/1     Running   0          2m
# backend-xxx                 1/1     Running   0          1m
# frontend-xxx                1/1     Running   0          1m

# Check services
kubectl get svc -n helpernote

# Check ingress
kubectl get ingress -n helpernote

# View logs
kubectl logs -f deployment/backend -n helpernote
kubectl logs -f deployment/frontend -n helpernote
```

---

## 📋 Step 9: Test Application

```bash
# Test frontend
curl -I https://www.helpernote.com

# Test backend API
curl https://api.helpernote.com/health

# Expected response: {"status":"healthy"}
```

---

## 🔄 Continuous Deployment Workflow

### Automatic Deployment (GitOps)
1. **Develop** → Create feature branch from `main`
2. **Commit** → Push changes to feature branch
3. **Pull Request** → Create PR to `main`
4. **CI Checks** → GitHub Actions runs tests
5. **Merge** → Merge to `main` branch
6. **CD Pipeline** → GitHub Actions builds Docker images
7. **Push Images** → Images pushed to ghcr.io
8. **Update Manifests** → Kustomization updated with new tags
9. **ArgoCD Sync** → Automatically detects changes and deploys

---

## 🛠️ Troubleshooting

### Pods not starting
```bash
kubectl describe pod <pod-name> -n helpernote
kubectl logs <pod-name> -n helpernote
```

### Database connection issues
```bash
# Check PostgreSQL
kubectl exec -it postgres-0 -n helpernote -- psql -U helpernote

# Test connection
kubectl exec -it postgres-0 -n helpernote -- \
  psql -U helpernote -d helpernote -c "SELECT version();"
```

### Ingress not working
```bash
# Check Kong Gateway
kubectl get pods -n kong

# Describe ingress
kubectl describe ingress helpernote-ingress -n helpernote

# Check Kong routes
kubectl get httproutes -A
```

### ArgoCD not syncing
```bash
# Manual sync
kubectl patch application helpernote-production -n argocd \
  --type merge -p '{"operation":{"sync":{}}}'

# Or use ArgoCD CLI
argocd app sync helpernote-production
```

---

## 📊 Monitoring

```bash
# Watch pod status
watch kubectl get pods -n helpernote

# Monitor resource usage
kubectl top pods -n helpernote
kubectl top nodes

# View events
kubectl get events -n helpernote --sort-by='.lastTimestamp'
```

---

## 🔐 Security Best Practices

1. **Secrets Management**
   - Use Sealed Secrets or External Secrets Operator
   - Rotate secrets regularly
   - Never commit secrets to Git

2. **Image Security**
   - Scan images for vulnerabilities
   - Use minimal base images
   - Keep dependencies updated

3. **Network Security**
   - Enable Kong rate limiting (configured)
   - Use Network Policies
   - Monitor access logs

4. **RBAC**
   - Limit ArgoCD permissions
   - Use service accounts with minimal permissions
   - Enable audit logging

---

## 📚 Additional Resources

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment guide
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Kong Gateway Documentation](https://docs.konghq.com/)

---

## 🎯 Next Steps

After successful deployment:
1. ✅ Configure monitoring (Prometheus + Grafana)
2. ✅ Set up log aggregation (Loki or ELK)
3. ✅ Configure backups for PostgreSQL
4. ✅ Set up alerts
5. ✅ Configure auto-scaling (HPA)

---

## 📞 Support

For issues or questions:
- Check application logs
- Review ArgoCD application status
- Consult this deployment guide
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed information
