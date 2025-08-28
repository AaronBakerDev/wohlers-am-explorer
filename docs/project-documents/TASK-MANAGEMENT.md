# 📋 Centralized Task Management with ClickUp

## Overview
This framework uses ClickUp as the **single source of truth** for all project planning, task tracking, and progress reporting. The orchestrator creates a **complete project backlog** during Phase 1, with business-focused tasks (features/pages) rather than framework phases. Framework phases are tracked via tags and custom fields.

## 🔧 Initial Setup Requirements

### 1. ClickUp List Configuration (User Setup Required)

Before using the framework, you must configure your ClickUp list with specific statuses and custom fields:

#### Required Statuses
Use your existing ClickUp statuses:
```
Active Section:
📋 BACKLOG
⏳ QUEUED  
🔄 IN PROGRESS
🐛 BUG
🚨 BLOCKED

Done Section:
👀 IN REVIEW
✅ DONE

Closed Section:
📦 ARCHIVE
```

#### Required Custom Fields
Add only this custom field to your ClickUp list:

**Text Field:**
- **Framework-Type** (Text): "Page Implementation", "Backend Integration", "QA Testing", "User Validation"

#### Use Existing Features:
- **Priority**: Use your existing Priority field
- **Agent**: Use Tags (Designer, Developer, QA)
- **Phase**: Use Tags (Phase-1, Phase-2, Phase-3, Phase-4)
- **Validation Required**: Move task to **IN REVIEW** status
- **Blockers**: Move task to **BLOCKED** status

#### Required Tags
These tags will be created automatically in your ClickUp workspace:
```
Phases: Phase-1, Phase-2, Phase-3, Phase-4
Agents: Designer, Developer, QA  
Types: Page-Implementation, Backend-Integration, QA-Testing, User-Validation
```

### 2. API Configuration

#### How to Get Your ClickUp Credentials:

**ClickUp API Token:**
1. Go to ClickUp Settings (click your profile picture)
2. Navigate to "Apps" 
3. Click "API" 
4. Click "Generate" to create a new token
5. Copy the token (starts with "pk_")

**ClickUp List ID:**
1. Go to your ClickUp List
2. Look at the URL: `https://app.clickup.com/[team_id]/v/li/[LIST_ID]`
3. Copy the LIST_ID from the URL

**Configure in Framework:**
```bash
# 1. First, configure your credentials in CREDENTIALS.md file
# 2. Then initialize ClickUp integration:
/clickup setup
/clickup test-connection
```

**IMPORTANT**: The orchestrator reads credentials from `CREDENTIALS.md` file in the project root. You MUST configure your ClickUp API token and List ID in that file before using any ClickUp features.

**Security Notes:**
- Credentials are stored in CREDENTIALS.md (keep this file private)
- API tokens are read from file, not passed as parameters
- Use personal tokens, not team tokens for better security
- Add CREDENTIALS.md to .gitignore to prevent accidental commits

### 3. Step-by-Step ClickUp Configuration

#### How to Add Custom Fields:
1. Go to your ClickUp List
2. Click "..." menu → "Settings" → "Custom Fields"
3. Click "+ Add Field" for each required field:

**Framework-Type Field (only new field needed):**
- Name: "Framework-Type"
- Type: Text
- Purpose: Categorize task types for framework organization

**Use Your Existing Features:**
- **Priority**: Already exists in your ClickUp
- **Tags**: Will be used for Agent and Phase tracking
- **Status**: IN REVIEW for validation, BLOCKED for blockers

#### Status Usage in Framework:
Your existing statuses will be used as follows:
- **BACKLOG** → New tasks created during backlog phase
- **QUEUED** → Tasks ready to start (waiting for agent availability)
- **IN PROGRESS** → Active agent work
- **BLOCKED** → Cannot proceed (waiting for dependencies/user input)
- **IN REVIEW** → User validation needed
- **DONE** → Task completed and validated
- **BUG** → Issues found during QA testing
- **ARCHIVE** → Historical tasks (completed projects)

#### How to Create Tags:
1. Tags are created automatically when first used
2. Or manually create in ClickUp Settings → Tags
3. Required tags: Phase-1, Phase-2, Phase-3, Phase-4, Designer, Developer, QA

### 4. Setup Verification
```bash
/clickup setup [API_TOKEN] [LIST_ID]
/clickup test-connection
→ Verifies all required custom fields and statuses exist
→ Creates missing tags if needed  
→ Confirms API permissions
→ Reports any missing configuration items
```

