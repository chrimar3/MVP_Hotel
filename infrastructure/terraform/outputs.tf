# Outputs for MVP Hotel Review Generator Infrastructure

# General Information
output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "region" {
  description = "AWS region"
  value       = var.aws_region
}

# Domain and URLs
output "domain_name" {
  description = "Primary domain name"
  value       = var.domain_name
}

output "application_url" {
  description = "Application URL"
  value       = "https://${var.domain_name}"
}

output "health_check_url" {
  description = "Health check endpoint URL"
  value       = "https://${var.domain_name}/health"
}

# Load Balancer
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.alb.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = module.alb.zone_id
}

# CloudFront
output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cloudfront.distribution_id
}

# ECS
output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = module.ecs.service_name
}

output "ecs_task_definition_arn" {
  description = "ECS task definition ARN"
  value       = module.ecs.task_definition_arn
}

# Networking
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "public_subnets" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnets
}

output "private_subnets" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnets
}

# Database (if enabled)
output "database_endpoint" {
  description = "RDS database endpoint"
  value       = var.enable_database ? module.rds[0].endpoint : null
  sensitive   = true
}

output "database_port" {
  description = "RDS database port"
  value       = var.enable_database ? module.rds[0].port : null
}

# Redis (if enabled)
output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = var.enable_redis ? module.redis[0].endpoint : null
  sensitive   = true
}

output "redis_port" {
  description = "ElastiCache Redis port"
  value       = var.enable_redis ? module.redis[0].port : null
}

# S3
output "s3_bucket_name" {
  description = "S3 bucket name for static assets"
  value       = module.s3.bucket_name
}

output "s3_bucket_domain_name" {
  description = "S3 bucket domain name"
  value       = module.s3.bucket_domain_name
}

# SSL Certificates
output "certificate_arn" {
  description = "SSL certificate ARN for ALB"
  value       = module.acm.certificate_arn
  sensitive   = true
}

output "cloudfront_certificate_arn" {
  description = "SSL certificate ARN for CloudFront"
  value       = module.acm_cloudfront.certificate_arn
  sensitive   = true
}

# Secrets Manager
output "secrets_manager_arn" {
  description = "Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.app_secrets.arn
  sensitive   = true
}

# Monitoring
output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = module.monitoring.dashboard_url
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = module.monitoring.sns_topic_arn
}

# Security
output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = module.waf.web_acl_arn
}

# Container Registry
output "container_registry_url" {
  description = "Container registry URL"
  value       = "ghcr.io/chrimar3/mvp_hotel"
}

# Deploy Commands
output "deploy_commands" {
  description = "Useful commands for deployment"
  value = {
    "docker_build"   = "docker build -t ${var.container_image} ."
    "docker_push"    = "docker push ${var.container_image}"
    "ecs_update"     = "aws ecs update-service --cluster ${module.ecs.cluster_name} --service ${module.ecs.service_name} --force-new-deployment"
    "invalidate_cdn" = "aws cloudfront create-invalidation --distribution-id ${module.cloudfront.distribution_id} --paths '/*'"
  }
}

# Environment Variables for Application
output "application_environment_variables" {
  description = "Environment variables to set in ECS task definition"
  value = {
    NODE_ENV               = var.environment
    AWS_REGION            = var.aws_region
    SECRETS_MANAGER_ARN   = aws_secretsmanager_secret.app_secrets.arn
    REDIS_ENDPOINT        = var.enable_redis ? module.redis[0].endpoint : ""
    DATABASE_ENDPOINT     = var.enable_database ? module.rds[0].endpoint : ""
    CLOUDFRONT_DOMAIN     = module.cloudfront.domain_name
    S3_BUCKET            = module.s3.bucket_name
  }
  sensitive = true
}

# Terraform State Information
output "terraform_state_info" {
  description = "Information about Terraform state"
  value = {
    account_id = data.aws_caller_identity.current.account_id
    region     = var.aws_region
    workspace  = terraform.workspace
  }
}