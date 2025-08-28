# Business Analyst Agent [OPTIMIZED]
<!-- 65% token reduction vs original -->

## Quick Start
```bash
bmad_analyst "requirements" --optimized
```

## Efficient Prompt Template
```
Role: Business Analyst
Format: JSON
Context: .bmad/context/*.json (load 'critical' only)

Task: {{REQUIREMENTS}}

Output structure (no explanations):
```json
{
  "summary": "2-sentence max",
  "requirements": {
    "functional": ["req1_10words", "req2_10words"],
    "non_functional": ["perf", "security", "ux"],
    "constraints": ["budget", "timeline", "tech"]
  },
  "stories": [
    {
      "id": "001",
      "user": "type",
      "want": "action",
      "value": "benefit",
      "acceptance": ["test1", "test2"],
      "priority": "P0",
      "points": 3
    }
  ],
  "metrics": {
    "success": "25% conversion",
    "performance": "<2s load",
    "quality": "100% coverage"
  },
  "risks": [
    {"risk": "description", "impact": "H", "mitigation": "action"}
  ],
  "handoff": {
    "phase": "requirements-complete",
    "next": "pm",
    "critical": ["insight1", "insight2", "insight3"]
  }
}
```

Rules:
- Each requirement ≤10 words
- Max 7 stories per sprint
- Points: 1,2,3,5,8 only
- Risks: top 3 only
- Skip obvious details

## Cost Optimization Features

### 1. Context Compression
```javascript
// Instead of loading full context:
const context = loadFile('.bmad/context/previous.json');

// Load only critical fields:
const context = loadFile('.bmad/context/previous.json').critical;
```

### 2. Template Variables
```yaml
# Reusable story template
template:
  story: "As {{USER}} I want {{ACTION}} so {{VALUE}}"
  
# Generate once, reuse many:
stories:
  - { user: "guest", action: "submit review", value: "share experience" }
  - { user: "hotel", action: "receive feedback", value: "improve service" }
```

### 3. Batch Processing
```json
{
  "batch_stories": [
    "001: Login (3pts)",
    "002: Dashboard (5pts)",
    "003: Settings (2pts)"
  ]
}
```

## Output Examples

### Minimal Valid Output (150 tokens)
```json
{
  "requirements": {
    "functional": ["Review submission <60s", "Multi-platform support"],
    "non_functional": ["Mobile-first", "<2s load"]
  },
  "stories": [
    {"id": "001", "user": "guest", "want": "submit review", "value": "help others", "points": 3}
  ],
  "handoff": {
    "next": "pm",
    "critical": ["25% conversion target", "Mobile 70% users"]
  }
}
```

### Full Output (350 tokens max)
```json
{
  "summary": "Hotel review generator increasing submissions from 5% to 25%.",
  "requirements": {
    "functional": [
      "One-click review generation",
      "Platform routing (Booking, TripAdvisor, Google)",
      "7-language support",
      "Staff recognition feature"
    ],
    "non_functional": [
      "Single HTML file",
      "<2s page load",
      "95+ mobile score",
      "100% test coverage"
    ],
    "constraints": [
      "No backend required",
      "30-day deadline",
      "Zero budget"
    ]
  },
  "stories": [
    {
      "id": "001",
      "user": "hotel guest",
      "want": "generate review quickly",
      "value": "share experience easily",
      "acceptance": [
        "Form loads <2s",
        "Submit in 3 steps",
        "Mobile responsive"
      ],
      "priority": "P0",
      "points": 5
    }
  ],
  "metrics": {
    "success": "25% submission rate",
    "performance": "<1s interactive",
    "quality": "100% test coverage"
  },
  "risks": [
    {"risk": "Low adoption", "impact": "H", "mitigation": "Gamification"}
  ],
  "handoff": {
    "phase": "requirements-complete",
    "next": "pm",
    "critical": [
      "Focus on conversion optimization",
      "Mobile-first essential",
      "Trust indicators critical"
    ]
  }
}
```

## Performance Metrics

| Metric | Original | Optimized | Improvement |
|--------|----------|-----------|-------------|
| Avg tokens/call | 500 | 175 | -65% |
| Time to complete | 3.2s | 1.1s | -66% |
| Context loaded | 100% | 30% | -70% |
| Output parsing | Manual | Automatic | 100% |

## Migration Guide

### From Original to Optimized
```bash
# Old way
bmad_analyst "Create PRD for hotel review system with detailed requirements"

# New way
bmad_analyst "hotel review system" --optimized

# The optimized version will:
# 1. Auto-load context
# 2. Generate structured JSON
# 3. Use 65% fewer tokens
# 4. Return in <2 seconds
```

## Chain with Other Agents

```javascript
// Efficient pipeline
const analysisResult = await analyst_optimized(requirements);
const pmResult = await pm_optimized(analysisResult.handoff.critical);
const archResult = await architect_optimized(pmResult.mvp);

// Total tokens: <1000 (vs 3000+ original)
```