## 📋 Phase 1: Complete Backlog Creation

During Phase 1, the orchestrator analyzes project-documents and creates the **ENTIRE PROJECT BACKLOG** with all tasks that will be needed. This provides complete visibility from the start.

### Backlog Creation Process
```bash
1. Analyze all documents in /project-documents
2. Identify all pages/features from requirements
3. Identify all backend integrations needed
4. Create ClickUp tasks for each deliverable
5. Populate subtasks using standard templates
6. Set initial priorities and dependencies
7. Tag all tasks with "Phase-1" (planning phase)
```

## 🎯 Task Structure Examples

### [Designer] Page Implementation Tasks
```
📋 [Designer] Dashboard Page Implementation
├── 📄 Page structure requirement document
├── 💻 Page implementation with design system
├── 👀 Page testing/user feedback collection  
└── ✅ Page final implementation with feedback

📋 [Designer] Task List Page Implementation  
├── 📄 Page structure requirement document
├── 💻 Page implementation with design system
├── 👀 Page testing/user feedback collection
└── ✅ Page final implementation with feedback

📋 [Designer] User Profile Page Implementation
├── 📄 Page structure requirement document  
├── 💻 Page implementation with design system
├── 👀 Page testing/user feedback collection
└── ✅ Page final implementation with feedback
```

### [Developer] Backend Implementation Tasks
```
📋 [Developer] Supabase Database Integration
├── 🏗️ Project/Database setup and configuration
├── 📝 TypeScript types generation
├── 🔌 API routes creation
└── ⚙️ CRUD operations implementation

📋 [Developer] Task Management Data Integration
├── 🔗 Bind data in task list page
├── 📝 Frontend CRUD workflows
├── 🔍 Search and filtering implementation
└── ✅ Data validation and error handling

📋 [Developer] User Authentication Integration  
├── 🔐 Supabase Auth setup
├── 🚪 Login/logout flows
├── 👤 User profile management
└── 🛡️ Route protection middleware
```

## 🤖 Orchestrator ClickUp Management

### Project Initialization (`/webapp start`)
```bash
# Phase 1: Orchestrator creates COMPLETE backlog in ClickUp:

1. Analyze all files in /project-documents folder
2. Extract pages/features from PRD and user stories
3. For each page identified:
   - Create "[Designer] [PAGE_NAME] Page Implementation" task
   - Add 4 standard subtasks (requirement → implementation → testing → final)
4. For each backend feature identified:
   - Create "[Developer] [FEATURE_NAME] Integration" task  
   - Add relevant subtasks based on feature complexity
5. Set up custom fields and tags:
   - Agent: [Designer/Developer/QA]
   - Current-Phase: [Phase-1/Phase-2/Phase-3/Phase-4]
   - Validation-Required: [Yes/No]
   - Priority: [High/Medium/Low]
6. Set initial task priorities based on dependencies
7. All tasks start with "Phase-1" tag (planning phase)
```

### Task Status Management
```bash
# When orchestrator delegates work:

/design dashboard-page-specification
→ Finds: "[Designer] Dashboard Page Implementation" task
→ Updates subtask: "Page structure requirement document" 
  - Status: In Progress
  - Assigned: Designer Agent (custom field)
  - Tag: Phase-2 (specification phase)
  - Comment: "🎨 [DESIGNER AGENT] started page specification work"

# When agent completes work:
→ Updates subtask status: Complete
→ Updates tag: Phase-2 → Phase-3 (if moving to backend work)
→ Comment: "✅ Completed: Dashboard page specification with component breakdown"
→ Updates next subtask: "Page implementation with design system" → To Do
```

### Dynamic Task Creation
```bash
# When feedback requires new work:

User feedback: "We need a forgot password page"
→ Creates new task: "[Designer] Forgot Password Page Implementation"
→ Adds standard 4 subtasks
→ Sets priority: High (blocking auth flow)
→ Tags: Phase-2 (needs specification)
→ Comment: "📋 NEW TASK: Added based on user feedback during testing"
```

## 📊 Status Management

### ClickUp Status Flow
```
BACKLOG → QUEUED → IN PROGRESS → IN REVIEW → DONE
                      ↓              ↑
                   BLOCKED ────────────┘
                      ↓
                    BUG (if issues found)
                      ↓
                   ARCHIVE (completed projects)
```

