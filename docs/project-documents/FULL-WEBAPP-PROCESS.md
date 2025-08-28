# 🚀 Full Web App Development Process

## Overview
This is the standardized process the Orchestrator follows when building complete web applications. This ensures quality, user satisfaction, and efficient development.

## Updated Phase Structure
1. **Phase 1**: Requirements & Planning + App Setup + ClickUp Backlog
2. **Phase 2**: Page Specification & Implementation (with user validation)  
3. **Phase 3**: Backend Development & Data Integration
4. **Phase 4**: QA & User Validation

## 📋 Phase 1: Requirements & Planning

### 1.1 Document Analysis (FIRST STEP - CRITICAL)
```
BEFORE ANY OTHER WORK, Orchestrator MUST:
1. Read ALL files in /project-documents folder
2. Analyze and synthesize all requirements
3. Identify any gaps or conflicts
4. Create unified understanding of project scope
```

**Supported Documents:**
- **Requirements**: PRD, BRD, User Stories, Feature Specs
- **Design Materials**: Inspirations, brand guidelines, wireframes
- **Technical Docs**: Architecture requirements, integrations
- **Business Docs**: Target audience, market research, goals

### 1.2 Requirements Synthesis
```
/design requirements-analysis

Designer will (based on document analysis):
- Validate/refine user personas from documents
- Map user journeys from documented stories
- Prioritize features per business goals
- Extract design constraints from brand guidelines
- Note inspiration references for design direction
- Identify any missing requirements
```

### 1.3 Development Planning
```
Orchestrator creates comprehensive plan (informed by all documents):
- Feature breakdown aligned with PRD/requirements
- Technical architecture supporting all documented needs
- Timeline estimation based on complete scope
- Risk assessment from documented constraints
- Resource allocation per documented priorities
```

### 1.4 Next.js App Setup
```
/develop project-initialization

Developer clone base-app and initiualize Next.js project:
- Next.js 14+ project with App Router
- **Copy CSS theme**: Replicate /base-app/src/app/globals.css exactly (CSS variables and design system)
- **Reference components**: Use /base-app/src/components as examples for component structure
- **Reference pages**: Use existing /base-app dashboard pages as examples of good implementation patterns
- Environment configuration and Supabase setup
- Package.json with required dependencies (shadcn/ui, Tailwind, Supabase, etc.)

CRITICAL: /base-app serves as REFERENCE for:
- Design system CSS variables and theme structure
- Component patterns and implementation examples  
- Dashboard page organization and layout patterns
- Proper integration of shadcn/ui with custom styling
```

### 1.5 ClickUp Setup & Backlog Creation
```
# First time setup (if not configured):
/clickup setup [USER_API_TOKEN] [USER_LIST_ID]
/clickup test-connection

# Create complete project backlog with Product Owner:
/product create-comprehensive-backlog

Product Owner creates exhaustive project backlog:
1. **THOROUGHLY** analyze ALL files in /project-documents folder
2. Extract EVERY page, feature, and requirement from PRD and user stories
3. Identify ALL tasks needed to make the system fully working and operational
4. Create detailed ClickUp tasks for each deliverable:
   - [Designer] [PAGE_NAME] Page Implementation (with 8-12 detailed subtasks)
   - [Developer] [FEATURE_NAME] Integration (with comprehensive subtasks)
   - [QA] [FEATURE_NAME] Testing (with detailed test scenarios)
5. Add detailed descriptions and acceptance criteria for each task
6. Set up tags, priorities, and dependencies
7. Ensure NOTHING from requirements is missed or overlooked
8. Iterate with orhcestrator to ensure that tasks are the smallest enough and that nothing is skipped/missed from the requirements
```

### 1.6 Deliverables
- ✅ **Document analysis summary** (what was found in project-documents)
- ✅ **Unified requirements document** (synthesized from all sources)
- ✅ Technical architecture plan (supporting all requirements)
- ✅ **Working Next.js app** with dependencies installed
- ✅ **Complete ClickUp backlog** with all project tasks and subtasks
- ✅ **Centralized task tracking** system configured and ready

