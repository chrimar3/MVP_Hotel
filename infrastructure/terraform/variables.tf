# Variables for MVP Hotel Review Generator Infrastructure

# General Configuration
variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be one of: production, staging, development."
  }
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

# Domain Configuration
variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "mvp-hotel.example.com"
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token for DNS management"
  type        = string
  sensitive   = true
}

# Network Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# Application Configuration
variable "container_image" {
  description = "Docker container image for the application"
  type        = string
  default     = "ghcr.io/chrimar3/mvp_hotel:latest"
}

variable "container_port" {
  description = "Port the container listens on"
  type        = number
  default     = 8080
}

variable "desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "min_capacity" {
  description = "Minimum number of ECS tasks"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum number of ECS tasks"
  type        = number
  default     = 10
}

# Database Configuration
variable "enable_database" {
  description = "Whether to create RDS database"
  type        = bool
  default     = false
}

variable "database_name" {
  description = "Name of the database"
  type        = string
  default     = "mvp_hotel"
}

variable "database_username" {
  description = "Database username"
  type        = string
  default     = "app_user"
}

variable "database_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

# Cache Configuration
variable "enable_redis" {
  description = "Whether to create ElastiCache Redis cluster"
  type        = bool
  default     = true
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

# Monitoring Configuration
variable "notification_email" {
  description = "Email address for monitoring notifications"
  type        = string
}

# Secrets
variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "anthropic_api_key" {
  description = "Anthropic API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "session_secret" {
  description = "Session secret for application"
  type        = string
  sensitive   = true
  default     = ""
}

# Instance Configuration
variable "instance_type" {
  description = "EC2 instance type for ECS tasks"
  type        = string
  default     = "t3.small"
}

# SSL/TLS Configuration
variable "ssl_policy" {
  description = "SSL security policy for ALB"
  type        = string
  default     = "ELBSecurityPolicy-TLS-1-2-2017-01"
}

# Backup Configuration
variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

# Logging Configuration
variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 14
}

# Auto Scaling Configuration
variable "scale_up_cooldown" {
  description = "Cooldown period for scaling up (seconds)"
  type        = number
  default     = 300
}

variable "scale_down_cooldown" {
  description = "Cooldown period for scaling down (seconds)"
  type        = number
  default     = 300
}

variable "cpu_high_threshold" {
  description = "CPU utilization threshold for scaling up"
  type        = number
  default     = 70
}

variable "cpu_low_threshold" {
  description = "CPU utilization threshold for scaling down"
  type        = number
  default     = 20
}

# Health Check Configuration
variable "health_check_path" {
  description = "Health check path for ALB"
  type        = string
  default     = "/health"
}

variable "health_check_interval" {
  description = "Health check interval in seconds"
  type        = number
  default     = 30
}

variable "health_check_timeout" {
  description = "Health check timeout in seconds"
  type        = number
  default     = 5
}

variable "healthy_threshold" {
  description = "Number of consecutive health checks successes required"
  type        = number
  default     = 2
}

variable "unhealthy_threshold" {
  description = "Number of consecutive health check failures required"
  type        = number
  default     = 3
}