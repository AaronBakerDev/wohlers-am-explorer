# 🚀 Setup Instructions for Claude Code

## Quick Setup

### 1. Clone and Navigate
```bash
git clone <your-repo>
cd <project-name>
```

### 2. Configure ClickUp Credentials (REQUIRED)
Edit `CREDENTIALS.md` and add your credentials:
```markdown
# 🔐 ClickUp Credentials Configuration

## Required Credentials
### ClickUp API Token
```
CLICKUP_API_TOKEN=pk_your_actual_token_here
```

### ClickUp List ID
```
CLICKUP_LIST_ID=your_list_id_here
```
```

**How to get these credentials:**
- **API Token**: ClickUp Settings → Apps → API → Generate token
- **List ID**: Go to your ClickUp list → Copy the number from the URL

### 3. Add Project Documents
Place your project documents in `/project-documents/`:
- PRD.md (Product Requirements Document)
- user-stories.md (User stories and acceptance criteria)
- design-inspiration.md or images (Visual references)
- brand-guidelines.md (Colors, fonts, styling requirements)

### 4. Launch Claude Code
```bash
claude-code
# or
claude
```

### 5. Initialize Framework (IMPORTANT)
When Claude Code starts, run these commands in order:
```
/setup-framework
/clickup setup
/clickup test-connection
```

This will ensure Claude reads all framework documentation and ClickUp integration is working.

## What Happens When Claude Starts

### Automatic File Reading
Claude Code automatically reads:
- ✅ `CLAUDE.md` (main instructions)
- ✅ `.claudecode` (configuration)

### Manual File Reading Required
Claude needs to manually read these critical files:
- 📖 `ORCHESTRATOR-GUIDE.md` (workflow examples)
- 📖 `FULL-WEBAPP-PROCESS.md` (4-phase web app process)
- 📖 `TASK-MANAGEMENT.md` (ClickUp setup and integration)
- 📖 `QUICK-REFERENCE.md` (command reference)
- 📖 `agent-templates/*.md` (agent behaviors with ClickUp workflows)

## Framework Commands to Try

### Basic Commands
```bash
/clickup show-status    # Show current ClickUp project status (PRIMARY)
/product [task]         # Activate Product Owner Agent (requirement analysis)
/design [task]          # Activate Designer Agent (page implementation)
/develop [task]         # Activate Developer Agent (backend integration)
/test [task]            # Activate QA Tester Agent (browser + database testing)
```

### ClickUp Management Commands
```bash
/clickup setup                    # Initialize ClickUp integration
/clickup test-connection          # Test API credentials
/clickup create-backlog           # Create comprehensive project backlog
/clickup show-validation-pending  # Tasks awaiting user validation
/clickup show-blockers           # All blocked tasks
```

### Full Web App Development (ClickUp-Integrated)
```bash
/webapp start       # Initialize 4-phase process (reads /project-documents + creates ClickUp backlog)
/webapp status      # Show current phase progress
/webapp validate    # Present current work to user for validation (creates ClickUp validation tasks)
/webapp user-feedback # Collect and document user feedback in ClickUp
```

## Expected First Interaction

```
User: I want to build a [describe your app]

Claude Response:
I'll help you build [your app]. Let me first read the framework documentation and initialize ClickUp integration.

[Claude reads ORCHESTRATOR-GUIDE.md, FULL-WEBAPP-PROCESS.md, and TASK-MANAGEMENT.md]

I'll use the enhanced 4-phase web app development process with ClickUp tracking:
1. Requirements & Planning + ClickUp Backlog (Product Owner creates comprehensive tasks)
2. Page Implementation (Designer implements ALL pages - USER VALIDATION REQUIRED)
3. Backend Integration (Developer adds data to existing pages - NO UI changes)
4. Comprehensive UAT (QA tests all user stories with browser + database validation)

First, let me verify your ClickUp credentials and create the project backlog...

/clickup test-connection
/product create-comprehensive-backlog

Let's start with Phase 1...
```

## Troubleshooting

### If Claude doesn't follow the process:
1. Remind Claude to read the framework files
2. Use `/setup-framework` command
3. Reference specific files: "Please read FULL-WEBAPP-PROCESS.md and TASK-MANAGEMENT.md"

### If ClickUp integration fails:
1. Check credentials in `CREDENTIALS.md` are correct
2. Run `/clickup test-connection` to verify API access
3. Ensure ClickUp list has required custom fields (see TASK-MANAGEMENT.md)
4. Verify API token has proper permissions

### If commands don't work:
1. Check that you're in the correct directory
2. Ensure `CLAUDE.md` and `CREDENTIALS.md` exist
3. Try `/clickup show-status` to see if framework is active
4. Verify `/project-documents` folder has your requirements

## Files Structure Check
Your project should have:
```
/your-project
  CLAUDE.md ✅ (Auto-read by Claude Code)
  CREDENTIALS.md ✅ (Contains your ClickUp API credentials)
  TASK-MANAGEMENT.md 📖 (ClickUp setup guide - Manual read required)
  ORCHESTRATOR-GUIDE.md 📖 (Manual read required)
  FULL-WEBAPP-PROCESS.md 📖 (Manual read required)
  QUICK-REFERENCE.md 📖 (Manual read required)
  /base-app/ ✅ (Reference design system - DO NOT MODIFY)
  /project-documents/ ✅ (Your PRD, user stories, design inspiration)
    PRD.md
    user-stories.md
    design-inspiration.md
    brand-guidelines.md
  /agent-templates/
    product-owner-prompt.md 📖 (NEW - Comprehensive requirement analysis)
    designer-prompt.md 📖 (Updated with ClickUp workflow)
    developer-prompt.md 📖 (Updated with ClickUp workflow)
    qa-tester-prompt.md 📖 (Updated with browser + database testing)
```

## ClickUp List Configuration Required
Before starting, ensure your ClickUp list has:

**Custom Fields:**
- ✅ Framework-Type (Text field)

**Statuses (use your existing ones):**
- ✅ BACKLOG, QUEUED, IN PROGRESS, BLOCKED, IN REVIEW, DONE, BUG, ARCHIVE

**Tags for organization:**
- ✅ Phase-1, Phase-2, Phase-3, Phase-4
- ✅ Designer, Developer, QA, Product-Owner

See `TASK-MANAGEMENT.md` for detailed ClickUp setup instructions.

The framework is ready to orchestrate your development process with comprehensive ClickUp tracking!