#!/bin/bash

# OneRedOak-Style Browser Testing Command
# Integrates Puppeteer testing with Claude Code workflows

echo "🌐 OneRedOak Browser Testing Suite"
echo "=================================="
echo ""

# Parse command
COMMAND=${1:-all}

case $COMMAND in
    visual)
        echo "Running visual tests..."
        node .claude/browser-tests/visual-test.js
        ;;
    
    accessibility|a11y)
        echo "Running accessibility tests..."
        node .claude/browser-tests/accessibility-test.js
        ;;
    
    performance|perf)
        echo "Running performance tests..."
        node .claude/browser-tests/performance-test.js
        ;;
    
    interaction|interact)
        echo "Running interaction tests..."
        node .claude/browser-tests/interaction-test.js
        ;;
    
    screenshot)
        echo "Taking screenshot..."
        node .claude/browser-bridge.js screenshot output="${2:-screenshot.png}" ${3}
        ;;
    
    mobile)
        echo "Testing mobile views..."
        node .claude/browser-bridge.js testMobile
        ;;
    
    console)
        echo "Checking console errors..."
        node .claude/browser-bridge.js checkConsole
        ;;
    
    all)
        echo "Running all tests..."
        bash .claude/browser-tests/run-all-tests.sh
        ;;
    
    help|--help|-h)
        echo "Usage: browser-test.sh [command] [options]"
        echo ""
        echo "Commands:"
        echo "  visual          - Run visual regression tests"
        echo "  a11y            - Run accessibility tests"
        echo "  perf            - Run performance tests"
        echo "  interact        - Run interaction tests"
        echo "  screenshot      - Take a screenshot"
        echo "  mobile          - Test mobile responsiveness"
        echo "  console         - Check for console errors"
        echo "  all             - Run all tests (default)"
        echo ""
        echo "Examples:"
        echo "  browser-test.sh visual"
        echo "  browser-test.sh screenshot output.png mobile=true"
        echo "  browser-test.sh all"
        ;;
    
    *)
        echo "Unknown command: $COMMAND"
        echo "Run 'browser-test.sh help' for usage"
        exit 1
        ;;
esac