### Tags Usage (Framework Phases)
- **Phase-1**: Planning and backlog creation
- **Phase-2**: Page specifications and implementation  
- **Phase-3**: Backend development and data integration
- **Phase-4**: QA testing and user validation

### Custom Fields Usage
- **Agent**: [Designer/Developer/QA] - Which agent is responsible
- **Validation-Required**: [Yes/No] - Flags tasks needing user approval  
- **Priority**: [High/Medium/Low] - Task priority for scheduling
- **Blocker**: [Yes/No] - Identifies blocking issues

### Status & Tag Coordination
```bash
# Task progression through framework:
Phase-1 (Planning) → Phase-2 (Implementation) → Phase-3 (Backend) → Phase-4 (QA)

# Within each phase:
BACKLOG → QUEUED → IN PROGRESS → IN REVIEW → DONE

# Example progression:
[Designer] Dashboard Page Implementation
├── Phase-1: BACKLOG (created during planning)
├── Phase-2: QUEUED → IN PROGRESS (specification and implementation work)  
├── User validation: IN REVIEW → DONE (user approves)
└── Phase-4: IN REVIEW → DONE (QA testing and final validation)

# If issues found:
IN PROGRESS → BUG → IN PROGRESS → IN REVIEW → DONE
```

## 🔄 Real-Time Updates

### Agent Task Updates
```bash
# When agent starts subtask:
CLICKUP_UPDATE: {
  subtask_id: [SUBTASK_ID],
  status: "IN PROGRESS", 
  comment: "🎨 [DESIGNER AGENT] - Starting dashboard page specification",
  tags: ["Phase-2", "Designer"],
  custom_fields: {
    framework_type: "Page Implementation"
  }
}

# During subtask progress:
CLICKUP_UPDATE: {
  subtask_id: [SUBTASK_ID],
  comment: "Progress update: Defined component structure and data requirements",
  custom_fields: {
    completion_percentage: 70
  }
}

# When subtask completed:
CLICKUP_UPDATE: {
  subtask_id: [SUBTASK_ID],
  status: "DONE",
  comment: "✅ Completed: Dashboard page specification with component breakdown and design system mapping",
  attachments: [specification_document_link]
}

# Automatically start next subtask:
CLICKUP_UPDATE: {
  next_subtask_id: [NEXT_SUBTASK_ID],
  status: "QUEUED",
  comment: "🔄 Ready for implementation phase"
}
```

### Cross-Task Dependencies
```bash
# Some tasks depend on others being complete:
# Example: "[Developer] Task Data Integration" depends on "[Designer] Task List Page Implementation"

CLICKUP_UPDATE: {
  task_id: "[Developer] Task Data Integration",
  depends_on: "[Designer] Task List Page Implementation",
  status: "BLOCKED",
  comment: "⏳ Waiting for task list page implementation to complete before starting data integration"
}

# When dependency is resolved:
CLICKUP_UPDATE: {
  task_id: "[Developer] Task Data Integration", 
  status: "QUEUED",
  comment: "✅ Dependency resolved: Task list page complete, ready to start data integration"
}
```

## 🚨 Blocker & Issue Tracking

### Blocker Workflow
```bash
# When blocker identified:
CLICKUP_UPDATE: {
  subtask_id: [SUBTASK_ID],
  status: "BLOCKED", 
  comment: "🚨 BLOCKED: Need user feedback on dashboard page implementation before proceeding to final version",
  priority: "high",
  tags: ["Phase-2", "Designer", "User-Validation"]
}

# Create user validation task:
CLICKUP_CREATE_TASK: {
  name: "USER VALIDATION: Dashboard page review",
  description: "Please review the dashboard page at [URL] and provide feedback",
  assigned_to: "User",
  status: "IN REVIEW",
  priority: "high", 
  due_date: "+2 days",
  depends_on: [BLOCKED_SUBTASK_ID]
}

# When blocker resolved:
CLICKUP_UPDATE: {
  subtask_id: [SUBTASK_ID],
  status: "IN PROGRESS",
  comment: "✅ UNBLOCKED: User feedback received, implementing changes",
  tags: ["Phase-2", "Designer"] # Remove User-Validation tag
}
```

## 📈 Progress Reporting

