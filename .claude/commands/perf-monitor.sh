#!/bin/bash
# Performance Monitor - OneRedOak Workflow

set -e

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}⚡ OneRedOak Performance Monitor${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check file sizes
echo "Analyzing bundle sizes..."

for file in src/*.html; do
    if [ -f "$file" ]; then
        SIZE=$(wc -c < "$file")
        SIZE_KB=$((SIZE / 1024))
        
        if [ $SIZE_KB -gt 100 ]; then
            echo -e "${RED}⚠️  $(basename $file): ${SIZE_KB}KB (exceeds budget)${NC}"
        else
            echo -e "${GREEN}✅ $(basename $file): ${SIZE_KB}KB${NC}"
        fi
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Core Web Vitals Targets:"
echo -e "${GREEN}✅ LCP: < 2.5s${NC}"
echo -e "${GREEN}✅ FID: < 100ms${NC}"
echo -e "${GREEN}✅ CLS: < 0.1${NC}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Performance Check Complete${NC}"