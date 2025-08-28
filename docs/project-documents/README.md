# Claude Code Orchestrator-Agent Framework

A sophisticated development framework where Claude acts as an Orchestrator, coordinating specialized agents (Designer, Developer, QA Tester) to deliver complete solutions.

## 🎯 Key Concept
You communicate only with the Orchestrator, who delegates tasks to specialized agents and synthesizes their work into cohesive deliverables.

## 🚀 Quick Start

### Available Commands
- `/product [task]` - Comprehensive requirement analysis and backlog creation
- `/design [task]` - UI/UX design work using existing design system
- `/develop [task]` - Backend development and data integration
- `/test [task]` - Browser testing and database validation using Playwright + Supabase MCPs
- `/review [agent] [item]` - Cross-functional review
- `/clickup [action]` - ClickUp task management (primary tracking system)
- `/webapp start` - Full web app development process (4 phases)

### Example Usage

#### Single Feature
```
User: "I need a user login system"

Claude will orchestrate:
1. /design login-flow → Designer creates wireframes
2. /develop auth-system → Developer implements
3. /test security-validation → QA validates
4. Delivers complete, tested solution
```

#### Full Web Application
```
User adds documents to /project-documents/:
- PRD.md, user-stories.md, design-inspiration.md

User: "I want to build a task management app"

Claude follows structured 4-phase process:
1. Requirements & Planning → 📋 Product Owner creates comprehensive ClickUp backlog, App setup
2. Page Implementation → 🎨 Designer implements ALL pages systematically (user validation required)
3. Backend Integration → 💻 Developer adds data to existing pages (NO UI changes)
4. Comprehensive UAT → 🔍 QA tests all user stories with browser + database validation

All work tracked in ClickUp with real-time progress updates and user validation workflow.
```

## 📁 Project Structure
```
/agent-templates      # Agent prompt templates with mandatory ClickUp workflows
  - product-owner-prompt.md   # Comprehensive requirement analysis
  - designer-prompt.md        # Page implementation using design system
  - developer-prompt.md       # Backend development and data integration
  - qa-tester-prompt.md       # Browser + database testing with MCPs
/base-app            # REFERENCE design system (DO NOT MODIFY)
/CLAUDE.md           # Core orchestrator instructions
/CREDENTIALS.md      # ClickUp API credentials (secure storage)
/TASK-MANAGEMENT.md  # ClickUp integration setup and workflow
/ORCHESTRATOR-GUIDE.md # Detailed guide with examples
/QUICK-REFERENCE.md   # Command cheat sheet
/FULL-WEBAPP-PROCESS.md # Complete 4-phase web app development workflow
/SETUP-INSTRUCTIONS.md  # How to properly initialize the framework
/project-documents/     # Your project docs (PRD, user stories, inspiration)
```

## 📋 Centralized ClickUp Task Management
The framework uses ClickUp as the **single source of truth** for all project tracking:

### ClickUp Integration Features
- ✅ **Comprehensive Backlog Creation** - Product Owner creates exhaustive task lists
- ✅ **Real-Time Progress Tracking** - All agent work updates ClickUp automatically
- ✅ **User Validation Workflow** - Dedicated validation tasks with user assignment
- ✅ **Business-Focused Tasks** - Tasks represent features, not framework phases
- ✅ **Mobile Access** - Check project status from anywhere
- ✅ **Detailed Progress Comments** - Every agent action documented in tasks
- ✅ **Blocker Management** - Automatic flagging and resolution tracking

## 🛠 Setup
1. Clone this repository
2. **Configure ClickUp credentials** in `CREDENTIALS.md`:
   - Add your ClickUp API token
   - Add your ClickUp List ID
3. **Add your project documents** to `/project-documents` folder:
   - PRD, user stories, design inspiration, brand guidelines, etc.
4. Launch Claude Code in the project directory
5. **IMPORTANT**: Run `/setup-framework` as your first command
6. Initialize ClickUp: `/clickup setup` and `/clickup test-connection`
7. Use `/webapp start` to begin development (reads all documents first)

See `SETUP-INSTRUCTIONS.md` for detailed setup steps.

## 🎨 The Specialized Agents

### 📋 Product Owner Agent
- **Prefixes all responses with: 📋 [PRODUCT OWNER AGENT]**
- **Comprehensive requirement analysis** - reads ALL project documents thoroughly
- **Exhaustive backlog creation** - 8-12 subtasks per major deliverable
- **Granular task breakdown** - ensures nothing is missed from scope
- **UAT master task creation** - all user stories as organized subtasks
- **MANDATORY ClickUp workflow** - all work tracked in ClickUp tasks

### 🎨 UI/Frontend Designer Agent
- **Prefixes all responses with: 🎨 [DESIGNER AGENT]**
- **Guardian of existing design system** - reuses /base-app CSS variables and components
- **Builds actual working pages** using React + shadcn/ui + existing design system
- **MANDATORY ClickUp workflow** - updates task status and adds detailed comments
- Uses dummy data for Developer Agent to integrate later
- **DOES NOT create new design systems** - works within established constraints

### 💻 Backend Developer Agent
- **Prefixes all responses with: 💻 [DEVELOPER AGENT]**
- **Backend development and data integration** into existing frontend pages
- **MANDATORY ClickUp workflow** - tracks all database and API development
- **Does NOT modify UI/visual elements** - Designer Agent's exclusive domain
- Builds Supabase schemas, authentication, and server actions
- Integrates real data into Designer's existing page implementations

### 🔍 QA Tester Agent
- **Prefixes all responses with: 🔍 [QA TESTER AGENT]**
- **Browser testing** using Playwright MCP (navigation, forms, screenshots)
- **Database validation** using Supabase MCP (data integrity verification)
- **MANDATORY ClickUp workflow** - updates task status with detailed test results
- **Internal validation** for other agents before user validation
- **Phase 4 UAT coordination** - systematically tests all user stories

## 📋 Workflow Benefits
- **Specialized Expertise**: Each agent operates in their domain with role-specific MCPs
- **Centralized Tracking**: All work flows through ClickUp for real-time visibility
- **User Validation Gates**: Dedicated ClickUp tasks for user approval at key milestones
- **Design System Guardian**: Designer Agent preserves consistency using /base-app reference
- **Comprehensive Testing**: QA Agent uses browser automation + database validation
- **Business-Focused Tasks**: ClickUp tasks represent actual features, not framework phases
- **Exhaustive Planning**: Product Owner ensures complete coverage of requirements
- **Mobile Project Management**: Access project status and provide feedback from anywhere

## 🔧 Customization
- Modify agent templates in `/agent-templates` (includes mandatory ClickUp workflows)
- Adjust workflows in `CLAUDE.md`
- Configure ClickUp fields and statuses in `TASK-MANAGEMENT.md`
- Add project-specific commands
- Extend agent capabilities with additional MCPs

## 🚨 Prerequisites
- **ClickUp account** with API access
- **ClickUp List configured** with required custom fields (see TASK-MANAGEMENT.md)
- **Project documents** in /project-documents folder
- **Base app reference** available at /base-app for design system

Ready to start? Configure your ClickUp credentials, add your project documents, and Claude will orchestrate the entire development process with comprehensive tracking!