### Session Progress Updates
```bash
# End of each session - comment on main project or individual tasks:
CLICKUP_COMMENT: {
  comment: "📊 Session Progress Update:
  
  Completed Today:
  - ✅ [Designer] Dashboard Page Implementation → Page specification complete
  - ✅ [Designer] Login Page Implementation → Implementation phase complete
  
  In Progress: 
  - 🔄 [Designer] Task List Page Implementation → Working on page specification
  - 🔄 [Developer] Supabase Database Integration → Setting up tables
  
  Next Session:
  - 📋 Complete task list page specification  
  - 📋 Begin task list page implementation
  - 📋 Continue database setup
  
  Blockers: 
  - Dashboard page waiting for user feedback (validation task created)
  
  Overall Progress: 
  - Designer tasks: 40% complete (3/8 pages done)
  - Developer tasks: 20% complete (1/5 integrations started)"
}
```

### Milestone Tracking
```bash
# When major milestones reached:
CLICKUP_COMMENT: {
  comment: "🎉 MILESTONE: All Designer page implementations complete!
  
  Summary:
  - 8 pages fully implemented with design system
  - All pages validated by user  
  - Ready for Phase 3: Backend data integration
  
  Next: Developer agent to begin data integration tasks"
}
```

## 🎯 User Validation Integration

### Validation Task Creation
```bash
# When user validation needed (typically for "testing/feedback" subtasks):
CLICKUP_CREATE_TASK: {
  name: "USER VALIDATION: Dashboard page review", 
  description: "Please review the dashboard page implementation at [URL] and provide feedback:
  
  Review checklist:
  - Does the layout match expectations?
  - Are all required features present?
  - Any usability issues?
  - Suggestions for improvements?",
  assigned_to: "User",
  priority: "high",
  due_date: "+2 days",
  custom_fields: {
    validation_required: true,
    agent_waiting: "Designer"
  },
  depends_on: "[Designer] Dashboard Page Implementation → Page implementation subtask"
}
```

### Validation Response Handling
```bash
# After user provides feedback:
CLICKUP_UPDATE: {
  task_id: [VALIDATION_TASK_ID],
  status: "DONE",
  comment: "✅ User feedback received: Minor layout adjustments needed + add search functionality",
  tags: ["User-Validation", "Completed"]
}

# Update the original task's final subtask:
CLICKUP_UPDATE: {
  subtask_id: "[Designer] Dashboard Page Implementation → Page final implementation",
  status: "IN PROGRESS",
  comment: "🔄 Implementing user feedback: layout adjustments and search feature addition"
}

# If major changes needed, create new tasks:
IF feedback_category == "major_changes":
  CLICKUP_CREATE_TASK: {
    name: "[Designer] Dashboard Search Feature Implementation",
    subtasks: ["Specification", "Implementation", "Testing", "Final"]
  }
```

## 🔍 ClickUp Data Fetching & Analysis

### Project Status Overview
```bash
/clickup show-status
→ Fetches and displays:
• Total tasks: 12 (8 completed, 3 in progress, 1 blocked)
• Phase distribution: Phase-2 (60%), Phase-3 (30%), Phase-4 (10%)  
• Agent workload: Designer (4 tasks), Developer (3 tasks), QA (1 task)
• Validation pending: 2 tasks waiting for user approval
• Recent activity: Last 5 task updates with timestamps
```

### Detailed Progress Analysis  
```bash
/clickup show-progress
→ Generates comprehensive report:
• Overall completion: 67% (8 of 12 tasks complete)
• Phase-by-phase breakdown with completion percentages
• Time tracking: Average task completion time, velocity trends
• Blocker analysis: Current blockers and resolution time
• User validation metrics: Response time, approval rate
• Agent productivity: Tasks completed per agent per phase
```

### Task-Level Investigation
```bash
/clickup get-task "Dashboard Page Implementation"
→ Returns detailed task information:
• Task ID, status, priority, assignee (Designer)
• All 4 subtasks with individual completion status
• Custom fields: Agent=Designer, Phase=Phase-2, Validation-Required=Yes
• Dependencies: Depends on "Requirements Analysis" (complete)
• Comments timeline: All progress updates and decisions
• Attachments: Links to specification documents, page URLs
• Time tracking: Started date, estimated vs actual time
• Related tasks: Backend integration task dependency
```

