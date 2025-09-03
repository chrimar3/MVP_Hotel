# MVP Project Guidelines

## Quick MVP Decision Framework

Before building ANYTHING, use this checklist:

### The "Domes Test"
```
□ Can one developer understand entire codebase in 30 minutes?
□ Can deploy in under 1 hour?  
□ Can add new feature in under 1 day?
□ Solves ONE specific problem for ONE specific customer?

If NO to any → too complex for MVP
```

### MVP vs Over-Engineering Red Flags
```
✅ MVP Approach          ❌ Over-Engineering
Single HTML file      → Monorepo architecture
~1,000 lines code     → 19,000+ lines code  
Manual deployment     → CI/CD pipelines
One customer focus    → Generic solution
Working > perfect     → Perfect > working
```

## Commands for MVP Development

```bash
# MVP Validation Phase (Week 1)
find_customer       # Identify ONE specific customer
validate_problem    # Confirm they have the problem
commit_solution     # Get "yes, I'll use it" commitment

# MVP Build Phase (Week 2-3)  
create_single_file  # index.html with inline CSS/JS
implement_core      # ONE main feature only
deploy_manual       # Drag-and-drop to Netlify
test_with_customer  # Watch them use it (don't ask)

# MVP Iteration Phase (Week 4+)
measure_usage       # Actual usage metrics
collect_feedback    # What blocks them?
fix_blocking_bugs   # Only critical issues
document_requests   # Feature requests (don't implement yet)
```

## MVP File Structure Template
```
project/
├── index.html          # Everything in one file
├── README.md           # Setup only
├── .env.example        # API keys
└── MVP_LESSONS_LEARNED.md  # Reference this!
```

## Key Lesson from Domes Reviews Comparison

**Simple + Deployed + Used = Successful MVP**  
**Complex + Perfect + Unused = Engineering Exercise**

Always ask: "What's the minimum that solves the customer's problem?"
Not: "What's the best way to build this?"

---

*Reference: See MVP_LESSONS_LEARNED.md for detailed case study analysis*