---

## 🎨 Phase 2: Page Specification & Planning

### 2.1 Define Complete Page List
```
Orchestrator works with Product Owner to:
/product comprehensive-page-analysis

Product Owner analyzes ALL project documents to:
1. Extract EVERY page/screen mentioned in requirements
2. Identify implied pages needed for complete user flows
3. Create exhaustive list with detailed descriptions
4. Present complete page list to user for feedback and validation
5. **STOP** - Get user confirmation on final page list before proceeding
```

### 2.1 Page Specification Documentation

```
/design page-specifications

Designer works through ClickUp tasks one by one:
1. Find task: "[Designer] [PAGE_NAME] Page Implementation" 
2. Start subtask: "Page structure requirement document"
3. Update ClickUp status: In Progress
4. Create detailed specification covering:
   - Page purpose and user goals
   - Information architecture and content organization
   - Required actions/interactions users can perform
   - Component breakdown (using existing design system components)
   - Data requirements and content structure
   - Navigation and flow connections to other pages
5. Complete subtask in ClickUp with specification document link
6. Move to next page specification
```

**ClickUp Integration**: Each specification updates the corresponding ClickUp task with:
- **Status Updates**: Automatic progress tracking
- **Comments**: Specification details and decisions made
- **Attachments**: Links to specification documents
- **Tags**: Phase-2 (specification phase)

### 2.2 Complete Page Implementation
```
After user validates the page specifications:

/design implement-all-pages

Designer implements ALL pages systematically and in logical order (e.g dashboard layout should be implemented before a dashboard page etc.)
1. For each page: Start ClickUp task and set status to IN PROGRESS
2. Build page as React component using existing design system
3. Use dummy/placeholder data for all content
4. Implement navigation between pages
5. Ensure responsive design using existing CSS variables
6. Create any custom components needed (consistent with design system)
7. Complete implementation and set ClickUp status to IN REVIEW
8. Add detailed comment with implementation notes and page URL
9. Move to next page

**REPEAT** for ALL pages until complete implementation portfolio ready
```

### 2.3 User Review & Feedback Collection
```
Once ALL pages are implemented and in IN REVIEW status:

/clickup show-validation-pending

Orchestrator notifies user:
"All page implementations are ready for your review! 
Please check ClickUp tasks in IN REVIEW status and add feedback as comments.
Access pages at [provided URLs] and review each implementation."

**User Process:**
1. User reviews each page implementation
2. User adds feedback/comments directly in ClickUp task comments
3. User tells orchestrator when review is complete

**Orchestrator Process:**
1. Monitor ClickUp for user feedback completion
2. Assign Designer to implement feedback when user confirms review done
```

### 2.4 Feedback Implementation
```
After user completes review and provides feedback:

/design implement-feedback

Designer works through ClickUp feedback systematically:
1. Read all user feedback comments in ClickUp tasks
2. For each task with feedback: Set status to IN PROGRESS
3. Implement requested changes and improvements
4. Update design system if needed (maintain consistency)
5. Test changes and ensure functionality
6. Set status to DONE with comment describing changes made
7. **REPEAT** for all tasks with feedback

Once all feedback implemented: All pages ready for Phase 3 backend integration
```

### 2.5 Deliverables
- ✅ **Complete validated page list** with user approval in ClickUp
- ✅ **Detailed specifications** for each page tracked in ClickUp tasks
- ✅ **Component inventory** documented in ClickUp comments
- ✅ **All pages implemented** as working React components with dummy data
- ✅ **User-validated pages** with feedback tracked in ClickUp
- ✅ **Custom components created** (if needed) maintaining design system consistency
- ✅ **Complete ClickUp task tracking** for all Phase 2 deliverables

---

## 🏗️ Phase 3: Backend Development & Data Integration