### Agent-Specific Workload
```bash
/clickup list-tasks-by-agent Designer
→ Shows Designer's current workload:
• ✅ Dashboard Page Implementation (100% - user validated)
• 🔄 Task List Page Implementation (75% - in final implementation)  
• ⏳ Settings Page Implementation (0% - waiting for task list completion)
• 🚨 Profile Page Implementation (blocked - waiting for user feedback)
```

### Phase-Based Planning
```bash
/clickup list-tasks-by-phase Phase-3  
→ Shows all backend development tasks:
• 🔄 Supabase Database Integration (50% - tables created)
• ⏳ Task Data Integration (0% - waiting for task list page)
• ⏳ User Authentication Integration (0% - ready to start)
• ⏳ Profile Data Integration (blocked - waiting for profile page)
```

### User Validation Tracking
```bash
/clickup show-validation-pending
→ Lists tasks waiting for user input:
• USER VALIDATION: Dashboard page review (assigned 2 days ago)
• USER VALIDATION: Task creation workflow testing (assigned yesterday)  
• Estimated user review time needed: 3-4 hours
• Impact on project: 2 tasks blocked until validation complete
```

### User Validation Tracking
```bash
/clickup show-validation-pending
→ Lists tasks waiting for user input:
• USER VALIDATION: Dashboard page review (assigned 2 days ago)
• USER VALIDATION: Task creation workflow testing (assigned yesterday)  
• Estimated user review time needed: 3-4 hours
• Impact on project: 2 tasks blocked until validation complete
```
/fix reviews Command Documentation

  Command Overview

  Automatically finds ClickUp tasks with 'BUG' status and systematically fixes each one with
   proper ClickUp workflow tracking.

  Prerequisites

  1. ClickUp Integration Setup:
    - API token in CREDENTIALS.md file
    - List ID configured
    - Standard status workflow: BACKLOG → QUEUED → IN PROGRESS → BUG → DONE
  2. Required File Structure:
  CREDENTIALS.md (contains):
  CLICKUP_API_TOKEN=pk_xxxxxxx
  CLICKUP_LIST_ID=xxxxxxxxx

  Command Syntax

  /fix reviews [optional: filter]

  Implementation Logic

  Step 1: Fetch Bug Tasks

  curl -H "Authorization: ${CLICKUP_API_TOKEN}" \
    "https://api.clickup.com/api/v2/list/${CLICKUP_LIST_ID}/task?statuses[]=BUG" | jq '.'

  Step 2: Process Each Bug Task

  For each bug task found:

  1. Set to IN PROGRESS:
  curl -X PUT -H "Authorization: ${CLICKUP_API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"status": "in progress"}' \
    "https://api.clickup.com/api/v2/task/${TASK_ID}"
  2. Add Start Comment:
  curl -X POST -H "Authorization: ${CLICKUP_API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"comment_text": "🔧 [ORCHESTRATOR] Starting automated bug fix process - 
  [description]", "notify_all": false}' \
    "https://api.clickup.com/api/v2/task/${TASK_ID}/comment"
  3. Check for Image Attachments:
    - Look for attachments array in task response
    - Download and analyze any images using attachment URLs:
    curl -o /tmp/attachment.png "${ATTACHMENT_URL}"
  # Then use Read tool to view the image
  4. Implement Fix:
    - Read task description and analyze any attached images
    - Implement the required bug fix or feature
    - Test the implementation
  5. Mark as DONE:
  curl -X PUT -H "Authorization: ${CLICKUP_API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"status": "done"}' \
    "https://api.clickup.com/api/v2/task/${TASK_ID}"
  6. Add Completion Comment:
  curl -X POST -H "Authorization: ${CLICKUP_API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"comment_text": "✅ [ORCHESTRATOR] Bug fix complete - [description]\n\n**How to 
  test:**\n[detailed testing instructions]", "notify_all": false}' \
    "https://api.clickup.com/api/v2/task/${TASK_ID}/comment"

  Complete Implementation Template

  #!/bin/bash
  # /fix reviews command implementation

  # Read credentials
  CLICKUP_API_TOKEN=$(grep "CLICKUP_API_TOKEN" CREDENTIALS.md | cut -d'=' -f2)
  CLICKUP_LIST_ID=$(grep "CLICKUP_LIST_ID" CREDENTIALS.md | cut -d'=' -f2)

  echo "🔍 Fetching tasks with BUG status..."

  # Fetch all bug tasks
  BUG_TASKS=$(curl -s -H "Authorization: $CLICKUP_API_TOKEN" \
    "https://api.clickup.com/api/v2/list/$CLICKUP_LIST_ID/task?statuses[]=BUG")

  # Count bug tasks
  BUG_COUNT=$(echo "$BUG_TASKS" | jq '.tasks | length')

  if [ "$BUG_COUNT" -eq 0 ]; then
    echo "✅ No bug tasks found!"
    exit 0
  fi

  echo "🐛 Found $BUG_COUNT bug tasks to fix"

  # Process each bug task
  echo "$BUG_TASKS" | jq -r '.tasks[] | "\(.id)|\(.name)"' | while IFS='|' read -r TASK_ID
  TASK_NAME; do
    echo "🔧 Processing: $TASK_NAME"

    # 1. Set to IN PROGRESS
    curl -s -X PUT -H "Authorization: $CLICKUP_API_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"status": "in progress"}' \
      "https://api.clickup.com/api/v2/task/$TASK_ID" > /dev/null

    # 2. Add start comment
    curl -s -X POST -H "Authorization: $CLICKUP_API_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"comment_text\": \"🔧 [ORCHESTRATOR] Starting automated bug fix process - 
  $TASK_NAME\", \"notify_all\": false}" \
      "https://api.clickup.com/api/v2/task/$TASK_ID/comment" > /dev/null

    # 3. Get full task details including attachments
    TASK_DETAILS=$(curl -s -H "Authorization: $CLICKUP_API_TOKEN" \
      "https://api.clickup.com/api/v2/task/$TASK_ID")

    # 4. Check for image attachments
    ATTACHMENTS=$(echo "$TASK_DETAILS" | jq '.attachments[]?.url // empty' | tr -d '"')

    if [ ! -z "$ATTACHMENTS" ]; then
      echo "📎 Found image attachments, downloading for analysis..."
      echo "$ATTACHMENTS" | while read -r URL; do
        if [ ! -z "$URL" ]; then
          curl -s -o "/tmp/$(basename "$URL").png" "$URL"
          echo "📷 Downloaded: $(basename "$URL").png"
        fi
      done
    fi

    # 5. Get task description
    DESCRIPTION=$(echo "$TASK_DETAILS" | jq -r '.description // .text_content // ""')
    echo "📝 Task description: $DESCRIPTION"

    # 6. IMPLEMENT FIX HERE
    # This is where you would add the actual fix logic
    # Based on task description and any downloaded images
    echo "⚙️ Implementing fix for: $TASK_NAME"

    # 7. Mark as DONE
    curl -s -X PUT -H "Authorization: $CLICKUP_API_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"status": "done"}' \
      "https://api.clickup.com/api/v2/task/$TASK_ID" > /dev/null

    # 8. Add completion comment
    curl -s -X POST -H "Authorization: $CLICKUP_API_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"comment_text\": \"✅ [ORCHESTRATOR] Bug fix complete - $TASK_NAME\\n\\n**How to
   test:**\\n[Add specific testing instructions based on the fix implemented]\", 
  \"notify_all\": false}" \
      "https://api.clickup.com/api/v2/task/$TASK_ID/comment" > /dev/null

    echo "✅ Completed: $TASK_NAME"
  done

  echo "🎉 All bug fixes completed!"

  Key Features

  - ✅ Automatic bug detection: Finds all tasks with 'BUG' status
  - ✅ Proper workflow tracking: Updates ClickUp status throughout process
  - ✅ Image analysis: Downloads and analyzes attached screenshots
  - ✅ Progress comments: Adds detailed comments at start and completion
  - ✅ Testing instructions: Provides clear testing guidance
  - ✅ Batch processing: Handles multiple bugs in one command

  Usage Examples

  /fix reviews                    # Fix all bug tasks
  /fix reviews ui                 # Fix only UI-related bugs (if filtering implemented)
  /fix reviews critical           # Fix only critical bugs (if filtering implemented)


