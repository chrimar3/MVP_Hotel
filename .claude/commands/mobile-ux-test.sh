#!/bin/bash
# Mobile UX Tester - OneRedOak Workflow
# Addresses the mobile feature test issues

set -e

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}📱 OneRedOak Mobile UX Testing${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Testing Mobile Features..."

# Check viewport meta tag
echo -n "1. Viewport Configuration: "
grep -q "viewport" src/*.html && echo -e "${GREEN}✅ Present${NC}" || echo -e "${RED}❌ Missing${NC}"

# Check touch event handlers
echo -n "2. Touch Event Handlers: "
grep -q "touchstart\|touchend\|touchmove" src/*.html && echo -e "${GREEN}✅ Implemented${NC}" || echo -e "${YELLOW}⚠️  Not found${NC}"

# Check PWA manifest
echo -n "3. PWA Manifest: "
[ -f "manifest.json" ] && echo -e "${GREEN}✅ Found${NC}" || echo -e "${RED}❌ Missing${NC}"

# Check service worker
echo -n "4. Service Worker: "
grep -q "serviceWorker" src/*.html && echo -e "${GREEN}✅ Registered${NC}" || echo -e "${YELLOW}⚠️  Not registered${NC}"

# Check responsive breakpoints
echo -n "5. Responsive Design: "
grep -q "@media.*max-width" src/*.html && echo -e "${GREEN}✅ Media queries found${NC}" || echo -e "${RED}❌ No responsive CSS${NC}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Mobile UX Issues to Address:"
echo "• Enhance touch targets to 44px minimum"
echo "• Add haptic feedback for interactions"
echo "• Implement pull-to-refresh"
echo "• Optimize for one-handed use"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Mobile UX Test Complete${NC}"
echo "Run 'claude fix mobile-ux' to auto-fix issues"