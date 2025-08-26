#!/bin/bash

# BMAD-METHOD™ Integration for Claude Code
# Enhanced workflow for AI-driven development

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# BMAD Base Directory
BMAD_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$BMAD_DIR")"

# Initialize BMAD
bmad_init() {
    echo -e "${CYAN}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║          BMAD-METHOD™ for Claude Code              ║${NC}"
    echo -e "${CYAN}║     Batch Mode Architecture & Development          ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Create directory structure if not exists
    mkdir -p "$BMAD_DIR"/{artifacts,stories,context,sessions,agents}
    
    # Initialize phase
    echo "initialized" > "$BMAD_DIR/context/phase"
    echo "1" > "$BMAD_DIR/context/sprint"
    
    echo -e "${GREEN}✓ BMAD initialized successfully${NC}"
    echo -e "${YELLOW}→ Use 'bmad_help' to see available commands${NC}"
}

# Display current status
bmad_status() {
    local phase=$(cat "$BMAD_DIR/context/phase" 2>/dev/null || echo "Not Started")
    local sprint=$(cat "$BMAD_DIR/context/sprint" 2>/dev/null || echo "1")
    local stories=$(ls -1 "$BMAD_DIR/stories/"*.md 2>/dev/null | wc -l | tr -d ' ')
    local artifacts=$(ls -1 "$BMAD_DIR/artifacts/"*.md 2>/dev/null | wc -l | tr -d ' ')
    
    echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║       BMAD Workflow Status             ║${NC}"
    echo -e "${CYAN}╠════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC} Phase: ${GREEN}$phase${NC}"
    echo -e "${CYAN}║${NC} Sprint: ${YELLOW}$sprint${NC}"
    echo -e "${CYAN}║${NC} Stories: ${PURPLE}$stories${NC}"
    echo -e "${CYAN}║${NC} Artifacts: ${BLUE}$artifacts${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
}

# Business Analyst agent
bmad_analyst() {
    local requirements="$1"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}   📊 BUSINESS ANALYST AGENT${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo "analyst" > "$BMAD_DIR/context/phase"
    echo "$(date): Analyst started" >> "$BMAD_DIR/sessions/session.log"
    
    echo -e "${GREEN}Instructions for Claude Code:${NC}"
    echo -e "Use the Task tool with 'business-analyst' agent to:"
    echo -e "1. Analyze requirements: $requirements"
    echo -e "2. Create PRD at: $BMAD_DIR/artifacts/prd.md"
    echo -e "3. Generate user stories in: $BMAD_DIR/stories/"
    echo -e "4. Create handoff at: $BMAD_DIR/context/analyst-handoff.json"
}

# Product Manager agent
bmad_pm() {
    local goals="$1"
    echo -e "${PURPLE}═══════════════════════════════════════════${NC}"
    echo -e "${PURPLE}   🎯 PRODUCT MANAGER AGENT${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════${NC}"
    echo "product" > "$BMAD_DIR/context/phase"
    echo "$(date): PM started" >> "$BMAD_DIR/sessions/session.log"
    
    echo -e "${GREEN}Instructions for Claude Code:${NC}"
    echo -e "Use the business-analyst agent (as PM role) to:"
    echo -e "1. Prioritize features using MoSCoW"
    echo -e "2. Create roadmap at: $BMAD_DIR/artifacts/roadmap.md"
    echo -e "3. Define MVP at: $BMAD_DIR/artifacts/mvp.md"
    echo -e "4. Create handoff at: $BMAD_DIR/context/pm-handoff.json"
}

# Architect agent
bmad_architect() {
    local system="$1"
    echo -e "${CYAN}═══════════════════════════════════════════${NC}"
    echo -e "${CYAN}   🏗️  SOLUTION ARCHITECT AGENT${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════${NC}"
    echo "architecture" > "$BMAD_DIR/context/phase"
    echo "$(date): Architect started" >> "$BMAD_DIR/sessions/session.log"
    
    echo -e "${GREEN}Instructions for Claude Code:${NC}"
    echo -e "Use the backend-architect agent to:"
    echo -e "1. Design system architecture"
    echo -e "2. Create architecture doc at: $BMAD_DIR/artifacts/architecture.md"
    echo -e "3. Define components at: $BMAD_DIR/artifacts/components.md"
    echo -e "4. Create handoff at: $BMAD_DIR/context/architect-handoff.json"
}

# Scrum Master agent
bmad_scrum() {
    local sprint="$1"
    echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
    echo -e "${YELLOW}   📋 SCRUM MASTER AGENT${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
    echo "sprint-planning" > "$BMAD_DIR/context/phase"
    echo "$sprint" > "$BMAD_DIR/context/sprint"
    echo "$(date): Scrum Master started for Sprint $sprint" >> "$BMAD_DIR/sessions/session.log"
    
    echo -e "${GREEN}Instructions for Claude Code:${NC}"
    echo -e "1. Create story bundle for Sprint $sprint"
    echo -e "2. Add implementation context to stories"
    echo -e "3. Update sprint plan at: $BMAD_DIR/artifacts/sprint-$sprint.md"
}

# Developer agent
bmad_dev() {
    local story="$1"
    echo -e "${GREEN}═══════════════════════════════════════════${NC}"
    echo -e "${GREEN}   💻 DEVELOPER AGENT${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════${NC}"
    echo "development" > "$BMAD_DIR/context/phase"
    echo "$(date): Developer started on $story" >> "$BMAD_DIR/sessions/session.log"
    
    echo -e "${GREEN}Instructions for Claude Code:${NC}"
    echo -e "Use the typescript-pro or frontend-developer agent to:"
    echo -e "1. Read story: $BMAD_DIR/stories/$story.md"
    echo -e "2. Implement using TDD approach"
    echo -e "3. Run tests: npm test"
    echo -e "4. Update story status"
}