### 3.1 Database Schema & Setup
```
/develop database-schema

Developer works through ClickUp backend tasks:
1. Start task: "[Developer] Supabase Database Integration"
2. Begin subtask: "Project/Database setup and configuration"
3. Update ClickUp: Status In Progress, Tag Phase-3
4. Analyze page specifications from Phase 2 ClickUp tasks for data requirements, and create Developer taks from this
5. Design Supabase database schema for all entities
6. Create tables, relationships, and constraints
7. Set up Authentication, Row Level Security (RLS) policies
8. Configure authentication and user management
9. Complete subtask with database schema documentation
10. Update ClickUp with implementation details and next steps
```

### 3.2 API Development
```
/develop api-integration

Developer creates:
- API routes for all CRUD operations identified in page specifications
- Data fetching functions for each page's content requirements
- Server actions for form submissions and user interactions
- Error handling and validation for all endpoints
- Integration points that match the page specifications
```

### 3.3 Data Integration into Existing Pages
```
/develop connect-pages-to-data

Developer integrates real data into Designer's pages:
- Replace dummy/placeholder data with real Supabase queries
- Connect forms to actual database operations
- Implement authentication flows in existing auth pages
- Add loading states and error handling to existing components
- Ensure all user actions identified in specs work with real data
- **CRITICAL**: Do NOT modify UI/visual elements - only data integration
```

### 3.4 Feature Implementation
```
For each functional requirement:
/develop [feature-name]

Developer builds backend functionality:
- Business logic and data processing
- Background jobs and automated processes  
- External API integrations (if needed)
- Performance optimizations
- Security implementations
```

### 3.5 Deliverables
- ✅ **Complete Supabase database schema** with all required tables and relationships
- ✅ **Full API layer** supporting all page functionalities from Phase 2
- ✅ **Real data integration** into all Designer-built pages (no UI changes)
- ✅ **Working authentication system** integrated with existing auth pages
- ✅ **All user actions functional** with proper backend support
- ✅ **ClickUp task completion** for all backend integration work
- ✅ **Cross-task dependencies resolved** (page implementations + data integration)

---

## 🔍 Phase 4: Quality Assurance & User Validation

### 4.1 UAT Master Task Creation
```
Product Owner creates comprehensive UAT plan:

/product create-uat-master-task

Product Owner responsibilities:
1. Create UAT master task in ClickUp: "Complete Application User Acceptance Testing"
2. Extract ALL user stories from project requirements
3. Add each user story as individual subtask under UAT master task
4. Include detailed acceptance criteria for each story
5. Set proper priority and dependencies
6. Assign QA Tester to execute UAT systematically
```

### 4.2 Systematic User Story Testing
```
QA Tester executes UAT plan:

/test execute-uat-session

QA Tester responsibilities:
1. Work through UAT subtasks one by one
2. For each user story:
   - Use Playwright MCP for browser testing
   - Use Supabase MCP for database validation
   - Perform complete end-to-end user flow
   - Verify expected outcomes achieved
   - Take screenshots for evidence
   - Update subtask status: DONE (pass) or BLOCKED (fail)
3. Document comprehensive results in ClickUp comments
4. Create bug tasks for any failures found
```

### 4.3 Iteration Cycle
```
If issues found:
/clickup add-task "Fix [issue-name]" Developer
/develop fix-[issue-name]
[Updates ClickUp: Bug fix task In Progress]
/test validate-fix
[Updates ClickUp: Fix validation completed]
/clickup user-validation "Fix [issue-name]"
[Creates validation task for user approval]
```

### 4.3 User Validation & Final Approval
```
After all UAT tests complete:

Orchestrator presents results to user:
"UAT testing complete! Here's the summary:
- X/Y user stories passed
- Z issues found and documented in ClickUp
- All evidence available with screenshots and database validation

Please review ClickUp UAT results and provide final approval."

User reviews ClickUp UAT master task and subtasks, then confirms:
"All UAT results reviewed and approved - ready for production"
```

### 4.4 Deliverables
- ✅ **UAT Master Task completed** with all user story subtasks executed
- ✅ **Comprehensive testing evidence** (screenshots, database validation, browser testing)
- ✅ **All user stories validated** with DONE/BLOCKED status clearly documented
- ✅ **Bug tracking system** with detailed reproduction steps for any issues
- ✅ **Production readiness assessment** based on complete UAT results

---