## 🔧 Orchestrator Commands

### ClickUp Management Commands
```bash
# Setup & Configuration
/clickup setup [API_TOKEN] [LIST_ID]           # Initial ClickUp configuration  
/clickup test-connection                       # Test API connection and permissions

# Project Planning
/clickup create-backlog                        # Create complete project backlog in Phase 1
/clickup add-task [TASK_NAME] [AGENT]          # Add new task dynamically  

# Task Management
/clickup start-task [TASK_NAME]                # Start specific task/subtask
/clickup complete-task [TASK_NAME]             # Mark task/subtask complete
/clickup block-task [TASK_NAME] [REASON]       # Mark task as blocked
/clickup user-validation [TASK_NAME]           # Create user validation task

# Progress Monitoring & Reporting
/clickup show-status                           # Show current task statuses
/clickup show-progress                         # Show overall project progress percentage
/clickup show-blockers                         # Show all blocked tasks
/clickup show-validation-pending              # Show tasks waiting for user validation
/clickup report-progress                       # Generate detailed session progress report

# Task Details & Analysis
/clickup get-task [TASK_NAME]                  # Get detailed task information
/clickup list-tasks                            # List all tasks in project
/clickup list-tasks-by-agent [AGENT]          # Show tasks for specific agent
/clickup list-tasks-by-phase [PHASE]          # Show tasks in specific phase
/clickup get-comments [TASK_NAME]             # Get all comments for a task
/clickup search-tasks [KEYWORD]               # Search tasks by keyword
```