# QA agent
bmad_qa() {
    local story="$1"
    echo -e "${RED}═══════════════════════════════════════════${NC}"
    echo -e "${RED}   🔍 QA AGENT${NC}"
    echo -e "${RED}═══════════════════════════════════════════${NC}"
    echo "qa-testing" > "$BMAD_DIR/context/phase"
    echo "$(date): QA started on $story" >> "$BMAD_DIR/sessions/session.log"
    
    echo -e "${GREEN}Instructions for Claude Code:${NC}"
    echo -e "Use the test-automator agent to:"
    echo -e "1. Review implementation"
    echo -e "2. Verify acceptance criteria"
    echo -e "3. Run test suite"
    echo -e "4. Create QA report at: $BMAD_DIR/artifacts/qa-$story.md"
}

# Batch planning mode
bmad_batch_plan() {
    echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║        BMAD BATCH PLANNING MODE                    ║${NC}"
    echo -e "${GREEN}║   Analyst → PM → Architect (Sequential)            ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Ready for batch planning!${NC}"
    echo -e "${YELLOW}Paste this in Claude Code:${NC}"
    echo ""
    echo -e "${PURPLE}\"Execute BMAD batch planning for [your requirements]\"${NC}"
    echo ""
    echo -e "Claude will run all three planning agents sequentially."
}

# Story bundle creation
bmad_story_bundle() {
    local feature="$1"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}   📦 STORY BUNDLE CREATION${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    
    echo -e "${GREEN}Creating context-rich story bundle for: $feature${NC}"
    echo -e "Stories will be created in: $BMAD_DIR/stories/"
}

# Rapid development cycle
bmad_rapid() {
    local story="$1"
    echo -e "${PURPLE}═══════════════════════════════════════════${NC}"
    echo -e "${PURPLE}   ⚡ RAPID DEVELOPMENT CYCLE${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════${NC}"
    
    echo -e "${GREEN}Starting rapid cycle for: $story${NC}"
    echo -e "1. Development (typescript-pro agent)"
    echo -e "2. Testing (test-automator agent)"
    echo -e "3. QA Review (code-reviewer agent)"
}

# Context check
bmad_context() {
    echo -e "${CYAN}═══════════════════════════════════════════${NC}"
    echo -e "${CYAN}   📂 CONTEXT FILES${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════${NC}"
    
    echo -e "${YELLOW}Available handoffs:${NC}"
    ls -la "$BMAD_DIR/context/"*.json 2>/dev/null || echo "No handoffs yet"
    
    echo -e "\n${YELLOW}Current phase:${NC}"
    cat "$BMAD_DIR/context/phase" 2>/dev/null || echo "Not started"
}

# List stories
bmad_stories() {
    echo -e "${PURPLE}═══════════════════════════════════════════${NC}"
    echo -e "${PURPLE}   📝 USER STORIES${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════${NC}"
    
    if ls "$BMAD_DIR/stories/"*.md >/dev/null 2>&1; then
        for story in "$BMAD_DIR/stories/"*.md; do
            basename "$story" .md
        done
    else
        echo "No stories created yet"
    fi
}

# Help command
bmad_help() {
    echo -e "${CYAN}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║          BMAD Commands for Claude Code             ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}Setup & Status:${NC}"
    echo -e "  ${YELLOW}bmad_init${NC}         - Initialize BMAD structure"
    echo -e "  ${YELLOW}bmad_status${NC}       - Show current status"
    echo -e "  ${YELLOW}bmad_context${NC}      - Check context files"
    echo ""
    echo -e "${GREEN}Planning Agents:${NC}"
    echo -e "  ${YELLOW}bmad_analyst${NC} [req] - Start Business Analyst"
    echo -e "  ${YELLOW}bmad_pm${NC} [goals]    - Start Product Manager"
    echo -e "  ${YELLOW}bmad_architect${NC} [sys]- Start Architect"
    echo -e "  ${YELLOW}bmad_batch_plan${NC}    - Run all planning agents"
    echo ""
    echo -e "${GREEN}Development:${NC}"
    echo -e "  ${YELLOW}bmad_scrum${NC} [n]     - Start Sprint planning"
    echo -e "  ${YELLOW}bmad_dev${NC} [story]   - Start development"
    echo -e "  ${YELLOW}bmad_qa${NC} [story]    - Start QA review"
    echo -e "  ${YELLOW}bmad_rapid${NC} [story] - Rapid dev cycle"
    echo ""
    echo -e "${GREEN}Utilities:${NC}"
    echo -e "  ${YELLOW}bmad_stories${NC}       - List all stories"
    echo -e "  ${YELLOW}bmad_story_bundle${NC}  - Create story bundle"
    echo ""
    echo -e "${CYAN}Pro Tip:${NC} Use Task tool with appropriate agents!"
}

# Export all functions
export -f bmad_init
export -f bmad_status
export -f bmad_analyst
export -f bmad_pm
export -f bmad_architect
export -f bmad_scrum
export -f bmad_dev
export -f bmad_qa
export -f bmad_batch_plan
export -f bmad_story_bundle
export -f bmad_rapid
export -f bmad_context
export -f bmad_stories
export -f bmad_help

# Display welcome message
echo -e "${CYAN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     BMAD-METHOD™ Claude Code Integration           ║${NC}"
echo -e "${CYAN}║         Loaded Successfully! 🚀                    ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Type 'bmad_help' for available commands${NC}"
echo -e "${GREEN}Type 'bmad_batch_plan' to start planning${NC}"