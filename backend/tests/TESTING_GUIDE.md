# Agent Feature Testing - Quick Start Guide

Run the automated integration test suite to verify the complete agent creation, document upload, text extraction, local training, and chatbot chat flow.

## Prerequisites Setup

Before running the agent feature tests, make sure default test credentials and database tables are seeded.

### 1. Database Seeding & User Setup

Run the unified cross-platform root setup script to recreate database tables and seed test accounts (Admin & Employee). From the project root, run:

```bash
npm run reset
```

This ensures a fresh database is initialized and creates accounts with:
- **Admin**: `admin@gmail.com` / `12345678` (Admin)
- **Employee**: `employee@gmail.com` / `12345678` (Employee)

### 2. Update Environment Variables

Verify these variables exist in your `backend/.env` file:

```env
PORT=8000
DB_PATH=./data/local.db
UPLOADS_DIR=./uploads

# Required for RAG and agent settings
GROQ_API_KEY=your_groq_api_key_here
PINECONE_API_KEY=your_pinecone_key_here
PINECONE_INDEX_NAME=cbrain
```

### 3. Start Application

If you just want to run the application for daily development without dropping the database, run:

```bash
npm start
```

This starts both the frontend and backend simultaneously. The backend server runs on `http://localhost:8000`.

---

## Running the Tests

### Option 1: Using npm script (Recommended)

```bash
npm run test:anstric-e2e
```

### Option 2: Using the shell script

```bash
./tests/run-agent-tests.sh
```

### Option 3: Direct execution

```bash
npx ts-node tests/test-anstric-e2e.ts
```

---

## What the Tests Do

The integration test suite will execute the following steps in order:

1. ✅ **Authenticate**: Logs in as the seeded Admin user (`admin@gmail.com`).
2. 🧹 **Clean Up**: Deletes any existing agents to satisfy the single active agent constraint.
3. 🤖 **Create Agent**: Creates the "Anstric Gaming" agent.
4. 📄 **Upload Document**: Uploads `Anstric QNA.txt` to the Knowledge Base (testing `application/octet-stream` text extraction).
5. 🔗 **Trigger Training**: Enqueues local training on the uploaded document.
6. 🚀 **Monitor Training**: Polls training status until state transitions to `completed`.
7. 🔍 **Verify DB State**: Confirms SQLite DB records show `is_embedded=true`.
8. 🧠 **Vector Search**: Tests retrieval query against Pinecone index and asserts hits are returned.
9. 💬 **Chatbot Q&A**: Asks the agent *"Who is the founder of Anstric Games?"* and asserts that the response mentions *"Aditya More"*.

---

## Manual Testing Alternative

If you prefer to test manually, you can use these curl commands:

### 1. Login
```bash
curl -X POST http://localhost:8000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"12345678"}'
```

### 2. Upload Document
```bash
curl -X POST http://localhost:8000/api/v1/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/Anstric QNA.txt"
```

### 3. Create Agent
```bash
curl -X POST http://localhost:8000/api/v1/agents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Anstric Gaming",
    "provider": "groq",
    "model": "llama-3.3-70b-versatile",
    "system_prompt": "You are Anstric Gaming, a helpful AI assistant."
  }'
```

### 4. Train with Documents
```bash
curl -X POST http://localhost:8000/api/v1/agents/AGENT_ID/train \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"documentIds": [1]}'
```
