# Agent Feature Integration Tests

This directory contains comprehensive integration tests for the Agent Management features implemented according to `AGENTS_FEATURE_PLAN.md`.

## Test Files

### `test-agent-features-integration.ts`
Comprehensive end-to-end integration tests covering:

1. **Document Upload** - Upload documents to Knowledge Base
2. **List Documents** - Retrieve documents from Knowledge Base
3. **Create Agent** - Create a test agent
4. **Link Documents to Agent** - Link documents via training endpoint
5. **Training Status** - Monitor training progress
6. **Provider Models** - Fetch available provider models
7. **Playground Chat** - Test chat with ephemeral overrides
8. **Agent Details** - Verify agent configuration

## Running the Tests

### Prerequisites
1. Backend server must be running (`npm run dev`)
2. Valid admin credentials in `.env`:
   ```env
   TEST_EMAIL=admin@test.com
   TEST_PASSWORD=Test123!@#
   API_URL=http://localhost:5000
   ```
3. Required API keys (for training tests):
   ```env
   GROQ_API_KEY=your_groq_api_key
   PINECONE_API_KEY=your_pinecone_key
   PINECONE_ENVIRONMENT=your_pinecone_env
   ```

### Quick Start

**Option 1: Using the test runner script (recommended)**
```bash
# Make script executable
chmod +x tests/run-agent-tests.sh

# Run tests
./tests/run-agent-tests.sh
```

**Option 2: Direct execution**
```bash
# Run with ts-node
npx ts-node tests/test-agent-features-integration.ts
```

**Option 3: Using npm**
```bash
# Add to package.json scripts:
# "test:agent-features": "ts-node tests/test-agent-features-integration.ts"

npm run test:agent-features
```

## Test Scenarios

### Scenario 1: Document Upload & Management
- Creates a test document
- Uploads to Knowledge Base via `/documents/upload`
- Verifies document appears in list
- Validates document metadata

### Scenario 2: Agent Creation & Configuration
- Creates test agent with provider/model settings
- Validates agent configuration
- Checks agent is retrievable

### Scenario 3: Document-Agent Linking
- Links documents to agent via training endpoint
- Sends `POST /agents/:id/train` with `documentIds` array
- Verifies sync service is called
- Monitors training job initiation

### Scenario 4: Training Flow Validation
- Checks training status via `/agents/:id/train/status`
- Monitors progress percentage
- Validates training state transitions

### Scenario 5: Provider Models API
- Fetches all available models via `/provider-models`
- Groups models by provider
- Validates model metadata

### Scenario 6: Playground Chat with Overrides
- Sends chat request with ephemeral overrides
- Tests temperature override
- Tests system prompt override
- Validates override application (if implemented)

### Scenario 7: Resource Cleanup
- Deletes test agent
- Deletes test document
- Ensures no orphaned resources

## Expected Output

Successful test run will show:
```
█████████████████████████████████████████████████████████████
  AGENT FEATURE INTEGRATION TESTS
█████████████████████████████████████████████████████████████

============================================================
  Authentication
============================================================
✅ Authenticated as admin@test.com
ℹ️  Token: eyJhbGciOiJIUzI1NiI...

============================================================
  Test 1: Document Upload to Knowledge Base
============================================================
ℹ️  Created test file: test-document.txt
✅ Document uploaded successfully
ℹ️  Document ID: 42
ℹ️  File name: Integration Test Document
...

============================================================
  All Tests Completed Successfully! 🎉
============================================================
✅ Total duration: 8.45s

✨ Test suite completed successfully!
```

## Troubleshooting

### Authentication Fails
- Verify `TEST_EMAIL` and `TEST_PASSWORD` in `.env`
- Ensure admin user exists (run `npm run create-admin`)
- Check backend is running on correct port

### Document Upload Fails
- Check file permissions in test directory
- Verify multer configuration in backend
- Ensure S3/storage credentials are valid

### Training Fails
- Verify `GROQ_API_KEY` is set and valid
- Check Pinecone credentials
- Ensure agent has valid provider/model configuration

### Chat Test Fails
- This might be expected if chat controller doesn't handle overrides yet
- Check chat endpoint implementation
- Verify agent is trained before testing chat

## Notes

- Tests automatically clean up created resources
- Each run creates and deletes a test document and agent
- Tests are idempotent and can be run multiple times
- Failed tests will still attempt cleanup
- Training may take several minutes to complete

## CI/CD Integration

To integrate with CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Agent Feature Tests
  run: |
    npm run dev &
    sleep 5
    ./tests/run-agent-tests.sh
  env:
    TEST_EMAIL: ${{ secrets.TEST_EMAIL }}
    TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
    GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
```
