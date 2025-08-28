# 📋 Orchestrator Command Reference

## 🎯 Purpose
This document defines the **technical command interface** that the orchestrator (Claude) uses to execute user requests and maintain ClickUp project tracking. 

**User Interface**: Natural language requests ("Can you update the backlog?", "Fix the bugs", "Implement the dashboard")
**Orchestrator Interface**: These technical commands that translate user intent into systematic execution

> **📖 Implementation Details**: For detailed step-by-step flows that Claude follows when executing these commands, see the **[Command Implementation Details](#command-implementation-details)** section below.

## 📑 Quick Navigation
- **[High-Frequency Commands](#high-frequency-orchestrator-commands)** - Most common orchestrator operations
- **[Agent Delegation Commands](#agent-delegation-commands)** - Specialized agent activation  
- **[ClickUp Management Commands](#clickup-management-commands)** - Project tracking and status
- **[Process Automation Commands](#process-automation-commands)** - Batch operations and workflows
- **[User Request Translation](#user-request-translation-examples)** - How user requests map to commands
- **[Orchestrator Workflows](#orchestrator-workflow-examples)** - Complete command sequences
- **[Implementation Details](#command-implementation-details)** - Step-by-step execution flows

## 🚀 High-Frequency Orchestrator Commands
Commands the orchestrator uses most frequently when executing user requests:

| Command | When Orchestrator Uses It | User Request Examples |
|---------|---------------------------|----------------------|
| `/clickup show-status` | Check current project state before action | "What's the current status?", "How much progress have we made?" |
| `/fix reviews` | Auto-resolve all bug tasks systematically | "Fix the bugs", "Resolve the issues in ClickUp" |
| `/clickup create-backlog` | Initialize complete project task structure | "Set up the project", "Create the backlog", "Make ClickUp up to date" |
| `/webapp start` | Begin 4-phase development process | "Start building the app", "Initialize webapp development" |
| `/clickup user-validation [NAME]` | Create validation tasks when user input needed | When work needs user approval before proceeding |

## 🎯 Agent Delegation Commands
Commands the orchestrator uses to activate specialized agents for execution:

### Product Owner Agent Activation
| Command | Orchestrator Uses When | User Request Examples |
|---------|------------------------|----------------------|
| `/product create-comprehensive-backlog` | User wants complete project setup | "Set up the project", "Create all the tasks", "Analyze the requirements" |
| `/product [feature-analysis]` | Need detailed feature breakdown | "Break down this feature", "What tasks are needed for X?" |

### Designer Agent Activation  
| Command | Orchestrator Uses When | User Request Examples |
|---------|------------------------|----------------------|
| `/design [page-name]` | User wants UI/page implementation | "Implement the dashboard", "Create the login page", "Build the UI for X" |
| `/design page-specification` | Need detailed UI planning before implementation | Part of systematic page development workflow |
| `/design implement-page` | Ready to build the actual page | After specification phase is complete |

### Developer Agent Activation
| Command | Orchestrator Uses When | User Request Examples |
|---------|------------------------|----------------------|
| `/develop [feature-name]` | User wants backend/data functionality | "Add authentication", "Connect the database", "Make X work with real data" |
| `/develop backend-integration` | Need to connect data to existing UI | After Designer has completed pages |
| `/develop database-setup` | Initial database and API setup needed | Beginning of development phase |

### QA Tester Agent Activation
| Command | Orchestrator Uses When | User Request Examples |
|---------|------------------------|----------------------|
| `/test [feature-name]` | User wants functionality validated | "Test the login flow", "Make sure X works", "Check for bugs" |
| `/test validate-implementation` | Need systematic testing of completed work | Part of quality assurance workflow |
| `/test user-acceptance-testing` | Ready for final user validation | End of development phases |

### Cross-Agent Coordination
| Command | Orchestrator Uses When | Purpose |
|---------|------------------------|---------|
| `/review [agent] [deliverable]` | Quality check needed between agents | Ensure handoff quality between Designer→Developer or Developer→QA |

## 🗂️ ClickUp Management Commands
Commands the orchestrator uses for centralized project tracking and task management:

> **🔧 Implementation**: See [ClickUp Commands Implementation](#clickup-commands-implementation) below for detailed API workflows and error handling.

### Setup & Configuration (One-Time)
| Command | Orchestrator Uses When | User Context |
|---------|------------------------|--------------|
| `/clickup setup` | First time project initialization | User wants to start using ClickUp integration |
| `/clickup test-connection` | Verify ClickUp integration works | Troubleshooting ClickUp issues |

### Task Lifecycle Management
| Command | Orchestrator Uses When | User Request Examples |
|---------|------------------------|----------------------|
| `/clickup create-backlog` | User wants complete project setup | "Set up the project", "Create all tasks", "Make ClickUp up to date" |
| `/clickup start-task [NAME]` | Beginning work on specific feature/task | Before delegating to agents |
| `/clickup complete-task [NAME]` | Agent has finished work on task | After successful implementation |
| `/clickup user-validation [NAME]` | Work needs user approval before proceeding | When validation gates are reached |

### Project Status & Analysis  
| Command | Orchestrator Uses When | User Request Examples |
|---------|------------------------|----------------------|
| `/clickup show-status` | User asks about current state | "What's the status?", "How are we doing?", "Show me progress" |
| `/clickup show-progress` | User wants detailed metrics | "How much is completed?", "Generate a report" |
| `/clickup show-blockers` | User asks about issues/obstacles | "What's blocking us?", "Why isn't X done?" |
| `/clickup show-validation-pending` | User asks what needs their input | "What do you need from me?", "What's waiting for approval?" |
| `/clickup report-progress` | End of work session documentation | Document work completed in session |

### Task Investigation & Search
| Command | Orchestrator Uses When | Purpose |
|---------|------------------------|---------|
| `/clickup get-task [NAME]` | Need details about specific task | Find task context before starting work |
| `/clickup list-tasks` | Need overview of all project tasks | Project planning and prioritization |
| `/clickup list-tasks-by-agent [AGENT]` | Check agent workload distribution | Load balancing and workflow planning |
| `/clickup search-tasks [KEYWORD]` | Find specific tasks by content | Locate relevant work or dependencies |

### Webapp Development Process
Complete 4-phase webapp development with user validation gates:

> **🔧 Implementation**: See [Webapp Commands Implementation](#webapp-commands-implementation) below for detailed phase workflows and validation gates.

| Command | Description | Phase |
|---------|-------------|-------|
| `/webapp start` | Initialize webapp development (reads /project-documents) | Phase 1 Start |
| `/webapp phase [1-4]` | Jump to specific phase | Any Phase |
| `/webapp status` | Show current phase progress | Any Phase |
| `/webapp validate` | Present current work to user for validation | Phase 2 & 4 |
| `/webapp user-feedback` | Collect and document user feedback | After validation |

**Phase Overview:**
- **Phase 1**: Product Owner creates ClickUp backlog + App setup
- **Phase 2**: Designer implements ALL pages (⚠️ USER VALIDATION REQUIRED)
- **Phase 3**: Developer integrates data into existing pages
- **Phase 4**: QA executes UAT with user stories (⚠️ USER VALIDATION REQUIRED)

## 🤖 Process Automation Commands
Commands the orchestrator uses for batch operations and automated workflows:

### Automated Issue Resolution
| Command | Orchestrator Uses When | User Request Examples |
|---------|------------------------|----------------------|
| `/fix reviews` | User wants all bugs resolved systematically | "Fix the bugs", "Resolve all issues", "Clean up the ClickUp bugs" |

**`/fix reviews` Workflow:**
1. Automatically finds all ClickUp tasks with 'BUG' status
2. For each bug: sets to IN PROGRESS → analyzes description/images → implements fix → marks DONE
3. Updates ClickUp with detailed progress and completion comments
4. Handles image attachments (downloads and analyzes screenshots)

### Framework Initialization
| Command | Orchestrator Uses When | User Request Examples |
|---------|------------------------|----------------------|
| `/setup-framework` | First time session or framework reset | "Initialize the framework", "Set up the development process" |
| `/webapp start` | User wants to begin structured development | "Start building the app", "Initialize the project properly" |

### GitHub Integration  
| Command | Orchestrator Uses When | User Request Examples |
|---------|------------------------|----------------------|
| `/sync-commits [days]` | User wants GitHub activity in ClickUp | "Sync my commits to ClickUp", "Update ClickUp with my code changes" |

## 🔧 Setup & Utility Commands

### Framework Management
| Command | Description | When to Use |
|---------|-------------|-------------|
| `/setup-framework` | Initialize orchestrator framework | First time setup, new session |
| `/list-commands` | Show all available custom commands | Command discovery |

### GitHub Integration
| Command | Description | Example |
|---------|-------------|---------|
| `/sync-commits [days]` | Sync recent GitHub commits to ClickUp tasks | `/sync-commits 7` |

### Auto-Fix Commands
| Command | Description | Implementation Details |
|---------|-------------|------------------------|
| `/fix reviews` | Auto-find and fix ClickUp bug tasks | **[Detailed Implementation →](#fix-reviews-implementation)** |

### Command Implementation Details

#### `/fix reviews` Implementation

**Purpose**: Automatically finds ClickUp tasks with 'BUG' status and systematically fixes each one with proper ClickUp workflow tracking.

**Prerequisites**:
- ClickUp integration setup (API token in CREDENTIALS.md)
- Standard ClickUp status workflow: `BACKLOG → QUEUED → IN PROGRESS → BUG → DONE`

**Step-by-Step Flow**:

1. **Fetch Bug Tasks**
   ```bash
   curl -H "Authorization: ${CLICKUP_API_TOKEN}" \
     "https://api.clickup.com/api/v2/list/${CLICKUP_LIST_ID}/task?statuses[]=BUG"
   ```

2. **For Each Bug Task Found**:
   - Set task to `IN PROGRESS` status
   - Add start comment: `"🔧 [ORCHESTRATOR] Starting automated bug fix process"`
   - Check for image attachments and download them for analysis
   - Read task description and analyze context
   - Implement the required fix
   - Test the implementation
   - Set task to `DONE` status
   - Add completion comment with testing instructions

3. **Image Analysis Workflow**:
   - Downloads attached screenshots using: `curl -o /tmp/attachment.png "${ATTACHMENT_URL}"`
   - Uses Read tool to view and analyze images
   - Implements fixes based on visual context from screenshots

4. **ClickUp API Calls Used**:
   ```bash
   # Update status
   PUT /api/v2/task/${TASK_ID} {"status": "in progress"}
   
   # Add comments
   POST /api/v2/task/${TASK_ID}/comment {"comment_text": "..."}
   
   # Get task details with attachments
   GET /api/v2/task/${TASK_ID}
   ```

**Example Usage**:
- `/fix reviews` - Fix all bug tasks
- `/fix reviews ui` - Fix only UI-related bugs (if filtering implemented)

**Complete Implementation**: See `TASK-MANAGEMENT.md` section "/fix reviews Command Documentation" for full bash script template.

#### `/clickup` Commands Implementation

**Purpose**: Centralized ClickUp task management and progress tracking.

**Key API Workflows**:

1. **`/clickup show-status`**:
   ```bash
   # Fetch all tasks with details
   GET /api/v2/list/${LIST_ID}/task?include_closed=true&custom_fields=true
   
   # Process and analyze:
   - Total tasks by status (DONE, IN PROGRESS, BLOCKED, etc.)
   - Phase distribution using tags (Phase-1, Phase-2, etc.)
   - Agent workload using tags (Designer, Developer, QA)
   - Recent activity from task comments
   ```

2. **`/clickup start-task [NAME]`**:
   ```bash
   # Find task by name
   GET /api/v2/list/${LIST_ID}/task?search=${TASK_NAME}
   
   # Update task status
   PUT /api/v2/task/${TASK_ID} {"status": "in progress"}
   
   # Add start comment
   POST /api/v2/task/${TASK_ID}/comment 
   {"comment_text": "🔄 [AGENT] Starting work on ${TASK_NAME}"}
   ```

3. **`/clickup create-backlog`**:
   - Reads all files in `/project-documents/` folder
   - Extracts pages/features from PRD and user stories
   - Creates tasks with standard subtask structure
   - Sets up tags, custom fields, and priorities

**Implementation Details**: See `TASK-MANAGEMENT.md` sections for complete API call examples and error handling.

#### `/webapp` Commands Implementation

**Purpose**: 4-phase webapp development process with user validation gates.

**Phase Flow**:

1. **`/webapp start`**:
   - **MUST** read all `/project-documents/` files first
   - Delegates to Product Owner Agent for backlog creation
   - Initializes ClickUp with complete project structure
   - Sets up Phase-1 tags for all created tasks

2. **`/webapp phase [1-4]`**:
   - **Phase 1**: Product Owner creates ClickUp backlog + App setup
   - **Phase 2**: Designer implements pages (⚠️ USER VALIDATION REQUIRED)
   - **Phase 3**: Developer integrates data into existing pages
   - **Phase 4**: QA executes UAT (⚠️ USER VALIDATION REQUIRED)

3. **`/webapp validate`**:
   - Creates user validation tasks in ClickUp
   - Sets tasks to `IN REVIEW` status
   - Assigns to user with notification
   - Blocks dependent tasks until validation complete

**Validation Gates**: Phases 2 and 4 require mandatory user validation before proceeding. Framework automatically creates validation tasks and manages blocker workflow.

**Implementation Details**: See `FULL-WEBAPP-PROCESS.md` for complete 4-phase workflow specifications.

#### Agent Commands Implementation

**Common Pattern for All Agent Commands**:

1. **Find Relevant ClickUp Task**:
   ```bash
   # Search for task by agent and feature name
   GET /api/v2/list/${LIST_ID}/task?search=[AGENT]+${FEATURE_NAME}
   ```

2. **Update Task Progress**:
   ```bash
   # Update subtask status
   PUT /api/v2/task/${SUBTASK_ID} {"status": "in progress"}
   
   # Add agent start comment
   POST /api/v2/task/${TASK_ID}/comment 
   {"comment_text": "🎨 [DESIGNER AGENT] Starting ${SUBTASK_NAME}"}
   ```

3. **Complete Work with Updates**:
   ```bash
   # Mark subtask complete
   PUT /api/v2/task/${SUBTASK_ID} {"status": "done"}
   
   # Add completion comment with details
   POST /api/v2/task/${TASK_ID}/comment 
   {"comment_text": "✅ Completed: ${WORK_SUMMARY}"}
   ```

**Agent-Specific Workflows**:
- **Designer**: Guards design system, builds pages using `/base-app/` reference
- **Developer**: Backend-only, never modifies UI, integrates data into existing pages
- **QA**: Browser testing with Playwright MCP, database validation with Supabase MCP
- **Product Owner**: Requirements analysis, comprehensive backlog creation

**Implementation Details**: See agent templates in `/agent-templates/` for complete role specifications.

## 🔍 Orchestrator Command Discovery

### Help System Commands
| Command | Orchestrator Uses When | Purpose |
|---------|------------------------|---------|
| `/help` | User asks about available commands | Show categorized command reference |
| `/help agent` | User asks about development roles | Show agent delegation commands |
| `/help clickup` | User asks about project management | Show ClickUp integration commands |
| `/list-commands` | User wants complete command overview | Show all available custom commands |

### Context-Sensitive Command Selection
When orchestrator needs to:

**Resolve Issues:**
- User says "Fix bugs" → Use `/fix reviews` (auto-find and fix ClickUp bugs)
- User says "There's a problem with X" → Delegate to appropriate agent + ClickUp tracking

**Implement Features:**
- User says "Build X page" → Use `/design [page-name]` (using design system)
- User says "Add Y functionality" → Use `/develop [feature]` (Supabase integration)
- User says "Make sure Z works" → Use `/test [feature]` (browser + database testing)

**Manage Project:**
- User says "What's the status?" → Use `/clickup show-status`
- User says "Set up the project" → Use `/clickup create-backlog` or `/webapp start`
- User says "What needs my approval?" → Use `/clickup show-validation-pending`

## 📋 Orchestrator Workflow Examples

### User Request: "Implement the dashboard feature"
**Orchestrator Command Sequence:**
```bash
1. /clickup show-status                     # Check current project state
2. /clickup get-task "Dashboard Implementation"  # Find relevant ClickUp task
3. /design dashboard-page                   # Delegate to Designer Agent
   → Designer follows agent-templates/designer-prompt.md workflow
   → Auto-updates ClickUp with progress
4. /clickup user-validation "Dashboard"     # Create user validation task
5. /develop dashboard-backend               # Delegate to Developer Agent  
   → Developer integrates data into Designer's page
6. /test dashboard-functionality            # Delegate to QA Agent
   → QA validates complete dashboard workflow
```

### User Request: "Fix all the bugs in the project"  
**Orchestrator Command Sequence:**
```bash
1. /fix reviews                             # Automated bug resolution
   → Finds all ClickUp tasks with BUG status
   → For each bug: analyze → implement fix → update ClickUp
   → Handles image attachments automatically
2. /test validate-fixes                     # Comprehensive testing of fixes
3. /clickup report-progress                 # Document session results
```

### User Request: "Set up the project properly"
**Orchestrator Command Sequence:**
```bash
1. /setup-framework                         # Initialize orchestrator framework
2. /clickup setup                           # Configure ClickUp integration
3. /webapp start                            # Begin 4-phase development process
   → Reads all files in /project-documents/
   → Delegates to Product Owner for backlog creation
   → Creates complete ClickUp task structure
4. /clickup show-status                     # Confirm setup completion
```

## 🚫 Legacy Commands (Deprecated)
These commands now redirect to ClickUp equivalents:

| Old Command | New Command | Description |
|-------------|-------------|-------------|
| `/scratchpad` | `/clickup show-status` | View project status |
| `/scratchpad update` | `/clickup report-progress` | Generate progress report |
| `/scratchpad reset` | `/clickup create-backlog` | Reset project structure |
| `/status` | `/clickup show-status` | Current project status |

## 🏗️ Technology Stack Requirements
All commands assume this **MANDATORY** technology stack:
- **Framework**: Next.js (App Router)
- **UI Library**: React + shadcn/ui
- **Database**: Supabase  
- **Styling**: Tailwind CSS (included with shadcn)
- **Language**: TypeScript

## 🗣️ User Request Translation Examples

Understanding how natural language user requests map to orchestrator command execution:

### Project Setup & Management
| User Says | Orchestrator Executes | Result |
|-----------|----------------------|--------|
| "Can you make the ClickUp backlog up to date?" | `/clickup create-backlog` | Complete project task structure created |
| "Set up the project properly" | `/webapp start` | 4-phase development process initialized |
| "What's the current status?" | `/clickup show-status` | Project overview with task states |
| "How much progress have we made?" | `/clickup show-progress` | Detailed progress metrics and analysis |

### Feature Development  
| User Says | Orchestrator Executes | Result |
|-----------|----------------------|--------|
| "Implement the dashboard page" | `/design dashboard-page` → `/clickup start-task "Dashboard Page"` | Designer agent creates dashboard UI |
| "Add user authentication" | `/develop user-authentication` → Agent workflow | Developer agent implements auth backend |
| "Connect the data to the pages" | `/develop backend-integration` | Developer integrates APIs into existing UI |
| "Test the login flow" | `/test login-flow` | QA agent validates functionality |

### Issue Resolution
| User Says | Orchestrator Executes | Result |
|-----------|----------------------|--------|
| "Fix the bugs in the project" | `/fix reviews` | All BUG status tasks automatically resolved |
| "There's an issue with X" | Agent delegation + ClickUp tracking | Systematic issue resolution with updates |
| "Make sure everything works" | `/test user-acceptance-testing` | Comprehensive QA validation |

### Progress & Coordination
| User Says | Orchestrator Executes | Result |
|-----------|----------------------|--------|
| "What do you need from me?" | `/clickup show-validation-pending` | List of tasks awaiting user approval |
| "What's blocking us?" | `/clickup show-blockers` | Current obstacles and dependencies |
| "Generate a progress report" | `/clickup report-progress` | Detailed session summary for stakeholders |

## 🔄 Orchestrator Decision Flow

**When user makes a request, orchestrator:**

1. **Analyzes Intent** - What does the user want to accomplish?
2. **Checks ClickUp State** - Uses `/clickup show-status` to understand current project state
3. **Plans Execution** - Selects appropriate commands and agent delegation
4. **Executes Systematically** - Runs commands with ClickUp tracking
5. **Reports Results** - Summarizes what was accomplished for the user

**Example Flow:**
```
User: "Implement the dashboard page"
↓
Orchestrator: /clickup show-status (check current state)
↓  
Orchestrator: /clickup get-task "Dashboard Page Implementation"
↓
Orchestrator: /design dashboard-page (delegate to Designer Agent)
↓
Designer Agent: Follows agent-templates/designer-prompt.md workflow
↓
Orchestrator: Synthesizes results and reports completion to user
```

## 📁 Required File Structure
Commands expect this project structure:
```
/project-documents/          # PRD, user stories, requirements
/base-app/                  # Design system reference
/CREDENTIALS.md             # ClickUp API credentials
/CLAUDE.md                  # Framework configuration
/COMMANDS.md               # This file
/agent-templates/           # Agent behavior instructions
```

## 🔗 Related Documentation
- **CLAUDE.md** - Main framework overview and agent personas
- **QUICK-REFERENCE.md** - Essential commands and workflows
- **FULL-WEBAPP-PROCESS.md** - Complete 4-phase development process
- **TASK-MANAGEMENT.md** - ClickUp setup and integration details
- **ORCHESTRATOR-GUIDE.md** - Detailed workflow examples
- **agent-templates/** - Agent behavior and workflow specifications