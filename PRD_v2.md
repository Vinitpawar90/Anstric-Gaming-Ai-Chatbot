# 📋 Product Requirements Document (PRD) v2.0
# Anstric Gaming - AI-Powered Internal Knowledge Platform

**Document Version:** 2.0  
**Last Updated:** January 16, 2026  
**Project Type:** College Project / Internal Tool  
**Target:** Startup Companies (10-50 employees)  
**Status:** Final

---

## 📑 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Context](#project-context)
3. [Product Overview](#product-overview)
4. [User Roles & Personas](#user-roles--personas)
5. [Functional Requirements](#functional-requirements)
6. [Technical Architecture](#technical-architecture)
7. [User Interface & Experience](#user-interface--experience)
8. [Success Metrics](#success-metrics)
9. [Out of Scope](#out-of-scope)
10. [Appendix](#appendix)

---

## Executive Summary

**Anstric Gaming** is an AI-powered internal knowledge platform designed as a college project to demonstrate RAG (Retrieval-Augmented Generation) technology in a practical business context. It helps startup employees get instant answers to company-related questions by leveraging AI to search through uploaded company documents.

### Core Value Proposition

- **For Employees:** Get instant, accurate answers to company questions without searching through multiple documents
- **For Admins:** Centralized knowledge management with AI-powered responses and usage analytics

### MVP Scope

This MVP focuses on:
- ✅ AI-powered chat with RAG
- ✅ Document upload and management
- ✅ Basic analytics dashboard
- ✅ Simple onboarding system
- ✅ Conversation history

---

## Project Context

### Purpose
This is a **college project** designed to demonstrate:
- Practical implementation of RAG technology
- Full-stack development skills
- AI integration in business applications
- User-centric design

### Target Environment
- **Small startups** with 10-50 employees
- **Single team** structure (no department separation)
- **Internal use only** (not a SaaS product)

### Constraints
- No budget (using free tiers of services)
- No external integrations in MVP
- Simplified security (no encryption, no audit logs)
- English language only

---

## Product Overview

### What is Anstric Gaming?

Anstric Gaming is a web-based chat interface where employees can ask questions about company policies, processes, and technical documentation. The AI retrieves relevant information from uploaded documents and generates contextual answers.

### How It Works

```
Employee asks question
    ↓
AI searches uploaded documents (RAG)
    ↓
Generates answer with source references
    ↓
Employee provides feedback (👍/👎)
    ↓
Admin sees analytics and improves knowledge base
```

### Key Features

1. **AI Chat Assistant**
   - Natural language questions
   - Context-aware multi-turn conversations
   - Formatted answers with source citations
   - Conversation history

2. **Document Management** (Admin)
   - Upload PDF, DOCX, Markdown, TXT files
   - Organize in folders
   - Automatic document processing
   - Version history

3. **Analytics Dashboard**
   - Employee usage stats
   - Question analytics
   - Answer accuracy tracking (via thumbs up/down)
   - Individual employee analytics

4. **Onboarding System**
   - Automated onboarding flow for new employees
   - Curated reading materials
   - Interactive Q&A with AI
   - Template-based with AI assistance

5. **User Management** (Admin)
   - Invite employees via email
   - Role assignment
   - User activity tracking

---

## User Roles & Personas

### Role 1: Employee

**Access Level:** Standard User

**Can Do:**
- ✅ Ask questions in chat interface
- ✅ View and resume previous conversations
- ✅ Flag answers as correct/incorrect (👍/👎)
- ✅ View their own usage analytics
- ✅ Complete onboarding process
- ✅ Receive notifications when documents are updated

**Cannot Do:**
- ❌ Upload or edit documents
- ❌ Manage other users
- ❌ Access admin settings
- ❌ View other employees' analytics

#### Persona: Priya - New Hire Software Engineer

**Age:** 24  
**Background:** Fresh graduate, first job at a startup

**Goals:**
- Quickly learn about company policies and processes
- Find technical documentation without bothering seniors
- Understand codebase and deployment workflows

**Pain Points:**
- Overwhelmed with information on day one
- Doesn't know where to find specific information
- Hesitant to ask "basic" questions repeatedly

**How Anstric Gaming Helps:**
- Guided onboarding with curated materials
- Instant answers to policy and technical questions
- No judgment - can ask the same thing multiple times
- Clear source references to dive deeper

---

### Role 2: Admin

**Access Level:** Full Access

**Can Do:**
- ✅ All employee capabilities
- ✅ Upload and manage documents
- ✅ Organize documents in folders
- ✅ Invite and manage employees
- ✅ Configure AI settings (model selection, temperature)
- ✅ View company-wide analytics
- ✅ Create and customize onboarding plans
- ✅ View all employees' analytics
- ✅ Send notifications to all employees

**Cannot Do:**
- ❌ (No restrictions - full access)

#### Persona: Rahul - Startup Founder / HR Manager

**Age:** 32  
**Background:** Startup founder managing a team of 15

**Goals:**
- Reduce time spent answering repetitive questions
- Ensure all employees have access to important information
- Track how well employees are learning company processes
- Maintain up-to-date documentation

**Pain Points:**
- Spends 2+ hours daily answering the same questions
- Documentation scattered across Google Drive and Notion
- No visibility into what employees are confused about
- New hires take long to become productive

**How Anstric Gaming Helps:**
- Centralized knowledge base accessible via AI chat
- Analytics show most asked questions (identifying gaps)
- Automated onboarding reduces manual intervention
- Upload once, employees can query anytime

---

## Functional Requirements

### FR-1: Authentication & User Management

#### FR-1.1: User Authentication
**Priority:** P0 (Critical)

**Description:** Secure login system using JWT tokens

**Requirements:**
- Email + password based JWT authentication
- Session management with refresh tokens
- Secure password hashing
- Password reset functionality

**User Flow:**
1. User enters email and password
2. Backend validates credentials
3. JWT token generated and returned
4. Token stored in browser (localStorage/cookie)
5. Token included in all API requests

**Acceptance Criteria:**
- ✅ Users can log in with valid credentials
- ✅ Invalid credentials show error message
- ✅ JWT tokens expire after defined period
- ✅ Refresh token mechanism implemented

---

#### FR-1.2: User Invitation & Onboarding
**Priority:** P0 (Critical)

**Description:** Admin can invite new employees via email

**Requirements:**
- Admin enters employee email and role
- System generates invitation link (unique token)
- Email sent to employee with signup link
- Employee creates password and completes profile
- New users automatically routed to onboarding

**User Flow (Admin):**
1. Admin clicks "Invite Employee"
2. Enters email address
3. System sends invitation email
4. Admin sees pending invitation status

**User Flow (New Employee):**
1. Receives invitation email
2. Clicks link to signup page
3. Creates password and basic profile
4. Logs in and starts onboarding flow

**Acceptance Criteria:**
- ✅ Admin can send invitation emails
- ✅ Invitation links expire after 7 days
- ✅ New users complete signup successfully
- ✅ New users automatically enter onboarding

---

#### FR-1.3: User Management Dashboard
**Priority:** P1 (High)

**Description:** Admin can view and manage all users

**Features:**
- List all employees (name, email, role, join date, status)
- Search and filter users
- View individual user activity
- Deactivate/activate users

**Acceptance Criteria:**
- ✅ Admin sees list of all users
- ✅ Can filter by role, status, join date
- ✅ Can deactivate users (prevents login)
- ✅ Can view individual user analytics

---

### FR-2: AI Chat Interface

#### FR-2.1: Chat Interface
**Priority:** P0 (Critical)

**Description:** Primary interface for employees to ask questions

**Features:**
- Clean, simple chat UI (similar to ChatGPT)
- Text input with Enter to send
- Real-time typing indicators
- Loading state while AI generates response
- Display AI responses with proper formatting
- Show source citations as clickable links

**Acceptance Criteria:**
- ✅ Employee can type and send questions
- ✅ AI response appears within 5 seconds
- ✅ Responses formatted (bullet points, code blocks, etc.)
- ✅ Source documents clearly cited
- ✅ Mobile responsive design

---

#### FR-2.2: Conversation Context & History
**Priority:** P0 (Critical)

**Description:** Maintain conversation context for multi-turn dialogues

**Requirements:**
- Keep track of conversation context (last 5-10 messages)
- AI understands follow-up questions using context
- Save all conversations to database
- Employees can view past conversations
- Resume previous conversations

**Example:**
```
Employee: "What's our leave policy?"
AI: "Our leave policy allows 20 days of PTO per year..."

Employee: "How do I apply?"
AI: "To apply for leave, go to the HR portal..." 
[AI understands "apply" refers to leave]
```

**Acceptance Criteria:**
- ✅ Multi-turn conversations work correctly
- ✅ AI maintains context across messages
- ✅ Conversation history saved and retrievable
- ✅ Employee can resume old conversations
- ✅ Each conversation has a title (auto-generated or manual)

---

#### FR-2.3: Response Feedback
**Priority:** P0 (Critical)

**Description:** Employees can rate answer quality

**Features:**
- Thumbs up (👍) and thumbs down (👎) buttons on each answer
- Feedback saved to database
- Admin can see feedback analytics
- Optional: Allow employee to add comment with thumbs down

**Acceptance Criteria:**
- ✅ Each AI response has 👍/👎 buttons
- ✅ Feedback is saved and tracked
- ✅ Employee can change their feedback
- ✅ Feedback displayed in admin analytics

---

#### FR-2.4: No Answer Handling
**Priority:** P1 (High)

**Description:** Handle cases where AI cannot find relevant information

**Behavior:**
- If confidence is low or no relevant documents found:
  - AI responds: "I couldn't find information about this in our documents. Please contact an admin."
  - Show "Flag as Missing Documentation" button
  - Employee can flag the question
  - Flagged questions appear in admin dashboard

**Acceptance Criteria:**
- ✅ AI clearly states when it can't answer
- ✅ Employee can flag missing documentation
- ✅ Admin sees flagged questions in dashboard
- ✅ No hallucinated answers (AI only uses documents)

---

### FR-3: Document Management

#### FR-3.1: Document Upload
**Priority:** P0 (Critical)

**Description:** Admin can upload company documents

**Supported Formats:**
- PDF
- DOCX (Microsoft Word)
- Markdown (.md)
- Plain text (.txt)

**Requirements:**
- Drag-and-drop or file browser upload
- Multiple file upload support
- Maximum file size: 50 MB per file
- Progress indicator during upload
- Automatic text extraction
- Automatic embedding generation and storage

**User Flow:**
1. Admin navigates to Documents page
2. Clicks "Upload Document" or drags files
3. Selects file(s) from computer
4. Files upload to Supabase Storage
5. Background job processes documents
6. Admin sees processing status
7. Documents become searchable once processed

**Acceptance Criteria:**
- ✅ Admin can upload supported file formats
- ✅ Files stored securely in Supabase Storage
- ✅ Text extracted correctly from all formats
- ✅ Processing happens in background (async)
- ✅ Admin notified when processing complete

---

#### FR-3.2: Document Organization
**Priority:** P1 (High)

**Description:** Organize documents in folders

**Features:**
- Create folder hierarchy
- Move documents between folders
- Rename folders
- Delete folders (with confirmation)

**Metadata Captured:**
- Document name
- Folder location
- File type
- Upload date
- Uploaded by (admin)
- Last updated date
- File size
- Processing status
- Custom tags (optional)

**Acceptance Criteria:**
- ✅ Admin can create and manage folders
- ✅ Documents can be moved between folders
- ✅ Folder structure is intuitive
- ✅ All metadata is captured and displayed

---

#### FR-3.3: Document Versioning
**Priority:** P1 (High)

**Description:** Track document version history

**Behavior:**
- When a document with same name is uploaded:
  - Old embeddings are deleted from Pinecone
  - New document is processed completely
  - Version history is saved
  - New version becomes active

**Version History:**
- Show all versions (v1, v2, v3...)
- Display upload date for each version
- Allow viewing old versions (future enhancement)
- Current version always used by AI

**Acceptance Criteria:**
- ✅ Document updates create new version
- ✅ Old embeddings are removed
- ✅ New embeddings generated
- ✅ Version history is visible
- ✅ Latest version always used for answering

---

#### FR-3.4: Document Deletion
**Priority:** P1 (High)

**Description:** Admin can delete documents

**Requirements:**
- Delete single document
- Delete entire folder (with all documents)
- Confirmation dialog for deletion
- Soft delete with 30-day recovery period (optional)
- Embeddings removed from Pinecone
- File removed from Supabase Storage

**Acceptance Criteria:**
- ✅ Admin can delete documents
- ✅ Confirmation required before deletion
- ✅ All associated data removed (file, embeddings, metadata)
- ✅ Cannot delete if required for onboarding (warning shown)

---

### FR-4: RAG (Retrieval-Augmented Generation) System

#### FR-4.1: Document Processing Pipeline
**Priority:** P0 (Critical)

**Description:** Automated pipeline to process uploaded documents

**Pipeline Steps:**

```
1. Document Upload
   ↓
2. Store in Supabase Storage
   ↓
3. Add to Processing Queue (Redis/Bull)
   ↓
4. Text Extraction
   - PDF: Extract text using pdf-parse or similar
   - DOCX: Extract using mammoth.js
   - Markdown/TXT: Read directly
   ↓
5. Text Chunking
   - Chunk size: 512-1024 tokens
   - Overlap: 50-100 tokens
   - Preserve context boundaries (paragraphs)
   ↓
6. Generate Embeddings
   - Use HuggingFace model (all-MiniLM)
   - Generate embedding for each chunk
   ↓
7. Store in Pinecone
   - Vector: Embedding
   - Metadata: doc_id, chunk_id, doc_name, folder, text
   ↓
8. Update Database
   - Mark document as processed
   - Store chunk count, processing time
   ↓
9. Notify Admin
   - Processing complete notification
```

**Acceptance Criteria:**
- ✅ All supported formats processed correctly
- ✅ Text extraction is accurate
- ✅ Chunking maintains context
- ✅ Embeddings generated successfully
- ✅ Processing is async (doesn't block user)
- ✅ Errors are logged and reported

---

#### FR-4.2: Query Processing
**Priority:** P0 (Critical)

**Description:** Process employee questions and generate answers

**Query Flow:**

```
1. Employee submits question
   ↓
2. Check Redis cache (optional)
   - If cached: Return cached answer
   ↓
3. Generate query embedding
   - Use same HuggingFace model
   ↓
4. Similarity Search in Pinecone
   - Retrieve top 5-10 most relevant chunks
   - Filter by similarity threshold (e.g., > 0.7)
   ↓
5. Include Conversation History
   - Get last 5 messages for context
   ↓
6. Construct Prompt
   - System prompt: "You are Anstric Gaming..."
   - Context chunks from Pinecone
   - Conversation history
   - User question
   ↓
7. Call Groq API (via Vercel AI SDK)
   - Selected model (admin configurable)
   - Stream response
   ↓
8. Parse Response
   - Extract answer
   - Identify source chunks used
   ↓
9. Return to User
   - Answer text
   - Source document citations
   - Conversation saved
   ↓
10. Cache Result (optional)
```

**Acceptance Criteria:**
- ✅ Query embeddings generated correctly
- ✅ Relevant chunks retrieved from Pinecone
- ✅ LLM response is accurate and based only on documents
- ✅ Response time < 5 seconds (95th percentile)
- ✅ Sources are clearly cited
- ✅ Conversation context maintained

---

#### FR-4.3: AI Configuration (Admin)
**Priority:** P1 (High)

**Description:** Admin can configure AI behavior

**Configurable Settings:**
- **Model Selection:**
  - llama-3.1-70b-versatile (better quality, slower)
  - llama-3.1-8b-instant (faster, good for simple questions)
  - mixtral-8x7b-32768 (alternative)
- **Temperature:** 0.0 - 1.0 (controls randomness)
- **Max Tokens:** Response length limit
- **Top K Chunks:** How many document chunks to retrieve (3-10)
- **Similarity Threshold:** Minimum relevance score (0.5-0.9)

**UI:**
- Settings page for admins
- Real-time preview of changes
- Reset to defaults option
- Save configuration

**Acceptance Criteria:**
- ✅ Admin can change AI model
- ✅ Configuration persists across sessions
- ✅ Changes take effect immediately
- ✅ Default settings work well out-of-the-box

---

### FR-5: Analytics Dashboard

#### FR-5.1: Employee Analytics (Own)
**Priority:** P1 (High)

**Description:** Each employee can see their own usage stats

**Metrics Displayed:**
- Total questions asked
- Questions asked this week/month
- Conversation count
- Most used documents
- Average response rating (thumbs up %)
- Activity timeline (questions per day/week)

**UI:**
- Simple dashboard with cards
- Charts (line chart for activity, bar chart for documents)
- Time period selector (week, month, all time)

**Acceptance Criteria:**
- ✅ Employee sees their own stats
- ✅ Data is accurate
- ✅ Charts are clear and readable
- ✅ Mobile responsive

---

#### FR-5.2: Admin Analytics (Company-wide)
**Priority:** P0 (Critical)

**Description:** Admin sees all usage and engagement metrics

**Metrics:**

**Overview:**
- Total employees
- Total questions asked (all time, this month, this week)
- Total conversations
- Total documents uploaded
- Average response rating

**Usage Analytics:**
- Daily/Weekly Active Users (DAU/WAU)
- Questions per day (line chart)
- Peak usage times
- Top 10 most asked questions
- Average questions per employee

**Answer Quality:**
- Thumbs up vs thumbs down ratio
- Most liked answers
- Most disliked answers
- Questions flagged as "missing documentation"

**Document Analytics:**
- Most referenced documents
- Least used documents (candidates for removal)
- Documents with negative feedback
- Recent uploads

**Employee Leaderboard (optional):**
- Most active employees
- Most engaged (highest quality interactions)

**Acceptance Criteria:**
- ✅ All metrics calculated correctly
- ✅ Real-time or near real-time updates
- ✅ Export reports to CSV/PDF
- ✅ Filter by date range
- ✅ Visually appealing charts

---

### FR-6: Onboarding System

#### FR-6.1: Onboarding Flow for New Employees
**Priority:** P1 (High)

**Description:** Automated onboarding process for new hires

**Approach:** Hybrid (Template + AI)
- Admin creates onboarding template
- AI assists with Q&A during onboarding
- Employee follows structured path

**Onboarding Structure:**

**Day 1:**
- Welcome message
- Company overview document
- Company policies (HR, code of conduct)
- Team introductions
- Q&A with AI about basics

**Day 2-3:**
- Role-specific documentation
- Technical setup guides (for engineers)
- Tools and access
- Q&A with AI

**Day 4-5:**
- Process documentation
- FAQs
- Complete onboarding checklist

**Features:**
- Progress tracker (25%, 50%, 75%, 100%)
- Checklist of items to complete
- Integrated chat for questions
- Mark sections as complete
- Admin can see completion status

**Acceptance Criteria:**
- ✅ New employees enter onboarding automatically
- ✅ Onboarding content is curated by admin
- ✅ Employees can ask AI questions during onboarding
- ✅ Progress is tracked
- ✅ Admin sees who has completed onboarding
- ✅ Can skip onboarding (for re-hires)

---

#### FR-6.2: Onboarding Template Management (Admin)
**Priority:** P1 (High)

**Description:** Admin creates and manages onboarding templates

**Features:**
- Create onboarding plan (single template for all for now)
- Add sections/modules
- Attach documents to each section
- Write welcome messages
- Reorder sections
- Preview onboarding as employee would see it

**Template Structure:**
```
{
  "title": "Employee Onboarding",
  "sections": [
    {
      "day": 1,
      "title": "Welcome & Company Overview",
      "documents": [doc_id_1, doc_id_2],
      "description": "Learn about our mission..."
    },
    ...
  ]
}
```

**Acceptance Criteria:**
- ✅ Admin can create onboarding template
- ✅ Easy to add/remove/reorder sections
- ✅ Can attach documents to sections
- ✅ Preview function works
- ✅ Template auto-applies to new employees

---

### FR-7: Notifications

#### FR-7.1: Document Update Notifications
**Priority:** P2 (Nice to have)

**Description:** Notify all employees when documents are uploaded or updated

**Triggers:**
- New document uploaded
- Existing document updated (new version)

**Notification Content:**
- "New document uploaded: [Document Name]"
- "Document updated: [Document Name]"
- Timestamp
- Uploaded by (admin name)

**Delivery:**
- In-app notification (bell icon with badge)
- Optional: Email notification (future)

**Acceptance Criteria:**
- ✅ All employees notified on document changes
- ✅ Notifications appear in real-time (or on next page load)
- ✅ Notification history visible
- ✅ Mark as read functionality

---

## Technical Architecture

### Architecture Overview

Anstric Gaming follows a **three-tier architecture**:

```
┌─────────────────────────────────────────────────┐
│             FRONTEND (React)                    │
│  - Employee Portal: Chat, Analytics, Profile   │
│  - Admin Panel: Docs, Users, Analytics, Config │
│  - Shared: Login, Onboarding                    │
└─────────────────────────────────────────────────┘
                      │
                      │ REST API (JWT)
                      ▼
┌─────────────────────────────────────────────────┐
│           BACKEND (Express.js)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │   Auth   │  │   Chat   │  │   Docs   │     │
│  │ Service  │  │ Service  │  │ Service  │     │
│  └──────────┘  └──────────┘  └──────────┘     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │Analytics │  │Onboarding│  │  Queue   │     │
│  │ Service  │  │ Service  │  │ Service  │     │
│  └──────────┘  └──────────┘  └──────────┘     │
└─────────────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐
│   Supabase   │ │ Pinecone │ │  Redis   │
│  PostgreSQL  │ │  Vector  │ │  Cache   │
│   +Storage   │ │    DB    │ │  +Queue  │
└──────────────┘ └──────────┘ └──────────┘
                      │
                      ▼
            ┌──────────────────┐
            │   Groq Cloud     │
            │  (LLM API via    │
            │ Vercel AI SDK)   │
            └──────────────────┘
```

---

### Technology Stack

#### Frontend

**Framework & Language:**
- React 18+ (with Hooks)
- JavaScript/TypeScript
- Vite (build tool)

**Styling:**
- Tailwind CSS (utility-first)
- Custom components (no external UI library)
- Mobile-first responsive design

**State Management:**
- React Context API
- Local state with useState/useReducer
- Optional: Zustand (if needed)

**Routing:**
- React Router v6

**API Communication:**
- Axios or Fetch API
- JWT token in headers

**Real-time (optional):**
- WebSocket for notifications (future)

---

#### Backend

**Framework:**
- Node.js (v18+)
- Express.js (REST API)

**Language:**
- JavaScript (existing codebase)

**Authentication:**
- JWT (JSON Web Tokens)
- bcrypt for password hashing
- Custom auth middleware

**AI Integration:**
- Vercel AI SDK (for Groq API calls)
- LangChain (optional, if needed)

**File Processing:**
- `pdf-parse` for PDF text extraction
- `mammoth` for DOCX extraction
- `fs` for TXT/Markdown

**Background Jobs:**
- Bull or BullMQ (Redis-based queue)
- Process document uploads asynchronously

**API Documentation:**
- Swagger/OpenAPI (optional)

---

#### Databases & Storage

**Relational Database:**
- **Supabase PostgreSQL** (external connection)
  - User data (id, email, password_hash, role, created_at)
  - Documents (id, name, folder, uploaded_by, upload_date, status, version)
  - Conversations (id, user_id, title, created_at)
  - Messages (id, conversation_id, role, content, sources, rating, timestamp)
  - Onboarding progress (user_id, section_id, completed)
  - Notifications (id, user_id, message, read, timestamp)

**Vector Database:**
- **Pinecone**
  - Store document embeddings
  - Metadata: doc_id, chunk_id, doc_name, folder_path, chunk_text
  - Similarity search for RAG

**Cache & Queue:**
- **Redis**
  - Cache common Q&A pairs
  - Session storage (optional)
  - Queue for background jobs (Bull)

**Object Storage:**
- **Supabase Storage** (S3-compatible)
  - Store original document files
  - Public/private buckets
  - CDN for serving files

---

#### AI & Embeddings

**LLM Provider:**
- **Groq Cloud** (via Vercel AI SDK)
  - Models: llama-3.1-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b
  - Admin selectable
  - Streaming responses

**Embedding Model:**
- **HuggingFace sentence-transformers**
  - Model: `all-MiniLM-L6-v2` (or similar)
  - Generate embeddings for documents and queries
  - Consistent model for both indexing and querying

**RAG Framework:**
- Custom implementation using Vercel AI SDK
- Alternative: LangChain (if more orchestration needed)

---

### Data Models

#### User
```javascript
{
  id: UUID,
  email: String (unique),
  password_hash: String,
  full_name: String,
  role: Enum ['employee', 'admin'],
  status: Enum ['active', 'inactive', 'pending'],
  created_at: Timestamp,
  last_login: Timestamp,
  onboarding_completed: Boolean
}
```

#### Document
```javascript
{
  id: UUID,
  name: String,
  original_name: String,
  folder_id: UUID (nullable, FK),
  file_type: Enum ['pdf', 'docx', 'md', 'txt'],
  file_size: Integer (bytes),
  file_path: String (Supabase Storage path),
  uploaded_by: UUID (FK to User),
  upload_date: Timestamp,
  last_updated: Timestamp,
  status: Enum ['processing', 'ready', 'failed'],
  version: Integer,
  chunk_count: Integer,
  metadata: JSON {tags: [], category: ''}
}
```

#### Folder
```javascript
{
  id: UUID,
  name: String,
  parent_id: UUID (nullable, for nested folders),
  created_by: UUID (FK to User),
  created_at: Timestamp
}
```

#### Conversation
```javascript
{
  id: UUID,
  user_id: UUID (FK),
  title: String (auto-generated or user-set),
  created_at: Timestamp,
  updated_at: Timestamp
}
```

#### Message
```javascript
{
  id: UUID,
  conversation_id: UUID (FK),
  role: Enum ['user', 'assistant'],
  content: Text,
  sources: JSON [{doc_id, doc_name, chunk_text}],
  rating: Enum ['up', 'down', null],
  timestamp: Timestamp
}
```

#### OnboardingTemplate
```javascript
{
  id: UUID,
  title: String,
  sections: JSON [
    {
      day: Integer,
      title: String,
      description: Text,
      documents: [UUID]
    }
  ],
  created_by: UUID (FK),
  created_at: Timestamp,
  updated_at: Timestamp
}
```

#### OnboardingProgress
```javascript
{
  id: UUID,
  user_id: UUID (FK),
  section_index: Integer,
  completed: Boolean,
  completed_at: Timestamp
}
```

#### Notification
```javascript
{
  id: UUID,
  user_id: UUID (FK, null for all users),
  type: Enum ['document_upload', 'document_update', 'system'],
  message: Text,
  metadata: JSON {doc_id, doc_name},
  read: Boolean,
  created_at: Timestamp
}
```

---

### API Endpoints (High-Level)

#### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/signup` - Signup (via invitation)
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/invite` - Admin invites employee

#### Chat
- `GET /api/chat/conversations` - Get user's conversations
- `GET /api/chat/conversations/:id` - Get conversation messages
- `POST /api/chat/conversations` - Create new conversation
- `POST /api/chat/message` - Send message, get AI response
- `PUT /api/chat/message/:id/rating` - Rate message (👍/👎)
- `DELETE /api/chat/conversations/:id` - Delete conversation

#### Documents (Admin)
- `GET /api/documents` - List all documents
- `POST /api/documents/upload` - Upload document(s)
- `GET /api/documents/:id` - Get document details
- `PUT /api/documents/:id` - Update document metadata
- `DELETE /api/documents/:id` - Delete document
- `GET /api/folders` - List folders
- `POST /api/folders` - Create folder
- `PUT /api/folders/:id` - Rename folder
- `DELETE /api/folders/:id` - Delete folder

#### Analytics
- `GET /api/analytics/employee/:id` - Employee's own analytics
- `GET /api/analytics/admin` - Company-wide analytics
- `GET /api/analytics/questions/top` - Top questions
- `GET /api/analytics/questions/flagged` - Flagged questions
- `GET /api/analytics/documents` - Document usage stats

#### Onboarding
- `GET /api/onboarding/template` - Get onboarding template
- `PUT /api/onboarding/template` - Update template (admin)
- `GET /api/onboarding/progress/:userId` - Get user's progress
- `POST /api/onboarding/progress` - Mark section complete
- `GET /api/onboarding/status` - Get all employees' onboarding status (admin)

#### Users (Admin)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user
- `GET /api/users/:id/analytics` - Specific user analytics

#### Config (Admin)
- `GET /api/config/ai` - Get AI config
- `PUT /api/config/ai` - Update AI config

#### Notifications
- `GET /api/notifications` - Get user's notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

---

### Document Processing Implementation

**Existing Backend Note:** The backend already has document processing logic from a previous chatbot project. This will be adapted for Anstric Gaming.

**Processing Flow:**

1. **Upload Handler** (`/api/documents/upload`)
   ```javascript
   // Receive file from frontend
   // Save to Supabase Storage
   // Create database record (status: 'processing')
   // Add job to Bull queue
   // Return document ID to frontend
   ```

2. **Queue Job** (Bull worker)
   ```javascript
   // Retrieve file from Supabase Storage
   // Extract text based on file type
   // Chunk text (512-1024 tokens, 50-100 overlap)
   // Generate embeddings for each chunk
   // Store embeddings in Pinecone with metadata
   // Update database (status: 'ready', chunk_count)
   // Send notification to admin
   ```

3. **Text Extraction**
   ```javascript
   // PDF: use pdf-parse
   // DOCX: use mammoth.js
   // MD/TXT: read directly with fs
   ```

4. **Chunking**
   ```javascript
   // Split text intelligently
   // Preserve paragraph boundaries
   // Add overlap for context
   // Target: 512-1024 tokens per chunk
   ```

5. **Embedding Generation**
   ```javascript
   // Use HuggingFace model (all-MiniLM)
   // Generate vector for each chunk
   // Normalize vectors
   ```

6. **Pinecone Storage**
   ```javascript
   // Upsert vectors with metadata:
   // - id: chunk_id
   // - values: embedding vector
   // - metadata: {doc_id, doc_name, folder, chunk_text, chunk_index}
   ```

---

### RAG Query Implementation

**Query Flow:**

1. **Receive Question** (`/api/chat/message`)
   ```javascript
   // Validate input
   // Get conversation history (last 5 messages)
   ```

2. **Check Cache** (Optional)
   ```javascript
   // Hash question
   // Check Redis for cached answer
   // If found, return cached response
   ```

3. **Generate Query Embedding**
   ```javascript
   // Use same HuggingFace model
   // Generate embedding for question
   ```

4. **Similarity Search**
   ```javascript
   // Query Pinecone with embedding
   // Retrieve top K chunks (K = 5-10, configurable)
   // Filter by similarity score (> threshold)
   ```

5. **Construct Prompt**
   ```javascript
   const prompt = `
   You are Anstric Gaming, an AI assistant for [Company Name].
   Answer questions using ONLY the provided documents.
   If information is not in the documents, say so.
   
   Context from documents:
   ${retrievedChunks.map(c => c.text).join('\n\n')}
   
   Conversation history:
   ${conversationHistory}
   
   User question: ${userQuestion}
   
   Provide a helpful, accurate answer with proper formatting.
   `;
   ```

6. **Call Groq API** (via Vercel AI SDK)
   ```javascript
   import { createOpenAI } from '@ai-sdk/openai';
   import { streamText } from 'ai';
   
   const groq = createOpenAI({
     apiKey: process.env.GROQ_API_KEY,
     baseURL: 'https://api.groq.com/openai/v1',
   });
   
   const result = await streamText({
     model: groq(selectedModel), // admin configured
     messages: [
       { role: 'system', content: systemPrompt },
       ...conversationHistory,
       { role: 'user', content: userQuestion }
     ],
     temperature: configuredTemperature,
   });
   ```

7. **Stream Response**
   ```javascript
   // Stream tokens to frontend
   // Parse complete response
   // Extract sources used
   ```

8. **Save to Database**
   ```javascript
   // Save user message
   // Save assistant response with sources
   // Update conversation
   ```

9. **Cache Result** (Optional)
   ```javascript
   // Cache in Redis with TTL (1 hour)
   ```

---

## User Interface & Experience

### Design Principles

1. **Simplicity First:** Clean, uncluttered interface
2. **Mobile-Friendly:** Responsive design for all screen sizes
3. **Fast:** Minimal loading times, instant feedback
4. **Intuitive:** Self-explanatory UI, minimal learning curve

---

### Page Structure

#### For Employees

**1. Login Page**
- Email + password fields
- "Forgot password?" link
- Clean, centered form

**2. Onboarding Flow** (New users only)
- Welcome screen
- Progress bar (Day 1/5)
- Document reading area
- Integrated chat for questions
- "Mark complete" buttons
- "Next" navigation

**3. Dashboard/Home**
- Recent conversations (list)
- "Start new conversation" button
- Quick stats (questions asked, etc.)
- Notifications bell icon

**4. Chat Interface**
- Left sidebar: Conversation list
- Main area: Chat messages
- Input box at bottom
- Source citations clickable
- 👍/👎 on each AI response

**5. My Analytics**
- Stats cards (questions, conversations, ratings)
- Activity chart
- Most used documents

**6. Profile**
- Name, email
- Change password
- Logout button

---

#### For Admins

**All employee pages PLUS:**

**7. Document Management**
- Folder tree on left
- Document list (table or grid)
- Upload button (prominent)
- Search and filter
- Document status indicators
- Bulk actions

**8. User Management**
- User list (table)
- "Invite Employee" button
- Filter by role, status
- User details modal
- Analytics for each user

**9. Analytics Dashboard**
- Overview cards (total users, questions, docs, rating)
- Charts (questions over time, top questions, etc.)
- Filters (date range)
- Export button

**10. Onboarding Template Editor**
- Section list (drag to reorder)
- Add/edit section form
- Attach documents to sections
- Preview mode

**11. AI Configuration**
- Model dropdown
- Temperature slider
- Top K chunks slider
- Similarity threshold slider
- Save button

---

### UI Components (Tailwind CSS)

**Key Components:**
- Button (primary, secondary, danger)
- Input (text, password, search)
- TextArea (for messages)
- Card (for stats, documents)
- Table (for lists)
- Modal/Dialog (for confirmations)
- Dropdown/Select
- Tabs
- Sidebar navigation
- Loading spinner
- Toast notifications
- Badge (status indicators)
- Avatar (user profile pictures)

---

### Mobile Experience

**Responsive Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Mobile Adaptations:**
- Collapsible sidebar (hamburger menu)
- Stacked layout for stats
- Bottom input bar for chat (like WhatsApp)
- Swipe gestures for navigation
- Touch-optimized buttons (min 44x44px)

---

## Success Metrics

### Primary Metric

**Questions Answered Correctly**
- Measured by: Thumbs up ratio (👍 / total ratings)
- Target: 80%+ positive rating

### Secondary Metrics

1. **User Engagement**
   - Daily Active Users: 70%+ of total employees
   - Average questions per employee per week: 5+
   - Conversation completion rate: 80%+

2. **System Performance**
   - Response time: < 5 seconds (95th percentile)
   - Document processing time: < 2 minutes (95th percentile)
   - Uptime: 99%+

3. **Onboarding Effectiveness**
   - Onboarding completion rate: 90%+
   - Time to complete onboarding: < 3 days

4. **Knowledge Base Health**
   - Document coverage: 50+ documents uploaded
   - Active documents: 80%+ used at least once
   - Update frequency: 10+ updates per month

5. **User Satisfaction**
   - Qualitative feedback from pilot users
   - Adoption rate after 30 days: 80%+

---

## Out of Scope (Not in MVP)

The following features are **explicitly out of scope** for this college project MVP:

### ❌ External Integrations
- Notion sync
- GitHub repository sync
- Google Drive sync
- Slack integration
- Microsoft Teams integration

### ❌ Advanced Features
- Multi-language support
- Video content (transcription)
- Image OCR
- Excel/CSV processing
- PowerPoint processing
- Real-time collaboration
- Document co-editing
- Bookmarks/favorites
- Personal notes

### ❌ Security & Compliance
- Data encryption at rest
- Audit logs
- SOC 2 compliance
- GDPR compliance tools
- SSO/SAML
- MFA (Multi-factor authentication)
- IP whitelisting

### ❌ Advanced Analytics
- Predictive analytics
- Knowledge gap detection (automated)
- Document staleness detection (automated)
- Advanced sentiment analysis
- Custom report builder

### ❌ Scalability Features
- Multi-tenancy (for SaaS)
- White-labeling
- API for third-party integrations
- Webhooks
- Public API

### ❌ Advanced AI Features
- Custom model fine-tuning
- Ensemble models
- Advanced re-ranking
- Semantic caching (beyond simple Q&A)
- Voice input/output

### ❌ Additional User Roles
- Manager role
- Department-specific roles
- Custom role creation
- Granular permissions

---

## Appendix

### A. Glossary

- **RAG (Retrieval-Augmented Generation):** AI technique that retrieves relevant documents before generating answers
- **Embedding:** Vector representation of text for semantic similarity
- **Vector Database:** Specialized database for storing and querying embeddings (Pinecone)
- **Chunking:** Breaking documents into smaller segments for processing
- **LLM (Large Language Model):** AI model for text generation (Groq Cloud)
- **JWT (JSON Web Token):** Token-based authentication method
- **Bull:** Redis-based queue for background jobs

---

### B. Tech Stack Summary

| Component | Technology |
|-----------|------------|
| **Frontend** | React + Tailwind CSS |
| **Backend** | Node.js + Express.js |
| **Database** | Supabase PostgreSQL |
| **Vector DB** | Pinecone |
| **Cache/Queue** | Redis |
| **Storage** | Supabase Storage (S3) |
| **LLM** | Groq Cloud (via Vercel AI SDK) |
| **Embeddings** | HuggingFace (all-MiniLM) |
| **Auth** | JWT (custom) |
| **File Processing** | pdf-parse, mammoth, fs |
| **Background Jobs** | Bull/BullMQ |

---

### C. Document Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 16, 2026 | Initial PRD (too broad) |
| 2.0 | Jan 16, 2026 | Refined for college project: simplified scope, clarified tech stack, 2 roles only, removed external integrations, focused on MVP |

---

### D. Key Decisions Made

1. **No external integrations in MVP** - Focus on core functionality
2. **2 roles only** (Employee, Admin) - Simplified permissions
3. **Hybrid onboarding** - Template-based with AI assistance
4. **Groq Cloud for LLM** - Cost-effective, fast inference
5. **HuggingFace for embeddings** - Free, good quality
6. **React + Tailwind** - Existing frontend, custom components
7. **Express.js backend** - Existing codebase to adapt
8. **Simple analytics** - Basic metrics, no advanced predictions
9. **No encryption/audit logs** - College project, not production
10. **Document updates replace completely** - Simplify versioning

---

### E. Assumptions

- Target company has 10-50 employees
- All employees comfortable with English
- No sensitive/regulated data (PII, HIPAA, etc.)
- Internet connectivity always available
- Desktop/laptop is primary device (mobile is secondary)
- All users have valid email addresses
- Free tier limits of all services are sufficient
- No need for 24/7 support
- College project timeline: 2-4 months

---

**Document End**

---

## Next Steps

1. **Review this PRD v2** with stakeholders/team
2. **Create detailed implementation plan** based on this PRD
3. **Set up development environment** (databases, APIs)
4. **Start with authentication** and basic UI
5. **Implement RAG pipeline** (core feature)
6. **Build document management**
7. **Add analytics and onboarding**
8. **Test with real users** (pilot)
9. **Iterate based on feedback**
10. **Document the project** for college submission