### Integration with Existing Commands
```bash
# Existing agent commands now update ClickUp automatically:

/design dashboard-page-specification
→ Finds task: "[Designer] Dashboard Page Implementation"  
→ Updates subtask: "Page structure requirement document" → In Progress
→ Updates tags: Phase-2
→ Adds comment: "🎨 [DESIGNER AGENT] started specification work"

/develop database-schema  
→ Finds task: "[Developer] Supabase Database Integration"
→ Updates subtask: "Project/Database setup and configuration" → In Progress
→ Updates tags: Phase-3
→ Adds comment: "💻 [DEVELOPER AGENT] started database setup"
```

### Agent Workflow Integration
```bash
# Each agent automatically:
1. Updates ClickUp when starting work (status + comments)
2. Adds progress updates during work 
3. Marks subtasks complete with deliverable summaries
4. Updates task tags as phases progress
5. Creates validation tasks when user input needed
6. Flags blockers immediately with context
```

## 📋 Replacing Current Systems

### What Gets Replaced
- ❌ **SCRATCHPAD.md** → ClickUp task comments and progress tracking
- ❌ **AGENT-LOG.md** → ClickUp activity feed and detailed logging
- ❌ **TodoWrite tool** → ClickUp task management
- ❌ **Manual `/todo` commands** → Automatic ClickUp integration
- ❌ **Scattered status updates** → Centralized ClickUp status management
- ❌ **Manual progress tracking** → Real-time automated updates

### What Gets Preserved
- ✅ **4-phase framework** → Tracked via ClickUp tags
- ✅ **Agent responsibilities** → Tracked via ClickUp custom fields and assignments
- ✅ **User validation gates** → ClickUp validation tasks with notifications
- ✅ **Development workflow** → Same process, better tracking

### Framework Integration
```bash
# Phase 1: `/webapp start` 
→ Creates complete ClickUp backlog with all tasks

# Phase 2: Agent work
→ Updates ClickUp tasks in real-time as specifications and implementations progress

# Phase 3: Backend integration  
→ ClickUp tracks data integration progress across all pages

# Phase 4: QA and validation
→ ClickUp manages user validation tasks and feedback loops
```

## 🔌 Technical Implementation 

### ClickUp API Integration
The orchestrator uses the ClickUp REST API v2 to fetch project data and analyze progress:

```bash
# API Endpoint Examples:
GET /list/{list_id}/task                       # Get all tasks in project
GET /task/{task_id}                           # Get specific task details  
GET /task/{task_id}/comment                   # Get task comments
GET /list/{list_id}/task?custom_fields=true   # Get tasks with custom fields
GET /task/{task_id}/time                      # Get time tracking data

# Authentication:
Authorization: Bearer {api_token}
Content-Type: application/json
```

