# MVP Hotel Review Generator - Deployment Runbook

## Overview

This runbook provides step-by-step procedures for deploying, monitoring, and maintaining the MVP Hotel Review Generator application in production.

## 🚀 Deployment Procedures

### Prerequisites

- Docker and docker-compose installed
- AWS CLI configured with appropriate permissions
- Terraform installed (version >= 1.0)
- GitHub CLI (`gh`) for GitHub Actions
- Access to Cloudflare account for DNS management

### Environment Variables

```bash
# Required for production deployment
export AWS_REGION=us-east-1
export DOMAIN_NAME=mvp-hotel.example.com
export CLOUDFLARE_API_TOKEN=your_token_here
export DATABASE_PASSWORD=secure_password
export NOTIFICATION_EMAIL=admin@example.com
export OPENAI_API_KEY=your_openai_key
export ANTHROPIC_API_KEY=your_anthropic_key
export SESSION_SECRET=your_session_secret
```

## 📋 Deployment Steps

### 1. Initial Infrastructure Setup

```bash
# 1. Clone repository
git clone https://github.com/chrimar3/MVP_Hotel.git
cd MVP_Hotel

# 2. Initialize Terraform
cd terraform
terraform init

# 3. Create terraform.tfvars file
cat > terraform.tfvars <<EOF
domain_name = "your-domain.com"
cloudflare_api_token = "your_token"
notification_email = "admin@example.com"
database_password = "secure_password"
environment = "production"
EOF

# 4. Plan and apply infrastructure
terraform plan
terraform apply
```

### 2. Container Build and Push

```bash
# 1. Build Docker image
docker build -t ghcr.io/chrimar3/mvp_hotel:latest .

# 2. Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# 3. Push image
docker push ghcr.io/chrimar3/mvp_hotel:latest

# 4. Tag with version
docker tag ghcr.io/chrimar3/mvp_hotel:latest ghcr.io/chrimar3/mvp_hotel:v1.0.0
docker push ghcr.io/chrimar3/mvp_hotel:v1.0.0
```

### 3. Application Deployment

```bash
# Deploy via GitHub Actions (Recommended)
gh workflow run deploy.yml --ref main

# Or deploy manually using docker-compose
docker-compose up -d

# Check deployment status
docker-compose ps
docker-compose logs -f app
```

### 4. DNS Configuration

```bash
# Verify DNS propagation
dig your-domain.com
nslookup your-domain.com

# Test SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

## 🔧 Configuration Management

### Application Configuration

1. **Environment Variables**: Set in ECS task definition or docker-compose
2. **Secrets**: Stored in AWS Secrets Manager
3. **Feature Flags**: Configured in application configuration files

### Database Configuration

```sql
-- Create application user
CREATE USER app_user WITH PASSWORD 'secure_password';
CREATE DATABASE mvp_hotel;
GRANT ALL PRIVILEGES ON DATABASE mvp_hotel TO app_user;
```

### Redis Configuration

```bash
# Connect to Redis
redis-cli -h your-redis-endpoint.cache.amazonaws.com -p 6379

# Check Redis status
INFO
PING
```

## 📊 Monitoring and Alerting

### Health Checks

```bash
# Application health
curl -f https://your-domain.com/health

# Container health
docker ps --format "table {{.Names}}\t{{.Status}}"

# AWS ALB health
aws elbv2 describe-target-health --target-group-arn YOUR_TARGET_GROUP_ARN
```

### Log Monitoring

```bash
# Container logs
docker-compose logs -f app nginx

# AWS CloudWatch logs
aws logs tail /aws/ecs/mvp-hotel-production --follow

# Application metrics
curl https://your-domain.com/metrics
```

### Performance Monitoring

- **Grafana Dashboard**: http://your-domain.com:3001
- **Prometheus Metrics**: http://your-domain.com:9090
- **Application Insights**: Check CloudWatch dashboards

## 🔄 Rollback Procedures

### Immediate Rollback (< 5 minutes)

```bash
# 1. Identify last known good version
git log --oneline -10

# 2. Rollback via GitHub Actions
gh workflow run deploy.yml --ref PREVIOUS_COMMIT_HASH

# 3. Or rollback manually
docker pull ghcr.io/chrimar3/mvp_hotel:PREVIOUS_TAG
docker-compose down
docker-compose up -d

# 4. Verify rollback
curl -f https://your-domain.com/health
```

### Database Rollback

```bash
# 1. Stop application to prevent writes
docker-compose stop app

# 2. Restore from backup
aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier mvp-hotel-restored \
    --db-snapshot-identifier mvp-hotel-backup-TIMESTAMP

# 3. Update DNS to point to restored instance
# (Update terraform configuration and apply)

# 4. Start application
docker-compose start app
```

### Infrastructure Rollback

```bash
# 1. Identify previous terraform state
terraform state list

