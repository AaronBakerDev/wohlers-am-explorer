# 🚀 Orchestrator Quick Reference

> **📋 For complete command reference**: See `COMMANDS.md` for comprehensive command documentation with examples, workflows, and discovery help.

## Core Commands
```bash
/product [task]    # Activate Product Owner Agent (backlog creation)
/design [task]     # Activate Designer Agent (page implementation)
/develop [task]    # Activate Developer Agent (backend integration)
/test [task]       # Activate QA Tester Agent (browser + database testing)
/review [agent] [deliverable]  # Cross-review
/clickup [action]  # ClickUp task management (PRIMARY tracking)
/webapp [action]   # Full webapp development process (4 phases)
```

## ClickUp Commands (Primary Tracking)
```bash
# Setup & Configuration
/clickup setup              # Initialize ClickUp (reads CREDENTIALS.md)
/clickup test-connection     # Test API and permissions

# Task Management
/clickup create-backlog      # Create complete project backlog (Phase 1)
/clickup start-task [NAME]   # Start specific task/subtask
/clickup complete-task [NAME] # Mark task/subtask complete
/clickup user-validation [NAME] # Create user validation task

# Progress Monitoring
/clickup show-status         # Current task statuses and overview
/clickup show-progress       # Detailed progress with metrics
/clickup show-blockers       # All blocked tasks with reasons
/clickup show-validation-pending # Tasks awaiting user validation
/clickup report-progress     # Generate session progress report

# Task Investigation
/clickup get-task [NAME]     # Detailed task information
/clickup list-tasks          # All project tasks
/clickup search-tasks [KEYWORD] # Search tasks by keyword
```

## 🚀 Full Webapp Process (4 Phases)
```bash
/webapp start         # Initialize webapp development (reads /project-documents)
/webapp phase [1-4]   # Jump to specific phase
/webapp status        # Show current phase progress
/webapp validate      # Present current work to user for validation
/webapp user-feedback # Collect and document user feedback
```

### Phase Overview
**Phase 1**: Product Owner creates comprehensive ClickUp backlog + App setup
**Phase 2**: Designer implements ALL pages systematically (USER VALIDATION REQUIRED)
**Phase 3**: Developer integrates data into existing pages (NO UI changes)
**Phase 4**: QA executes UAT with all user stories (USER VALIDATION REQUIRED)

## 🏗️ Tech Stack (MANDATORY)
**Next.js + React + shadcn/ui + Supabase + TypeScript**

## Common Workflows (with ClickUp)

### New Feature (Full Process)
```
/product create-comprehensive-backlog  # Create all tasks in ClickUp
/design feature-specification          # Updates ClickUp: specification task
/design implement-feature             # Updates ClickUp: implementation task
/clickup user-validation "Feature"    # Create user validation task
/develop feature-backend              # Updates ClickUp: backend integration
/test validate-feature                # Updates ClickUp: testing complete
```

### Bug Fix (Tracked Process)
```
/clickup add-task "Fix [issue]" Developer  # Create bug task
/test reproduce-bug                        # Updates ClickUp: bug reproduction
/develop fix-bug                          # Updates ClickUp: fix implementation
/test validate-fix                        # Updates ClickUp: fix validation
/clickup user-validation "Fix [issue]"    # User approval task
```

### Page Implementation (Designer Focus)
```
/clickup get-task "[Page] Implementation"  # Find ClickUp task
/design page-specification                # Updates ClickUp: spec subtask
/design implement-page                    # Updates ClickUp: implementation
/test validate-page                       # Updates ClickUp: internal testing
/clickup user-validation "[Page]"         # User review task
```

## Agent Specialties & ClickUp Integration

**📋 Product Owner** (NEW)
- Comprehensive requirement analysis
- Exhaustive ClickUp backlog creation (8-12 subtasks per feature)
- UAT master task with user story subtasks
- **MANDATORY**: Updates ClickUp for all work

**🎨 Designer** (Design System Guardian)
- Page implementation using /base-app design system
- React components with shadcn/ui + existing CSS variables
- **MANDATORY**: Updates ClickUp task status and comments
- Works with dummy data for Developer integration

**💻 Developer** (Backend Specialist)
- Supabase database schema and APIs
- Data integration into existing Designer pages
- **MANDATORY**: Updates ClickUp for all backend work
- **NEVER modifies UI** - Designer's exclusive domain

**🔍 QA Tester** (Browser + Database Testing)
- Playwright MCP for browser automation (navigation, forms, screenshots)
- Supabase MCP for database validation (data integrity, CRUD operations)
- **MANDATORY**: Updates ClickUp with detailed test results
- Internal validation + Phase 4 UAT coordination

## Quick Tips (ClickUp-Focused)
1. **Always check ClickUp first**: `/clickup show-status` to see current work
2. **Product Owner starts everything**: Create comprehensive backlog before implementation
3. **Designer guards design system**: Reuse /base-app CSS variables and components
4. **Developer never touches UI**: Only integrate data into existing pages
5. **QA uses MCPs**: Playwright for browser, Supabase for database validation
6. **User validation required**: Phase 2 (pages) and Phase 4 (UAT) have mandatory user approval
7. **ClickUp is single source of truth**: All progress tracked there, not in local files

## Emergency Commands
```
/clickup show-status           # Where are we in ClickUp?
/clickup show-blockers         # What's blocking progress?
/clickup show-validation-pending # What needs user approval?
/webapp status                 # Current phase overview
/test smoke-test              # Quick validation with screenshots
```

## Legacy Commands (Now Redirect to ClickUp)
```
/scratchpad       → /clickup show-status
/scratchpad update → /clickup report-progress  
/scratchpad reset → /clickup create-backlog
/status          → /clickup show-status
```