### Data Processing & Analysis
```javascript
// Example: Project status analysis
const projectStatus = {
  totalTasks: tasks.length,
  completed: tasks.filter(t => t.status.status === 'complete').length,
  inProgress: tasks.filter(t => t.status.status === 'in progress').length,
  blocked: tasks.filter(t => t.status.status === 'blocked').length,
  
  phaseBreakdown: {
    'Phase-1': tasks.filter(t => t.tags.includes('Phase-1')).length,
    'Phase-2': tasks.filter(t => t.tags.includes('Phase-2')).length,
    'Phase-3': tasks.filter(t => t.tags.includes('Phase-3')).length,
    'Phase-4': tasks.filter(t => t.tags.includes('Phase-4')).length
  },
  
  agentWorkload: {
    Designer: tasks.filter(t => t.tags.includes('Designer')).length,
    Developer: tasks.filter(t => t.tags.includes('Developer')).length,
    QA: tasks.filter(t => t.tags.includes('QA')).length
  },
  
  validationPending: tasks.filter(t => 
    t.status.status === 'IN REVIEW' && 
    t.tags.includes('User-Validation')
  ).length
};
```

### Real-Time Orchestrator Integration
```bash
# When orchestrator needs project insight:
/clickup show-status
→ 1. Fetch all tasks from ClickUp API
→ 2. Process data for status analysis  
→ 3. Generate formatted report
→ 4. Display current project state

/design dashboard-page-specification
→ 1. Find task: "Dashboard Page Implementation" via API
→ 2. Update subtask status via API: "Page specification" → In Progress
→ 3. Add comment via API: "🎨 [DESIGNER AGENT] started specification work"
→ 4. Update tags via API: Add "Phase-2"
→ 5. Continue with design work
```

### Smart Decision Making
```bash
# Orchestrator uses ClickUp data to make informed decisions:

Example: User asks "What should we work on next?"
→ /clickup show-blockers (check for blockers first)  
→ /clickup show-validation-pending (check user validation queue)
→ /clickup list-tasks-by-phase Phase-2 (check current phase progress)
→ Decision: "Let's work on Settings page since Dashboard is waiting for user validation"

Example: "How much progress have we made?"
→ /clickup show-progress (get comprehensive metrics)
→ Result: "67% complete overall, Phase 2 at 80%, ready to start Phase 3 backend work"
```

### Error Handling & Fallbacks
```bash
# When ClickUp API unavailable:
→ Graceful degradation to local tracking
→ Cache last known state for offline reference  
→ Sync updates when connection restored

# When task not found:
→ Suggest similar task names
→ List all available tasks for selection
→ Create new task if legitimate request
```

## 🚀 Benefits

### For User (You)
- **Complete project visibility** - see all features and their status in ClickUp
- **Real-time progress updates** - automatic notifications when work is done
- **Mobile access** - check project status anywhere via ClickUp mobile app
- **Validation workflow** - get assigned tasks when your input is needed
- **Historical tracking** - see all decisions, changes, and progress over time
- **Priority management** - easily see what's blocked, in progress, or ready for review

### For Orchestrator
- **Centralized management** - single place to track all project work
- **Automated reporting** - no manual file updates needed
- **Clear dependencies** - visual task relationships and blockers
- **Phase tracking** - easy to see which tasks are in which framework phase
- **Dynamic planning** - can add tasks on-the-fly based on feedback
- **Consistent workflow** - standardized task structures and progress updates

### For Development Process
- **Business focus** - tasks represent actual features, not framework phases
- **Accountability** - clear ownership and progress visibility
- **Efficiency** - no duplicate tracking in multiple systems
- **Transparency** - all agents and user see the same information
- **Quality gates** - systematic validation and feedback collection
- **Scalability** - easily add new tasks/features as project evolves

## 📊 Example Project Timeline View

In ClickUp, you'll see:
```
🏁 Todo App Project (75% complete)
├── ✅ [Designer] Login Page Implementation (100%)
├── ✅ [Designer] Dashboard Page Implementation (100%) 
├── 🔄 [Designer] Task List Page Implementation (75% - in final implementation)
├── ⏳ [Designer] Settings Page Implementation (0% - waiting for task list completion)
├── ✅ [Developer] Supabase Database Integration (100%)
├── 🔄 [Developer] Task Data Integration (50% - binding data in progress)
├── ⏳ [Developer] User Profile Data Integration (0% - waiting for settings page)
└── ⏳ [QA] End-to-End Testing (0% - waiting for all implementations)

📊 Current Status:
• Phase-2 (Implementation): 60% complete
• Phase-3 (Backend): 30% complete  
• 2 tasks waiting for user validation
• 0 blocked tasks
• Next: Complete task list page implementation
```

---

*This system transforms scattered tracking into a unified, business-focused project management approach that gives you complete visibility and control while streamlining the orchestrator's workflow.*