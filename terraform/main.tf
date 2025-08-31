# Terraform configuration for MVP Hotel Review Generator
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }

  backend "s3" {
    bucket         = "mvp-hotel-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

# Configure AWS Provider
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "MVP Hotel Review Generator"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = "DevOps Team"
    }
  }
}

# Configure Cloudflare Provider
provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Local values
locals {
  name_prefix = "mvp-hotel-${var.environment}"
  
  common_tags = {
    Project     = "MVP Hotel Review Generator"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }

  # Availability zones (use first 2)
  azs = slice(data.aws_availability_zones.available.names, 0, 2)
}

# VPC and Networking
module "vpc" {
  source = "./modules/vpc"
  
  name_prefix         = local.name_prefix
  cidr                = var.vpc_cidr
  availability_zones  = local.azs
  
  tags = local.common_tags
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"
  
  name_prefix    = local.name_prefix
  vpc_id         = module.vpc.vpc_id
  public_subnets = module.vpc.public_subnets
  
  certificate_arn = module.acm.certificate_arn
  
  tags = local.common_tags
}

# ECS Cluster
module "ecs" {
  source = "./modules/ecs"
  
  name_prefix     = local.name_prefix
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
  
  alb_target_group_arn = module.alb.target_group_arn
  alb_security_group_id = module.alb.security_group_id
  
  container_image    = var.container_image
  container_port     = var.container_port
  desired_count      = var.desired_count
  
  # Auto Scaling
  min_capacity = var.min_capacity
  max_capacity = var.max_capacity
  
  tags = local.common_tags
}

# RDS Database (Optional)
module "rds" {
  source = "./modules/rds"
  count  = var.enable_database ? 1 : 0
  
  name_prefix     = local.name_prefix
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
  
  database_name = var.database_name
  username      = var.database_username
  
  tags = local.common_tags
}

# ElastiCache Redis (Optional)
module "redis" {
  source = "./modules/redis"
  count  = var.enable_redis ? 1 : 0
  
  name_prefix     = local.name_prefix
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
  
  node_type = var.redis_node_type
  
  tags = local.common_tags
}

# S3 Bucket for static assets
module "s3" {
  source = "./modules/s3"
  
  name_prefix = local.name_prefix
  domain_name = var.domain_name
  
  tags = local.common_tags
}

# CloudFront CDN
module "cloudfront" {
  source = "./modules/cloudfront"
  
  name_prefix = local.name_prefix
  domain_name = var.domain_name
  
  alb_domain_name = module.alb.dns_name
  s3_bucket_name  = module.s3.bucket_name
  
  certificate_arn = module.acm_cloudfront.certificate_arn
  
  tags = local.common_tags
}

# SSL Certificate (ALB)
module "acm" {
  source = "./modules/acm"
  
  domain_name = var.domain_name
  zone_id     = data.cloudflare_zone.main.id
  
  tags = local.common_tags
}

# SSL Certificate (CloudFront - us-east-1)
module "acm_cloudfront" {
  source = "./modules/acm"
  
  providers = {
    aws = aws.us_east_1
  }
  
  domain_name = var.domain_name
  zone_id     = data.cloudflare_zone.main.id
  
  tags = local.common_tags
}

# CloudWatch Monitoring
module "monitoring" {
  source = "./modules/monitoring"
  
  name_prefix = local.name_prefix
  
  ecs_cluster_name = module.ecs.cluster_name
  ecs_service_name = module.ecs.service_name
  alb_arn_suffix   = module.alb.arn_suffix
  
  notification_email = var.notification_email
  
  tags = local.common_tags
}

# AWS Provider for us-east-1 (CloudFront certificates)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = local.common_tags
  }
}

# Cloudflare Zone data
data "cloudflare_zone" "main" {
  name = var.domain_name
}

# Cloudflare DNS Records
resource "cloudflare_record" "main" {
  zone_id = data.cloudflare_zone.main.id
  name    = var.domain_name
  content = module.cloudfront.domain_name
  type    = "CNAME"
  proxied = true
  
  comment = "Managed by Terraform - MVP Hotel Review Generator"
}

resource "cloudflare_record" "www" {
  zone_id = data.cloudflare_zone.main.id
  name    = "www.${var.domain_name}"
  content = var.domain_name
  type    = "CNAME"
  proxied = true
  
  comment = "Managed by Terraform - MVP Hotel Review Generator WWW redirect"
}

# WAF and Security
module "waf" {
  source = "./modules/waf"
  
  name_prefix = local.name_prefix
  
  # Associate with ALB
  resource_arn = module.alb.arn
  
  tags = local.common_tags
}

# Secrets Manager
resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "${local.name_prefix}-app-secrets"
  description            = "Application secrets for MVP Hotel Review Generator"
  recovery_window_in_days = 7

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    database_password = var.database_password
    api_keys = {
      openai    = var.openai_api_key
      anthropic = var.anthropic_api_key
    }
    session_secret = var.session_secret
  })
}

# Lambda function for health checks
resource "aws_lambda_function" "health_check" {
  filename         = "health_check.zip"
  function_name    = "${local.name_prefix}-health-check"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 10

  environment {
    variables = {
      TARGET_URL = "https://${var.domain_name}/health"
    }
  }

  tags = local.common_tags
}

# IAM role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${local.name_prefix}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}