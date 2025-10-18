# Monitoring Setup

This directory contains Kubernetes manifests for monitoring Helpernote with Prometheus and Grafana.

## Prerequisites

1. **Prometheus Operator** installed in your cluster:
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/bundle.yaml
   ```

2. **kube-prometheus-stack** (includes Prometheus, Grafana, and Alertmanager):
   ```bash
   helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
   helm repo update
   helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
     --namespace monitoring --create-namespace
   ```

## Installation

1. Apply the monitoring manifests:
   ```bash
   kubectl apply -f k8s/monitoring/
   ```

2. Verify ServiceMonitor is created:
   ```bash
   kubectl get servicemonitor -n helpernote
   ```

3. Check Prometheus targets:
   ```bash
   kubectl port-forward -n monitoring svc/kube-prometheus-stack-prometheus 9090:9090
   # Open http://localhost:9090/targets
   ```

4. Access Grafana:
   ```bash
   kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 3000:80
   # Open http://localhost:3000
   # Default credentials: admin/prom-operator
   ```

## Dashboards

The Grafana dashboard will be automatically imported if you have the `grafana_dashboard` label selector configured.

Alternatively, manually import `grafana-dashboard.yaml` in Grafana UI.

## Alerts

Prometheus alerts are configured in `prometheus-rules.yaml`:

- **BackendDown**: Backend pod is unreachable
- **HighErrorRate**: HTTP 5xx error rate > 5%
- **HighResponseTime**: 95th percentile response time > 1s
- **DatabaseConnectionHigh**: More than 40 database connections
- **HighMemoryUsage**: Memory usage > 90%
- **HighCPUUsage**: CPU usage > 80%

## Metrics Exposed

The backend should expose metrics on `/metrics` endpoint (port 9090):

- `http_requests_total`: Total HTTP requests
- `http_request_duration_seconds`: Request duration histogram
- `database_connections_active`: Active database connections
- `database_queries_total`: Total database queries

## Testing

Test metrics endpoint:
```bash
kubectl port-forward -n helpernote deployment/prod-backend 8000:8000
curl http://localhost:8000/metrics
```

## Troubleshooting

1. **ServiceMonitor not discovered**:
   - Check Prometheus ServiceMonitor selector
   - Verify labels match: `kubectl get servicemonitor -n helpernote -o yaml`

2. **No metrics**:
   - Verify backend metrics endpoint is accessible
   - Check Prometheus logs: `kubectl logs -n monitoring prometheus-kube-prometheus-stack-0`

3. **Dashboard not showing**:
   - Check ConfigMap labels include `grafana_dashboard: "1"`
   - Restart Grafana pod if needed
