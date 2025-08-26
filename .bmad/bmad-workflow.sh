#!/bin/bash

# BMAD Workflow Script for Solo Developer Optimization
# Batch Mode Architecture & Development Method

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# BMAD Base Directory
BMAD_DIR="$(dirname "$0")"

# Function to display BMAD status
bmad_status() {
    echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║       BMAD Workflow Status             ║${NC}"
    echo -e "${CYAN}╠════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC} Phase: ${GREEN}$(cat $BMAD_DIR/context/phase 2>/dev/null || echo 'Planning')${NC}"
    echo -e "${CYAN}║${NC} Sprint: ${YELLOW}$(cat $BMAD_DIR/context/sprint 2>/dev/null || echo '1')${NC}"
    echo -e "${CYAN}║${NC} Stories: ${PURPLE}$(ls -1 $BMAD_DIR/stories/*.md 2>/dev/null | wc -l)${NC}"
    echo -e "${CYAN}║${NC} Artifacts: ${BLUE}$(ls -1 $BMAD_DIR/artifacts/*.md 2>/dev/null | wc -l)${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
}

# Function to initiate planning phase
bmad_plan() {
    echo -e "${GREEN}═══════════════════════════════════════════${NC}"
    echo -e "${GREEN}   🎯 BMAD BATCH PLANNING SESSION${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════${NC}"
    echo ""
    echo -e "${CYAN}Ready for batch planning with:${NC}"
    echo -e "  ${YELLOW}→${NC} Business Analyst (requirements)"
    echo -e "  ${YELLOW}→${NC} Product Manager (prioritization)"
    echo -e "  ${YELLOW}→${NC} Architect (technical design)"
    echo ""
    echo "Planning" > $BMAD_DIR/context/phase
    echo -e "${GREEN}✓ Planning phase initialized${NC}"
    echo ""
    echo -e "${PURPLE}Paste your requirements in Claude Code to begin...${NC}"
}

# Function to create story bundle
bmad_story() {
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}   📝 STORY CREATION SESSION${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo "Story Creation" > $BMAD_DIR/context/phase
    echo -e "${GREEN}✓ Story creation mode active${NC}"
}

# Function to start development cycle
bmad_dev() {
    echo -e "${PURPLE}═══════════════════════════════════════════${NC}"
    echo -e "${PURPLE}   💻 RAPID DEVELOPMENT CYCLE${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════${NC}"
    echo "Development" > $BMAD_DIR/context/phase
    echo -e "${GREEN}✓ Development cycle started${NC}"
}

# Function to run QA review
bmad_qa() {
    echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
    echo -e "${YELLOW}   🔍 QA REVIEW SESSION${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
    echo "QA Review" > $BMAD_DIR/context/phase
    echo -e "${GREEN}✓ QA review initiated${NC}"
}

# Function to display help
bmad_help() {
    echo -e "${CYAN}BMAD Workflow Commands:${NC}"
    echo -e "  ${GREEN}bmad_status${NC} - Show current BMAD status"
    echo -e "  ${GREEN}bmad_plan${NC}   - Start batch planning session"
    echo -e "  ${GREEN}bmad_story${NC}  - Create story bundle"
    echo -e "  ${GREEN}bmad_dev${NC}    - Start development cycle"
    echo -e "  ${GREEN}bmad_qa${NC}     - Run QA review"
    echo -e "  ${GREEN}bmad_help${NC}   - Show this help message"
}

# Export functions for use in shell
export -f bmad_status
export -f bmad_plan
export -f bmad_story
export -f bmad_dev
export -f bmad_qa
export -f bmad_help

# Display welcome message when sourced
echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   BMAD Workflow System Loaded          ║${NC}"
echo -e "${CYAN}║   Type 'bmad_help' for commands        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"