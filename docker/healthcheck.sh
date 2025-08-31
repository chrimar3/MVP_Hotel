#!/bin/sh
# Health check script for Docker container

set -e

# Default values
HOST=${HEALTH_CHECK_HOST:-localhost}
PORT=${HEALTH_CHECK_PORT:-8080}
TIMEOUT=${HEALTH_CHECK_TIMEOUT:-3}

# Function to check if service is healthy
check_health() {
    # Check if nginx is running
    if ! pgrep nginx > /dev/null; then
        echo "ERROR: Nginx is not running"
        return 1
    fi

    # Check if port is listening
    if ! nc -z "$HOST" "$PORT" 2>/dev/null; then
        echo "ERROR: Port $PORT is not listening"
        return 1
    fi

    # Check HTTP response
    if command -v curl >/dev/null 2>&1; then
        response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout "$TIMEOUT" "http://$HOST:$PORT/health" || echo "000")
        if [ "$response" != "200" ]; then
            echo "ERROR: Health endpoint returned HTTP $response"
            return 1
        fi
    elif command -v wget >/dev/null 2>&1; then
        if ! wget -q --timeout="$TIMEOUT" --spider "http://$HOST:$PORT/health" 2>/dev/null; then
            echo "ERROR: Health endpoint check failed with wget"
            return 1
        fi
    else
        echo "WARNING: Neither curl nor wget available, skipping HTTP health check"
    fi

    # Check if HTML files are accessible
    if [ -f "/usr/share/nginx/html/index.html" ]; then
        if [ ! -r "/usr/share/nginx/html/index.html" ]; then
            echo "ERROR: Main HTML file is not readable"
            return 1
        fi
    else
        echo "WARNING: Main HTML file not found"
    fi

    echo "OK: Service is healthy"
    return 0
}

# Run health check
check_health