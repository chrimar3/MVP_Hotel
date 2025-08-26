# BMAD-METHOD™ Integration for Claude Code

## Quick Start
```bash
# Load BMAD workflow
source .bmad/bmad-claude.sh

# Start batch planning (Analyst → PM → Architect)
bmad_batch_plan
# Then paste: "Execute BMAD batch planning for [your requirements]"

# Check status
bmad_status

# Get help
bmad_help
```

## BMAD Workflow Commands

### Planning Phase (Sequential)
1. `bmad_analyst "[requirements]"` - Business requirements analysis
2. `bmad_pm "[goals]"` - Product management & prioritization  
3. `bmad_architect "[system]"` - Technical architecture design

Or run all three with: `bmad_batch_plan`

### Development Phase
- `bmad_scrum [sprint]` - Create story bundles with context
- `bmad_dev STORY-XXX` - Implement story with TDD
- `bmad_qa STORY-XXX` - Quality assurance review
- `bmad_rapid STORY-XXX` - Complete dev+test+QA cycle

### Utilities
- `bmad_status` - Current workflow status
- `bmad_stories` - List all user stories
- `bmad_context` - Check agent handoffs

## BMAD Agent Mapping

| BMAD Role | Claude Code Agent | Purpose |
|-----------|------------------|----------|
| Analyst | business-analyst | Requirements, PRDs, User Stories |
| PM | business-analyst | Prioritization, Roadmap, MVP |
| Architect | backend-architect | System Design, Components |
| Scrum Master | Manual | Story creation with context |
| Developer | typescript-pro | Implementation with TDD |
| QA | test-automator | Testing & Verification |
| DevOps | deployment-engineer | CI/CD, Infrastructure |
| UX | ui-ux-designer | Interface Design |

## BMAD Directory Structure
```
.bmad/
├── agents/          # Agent role definitions
├── artifacts/       # PRDs, roadmaps, architecture docs
├── context/         # Agent handoffs and state
├── sessions/        # Session logs
├── stories/         # Context-rich user stories
├── bmad-config.json # Configuration
└── bmad-claude.sh   # Workflow commands
```

## Example BMAD Session

```bash
# 1. Initialize and start planning
source .bmad/bmad-claude.sh
bmad_batch_plan

# 2. In Claude Code, paste:
"Execute BMAD batch planning for a Todo List app with:
- User authentication
- CRUD operations  
- Categories and tags
- Due dates and reminders"

# 3. After planning, create stories
bmad_scrum 1

# 4. Implement stories
bmad_dev STORY-001

# 5. Run QA
bmad_qa STORY-001
```

## BMAD Principles

1. **Agentic Planning**: Dedicated agents collaborate on comprehensive specs
2. **Context Engineering**: Stories contain full implementation context
3. **Batch Optimization**: Run multiple agents sequentially for efficiency
4. **Solo Dev Mode**: Optimized for single developer productivity

## Story Format (BMAD Enhanced)

Stories in `.bmad/stories/` include:
- Business context from Analyst
- Priority from PM
- Architecture guidance from Architect
- Implementation templates
- Test scenarios
- Acceptance criteria

## Tips for Claude Code + BMAD

1. **Always start with planning**: Run all three planning agents first
2. **Use Task tool**: Invoke agents via Task tool for best results
3. **Check handoffs**: Review `.bmad/context/*-handoff.json` files
4. **Follow the flow**: Planning → Stories → Development → QA
5. **Maintain context**: Each agent reads previous agent outputs

## Troubleshooting

- If phase gets stuck: `echo "planning" > .bmad/context/phase`
- Missing directories: `bmad_init`
- View logs: `cat .bmad/sessions/session.log`
- Reset sprint: `echo "1" > .bmad/context/sprint`

---
*BMAD-METHOD™ v4.40.0 integrated with Claude Code*