# 2. Plan rollback
terraform plan -var-file=terraform.tfvars.backup

# 3. Apply rollback
terraform apply -var-file=terraform.tfvars.backup

# 4. Verify infrastructure
terraform output
```

## 🚨 Incident Response

### Critical Issues (P0)

1. **Service Down**: Application completely unavailable
   ```bash
   # Check containers
   docker-compose ps
   
   # Check load balancer
   aws elbv2 describe-target-health --target-group-arn ARN
   
   # Check DNS
   dig your-domain.com
   
   # Immediate action: Rollback to last known good
   ```

2. **Database Issues**: Database connectivity problems
   ```bash
   # Check database status
   aws rds describe-db-instances --db-instance-identifier mvp-hotel-prod
   
   # Check connections
   psql -h endpoint -U app_user -d mvp_hotel -c "SELECT 1;"
   
   # Scale application to reduce load
   aws ecs update-service --cluster CLUSTER --service SERVICE --desired-count 1
   ```

### High Issues (P1)

1. **High Error Rate**: >5% 5xx errors
2. **High Response Time**: >2 seconds average
3. **Resource Exhaustion**: CPU/Memory >85%

### Medium Issues (P2)

1. **Cache Issues**: Redis connectivity problems
2. **Minor Performance Degradation**: Slower than normal
3. **Non-critical Feature Failures**: Specific features not working

## 📈 Scaling Procedures

### Horizontal Scaling

```bash
# Scale ECS service
aws ecs update-service \
    --cluster mvp-hotel-production \
    --service mvp-hotel-app \
    --desired-count 5

# Scale via terraform
terraform apply -var="desired_count=5"
```

### Vertical Scaling

```bash
# Update task definition with more resources
# Then update service to use new task definition
aws ecs update-service \
    --cluster mvp-hotel-production \
    --service mvp-hotel-app \
    --task-definition mvp-hotel-app:NEW_REVISION
```

### Database Scaling

```bash
# Scale RDS instance
aws rds modify-db-instance \
    --db-instance-identifier mvp-hotel-prod \
    --db-instance-class db.t3.medium \
    --apply-immediately
```

## 🔐 Security Procedures

### SSL Certificate Renewal

```bash
# Check certificate expiry
echo | openssl s_client -servername your-domain.com -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates

# AWS Certificate Manager auto-renews, but verify
aws acm describe-certificate --certificate-arn YOUR_CERT_ARN
```

### Security Updates

```bash
# Update base images
docker pull nginx:1.25-alpine
docker pull node:20-alpine

# Rebuild application with latest base images
docker build --no-cache -t ghcr.io/chrimar3/mvp_hotel:security-patch .

# Deploy security patch
gh workflow run deploy.yml
```

### Access Control

1. **IAM Roles**: Review and update quarterly
2. **Security Groups**: Audit firewall rules
3. **Secrets Rotation**: Rotate secrets monthly

## 📝 Maintenance Tasks

### Daily

- [ ] Check application health endpoint
- [ ] Review error logs
- [ ] Monitor key metrics (response time, error rate)
- [ ] Verify backups completed

### Weekly

- [ ] Review performance metrics
- [ ] Check disk space and resource usage
- [ ] Update security patches
- [ ] Review and rotate logs

### Monthly

- [ ] Security audit
- [ ] Performance optimization review
- [ ] Backup restore testing
- [ ] Documentation updates
- [ ] Dependency updates

### Quarterly

- [ ] Disaster recovery testing
- [ ] Security penetration testing
- [ ] Performance benchmarking
- [ ] Infrastructure review
- [ ] Cost optimization review

## 📞 Emergency Contacts

| Role | Name | Phone | Email | Escalation |
|------|------|-------|--------|------------|
| Primary On-Call | DevOps Lead | +1-xxx-xxx-xxxx | devops@example.com | 15 min |
| Secondary On-Call | Backend Lead | +1-xxx-xxx-xxxx | backend@example.com | 30 min |
| Management | Engineering Manager | +1-xxx-xxx-xxxx | mgmt@example.com | 1 hour |

## 🔗 Useful Links

- **Application**: https://your-domain.com
- **Health Check**: https://your-domain.com/health
- **Monitoring**: https://your-domain.com:3001 (Grafana)
- **Metrics**: https://your-domain.com:9090 (Prometheus)
- **GitHub Repository**: https://github.com/chrimar3/MVP_Hotel
- **AWS Console**: https://console.aws.amazon.com
- **Cloudflare Dashboard**: https://dash.cloudflare.com

## 📚 Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Terraform Documentation](https://www.terraform.io/docs/)
- [Prometheus Monitoring](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)

---

**Last Updated**: 2024-01-XX  
**Version**: 1.0  
**Maintained By**: DevOps Team