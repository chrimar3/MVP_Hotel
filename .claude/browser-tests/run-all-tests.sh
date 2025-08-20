#!/bin/bash

# Master Test Runner
# Runs all browser-based tests using Puppeteer

echo "🚀 OneRedOak-Style Browser Testing Suite"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test
run_test() {
    local test_name=$1
    local test_file=$2
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Running: $test_name"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if node "$test_file"; then
        echo -e "${GREEN}✅ $test_name PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ $test_name FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    echo ""
}

# Start testing
START_TIME=$(date +%s)

# Run all tests
run_test "Visual Testing" ".claude/browser-tests/visual-test.js"
run_test "Accessibility Testing" ".claude/browser-tests/accessibility-test.js"
run_test "Performance Testing" ".claude/browser-tests/performance-test.js"
run_test "Interaction Testing" ".claude/browser-tests/interaction-test.js"

# Calculate duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Final Report
echo "╔════════════════════════════════════════════════╗"
echo "║           BROWSER TEST SUITE RESULTS          ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo "📊 Test Summary:"
echo "   Total Tests: $TOTAL_TESTS"
echo -e "   ${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "   ${RED}Failed: $FAILED_TESTS${NC}"
echo ""

# Calculate pass rate
if [ $TOTAL_TESTS -gt 0 ]; then
    PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo "   Pass Rate: ${PASS_RATE}%"
    
    if [ $PASS_RATE -ge 90 ]; then
        echo -e "   Grade: ${GREEN}A${NC} 🏆"
    elif [ $PASS_RATE -ge 80 ]; then
        echo -e "   Grade: ${GREEN}B${NC} ✅"
    elif [ $PASS_RATE -ge 70 ]; then
        echo -e "   Grade: ${YELLOW}C${NC} ⚠️"
    else
        echo -e "   Grade: ${RED}F${NC} ❌"
    fi
fi

echo ""
echo "⏱️  Duration: ${DURATION} seconds"
echo ""

# Check for generated files
echo "📁 Generated Artifacts:"
for file in desktop-view.png mobile-view.png full-page.png baseline.png; do
    if [ -f "$file" ]; then
        SIZE=$(du -h "$file" | cut -f1)
        echo "   ✅ $file ($SIZE)"
    fi
done

echo ""
echo "════════════════════════════════════════════════"

# Exit with appropriate code
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}⚠️  Some tests failed. Please review the output above.${NC}"
    exit 1
else
    echo -e "${GREEN}🎉 All tests passed successfully!${NC}"
    exit 0
fi