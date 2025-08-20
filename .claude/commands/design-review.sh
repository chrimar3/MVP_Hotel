#!/bin/bash
# Design Review Command - Integrated with Claude Code
# Based on OneRedOak/claude-code-workflows

set -e

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🎨 Running OneRedOak Design Review Workflow...${NC}"

# Visual Consistency Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Checking Visual Consistency..."
grep -r "color: #" src/*.html 2>/dev/null && echo -e "${RED}⚠️  Found hardcoded colors${NC}" || echo -e "${GREEN}✅ No hardcoded colors${NC}"

# Accessibility Audit
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Running Accessibility Audit..."
grep -r "<button" src/*.html | grep -v "aria-label" && echo -e "${RED}⚠️  Missing ARIA labels${NC}" || echo -e "${GREEN}✅ ARIA labels present${NC}"

# Mobile Optimization
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Checking Mobile Optimization..."
grep -r "min-height: 44px" src/*.html >/dev/null && echo -e "${GREEN}✅ Touch targets optimized${NC}" || echo -e "${RED}⚠️  Touch targets need review${NC}"

# i18n Completeness
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Verifying Multi-Language Support..."
grep -r "translations\['el'\]" src/*.html >/dev/null && echo -e "${GREEN}✅ Greek language supported${NC}" || echo -e "${RED}⚠️  Greek missing${NC}"

# Generate Report
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Design Review Complete${NC}"
echo "Run 'claude review mobile' for detailed mobile analysis"