## 🎯 Process Commands

### Orchestrator Process Commands
```bash
/webapp start           # Initialize full webapp process
/webapp phase [number]  # Jump to specific phase
/webapp status         # Show current phase progress
/webapp validate       # Present current work to user for validation
/webapp user-feedback  # Collect and document user feedback
```

### Phase-Specific Workflows
```bash
# Phase 1: Requirements + ClickUp Setup
/clickup create-backlog
/design requirements-analysis
/develop project-initialization

# Phase 2: Page Specification & Implementation
/design page-specifications
/design implement-pages
/clickup user-validation [page-name]

# Phase 3: Backend Development
/develop database-schema
/develop api-integration
/develop connect-pages-to-data

# Phase 4: QA & Validation
/test user-story-validation
/clickup user-validation [story-name]
/test performance-testing
```

---

## ⚠️ Critical Rules

### Design System Consistency
- **Design system (CSS theme) is ESTABLISHED from start** using /base-app reference
- CSS variables and theme structure must be preserved and reused
- Component patterns should follow /base-app examples
- **NEW CSS variables only in rare cases** with explicit justification from Designer
- Maintain consistency across all interfaces using established patterns

### User Validation Gates
- **STOP at Phase 2.1**: Must get user approval on complete page list
- **STOP at Phase 2.4**: Must get user validation on each implemented page
- **STOP at Phase 4**: Must get user validation on each user story with real data
- No proceeding without explicit user approval  
- **Document all feedback in ClickUp task comments and validation tasks**

### Quality Standards
- All features must pass ClickUp QA tasks before user validation
- Accessibility compliance (WCAG 2.1 AA) tracked in ClickUp
- Performance benchmarks documented in ClickUp task comments
- Security best practices validated through ClickUp review workflow

---

## 📊 Phase Tracking

### ClickUp Progress Updates
Each phase completion updates ClickUp with automated comments:
```markdown
## Phase [X] Completion - [timestamp]
**Status**: ✅ Complete / 🔄 In Progress / ⏸️ Waiting for User
**ClickUp Tasks Completed**: [List of completed tasks]
**User Validation Tasks**: [Number approved/pending]
**Next Phase Tasks**: [What's ready to start]
**Blockers**: [Any items waiting for input]
```

### Success Metrics (ClickUp Dashboard)
- Phase 1: **Complete ClickUp backlog created** and all planning tasks approved
- Phase 2: **All page implementation tasks user-validated** in ClickUp  
- Phase 3: **All backend integration tasks completed** without UI changes
- Phase 4: **All user story validation tasks approved** by user in ClickUp

---

## 🚀 Example Full Process

```
User places documents in /project-documents:
- PRD.md (task management app requirements)
- user-stories.md (detailed user stories)
- design-inspiration.png (visual references)
- brand-guidelines.md (colors: blue/white, modern typography)

User: "I want to build a task management app"

Orchestrator:
1. /webapp start
2. **Read all documents in /project-documents** → [Document analysis complete]
3. /clickup create-backlog → [Complete project backlog with all tasks from PRD]
4. Synthesize: "Based on your PRD, I see you need a task management app with team collaboration features. I've created a complete ClickUp backlog with all features..."
5. /design requirements-analysis → [Complete requirements doc from all sources]
6. /develop project-initialization → [Next.js app setup using /base-app reference]
7. /design page-specifications → [All pages specified per PRD requirements]
8. /design implement-dashboard → [Dashboard implementation with design system]
9. /clickup user-validation "Dashboard Page Implementation" → [User validation task created]
10. User approves dashboard in ClickUp → [Validation task completed]
11. Continue for each page: Task List → Settings → Profile...
12. /develop database-schema → [Supabase setup for all documented entities]
13. /develop connect-pages-to-data → [Real data integration without UI changes]
14. /test user-story task-creation → [QA testing tracked in ClickUp]
15. /clickup user-validation "Task Creation User Story" → User approves
16. Continue for each user story with ClickUp validation workflow...
```

This process ensures quality, user satisfaction, and efficient development while maintaining clear communication and validation gates.