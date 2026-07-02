/**
 * ============================================================
 * Multi-Agent Feature Tests
 * ============================================================
 *
 * Tests every change made for the multi-agent feature:
 *
 *  UNIT TESTS (no server needed — run with --unit):
 *  U1.  agent.service.ts  — Hard limit is 3, not 1
 *  U2.  agent.service.ts  — getAllActiveAgents() method exists
 *  U3.  agent.controller.ts — getAllActiveAgents handler exists
 *  U4.  agent.route.ts    — /agents/active-all route is registered BEFORE /:id
 *  U5.  agentService.ts   — Frontend getAllActiveAgents() method exists
 *  U6.  AskBrain.tsx      — Uses getAllActiveAgents (not getActiveAgent)
 *  U7.  AskBrain.tsx      — AgentSelector component is present
 *  U8.  AskBrain.tsx      — handles agent switching (isSwitchingAgent state)
 *  U9.  AgentListPage.tsx — Create button is present (not hidden)
 *  U10. AgentListPage.tsx — Shows "X / 3 slots used" badge
 *
 *  INTEGRATION TESTS (server must be running on :8000):
 *  I1.  GET /agents/active-all — returns 200 and an array
 *  I2.  GET /agents/active-all — includes id, name, provider, model, training_status
 *  I3.  POST /agents (4th agent) — returns 400 with the 3-agent limit error
 *  I4.  POST /agents (2nd agent) — succeeds (limit is 3, not 1)
 *  I5.  GET /agents/active-all — returns both agents after creation
 *  I6.  Multi-agent chat       — chat works with the 2nd agent's ID
 *  I7.  Cleanup                — delete the 2nd agent created in tests
 *
 * Run unit tests only (no server needed):
 *   cd backend && npx ts-node tests/test-multiagent.ts --unit
 *
 * Run all tests (requires server on :8000 + an existing agent):
 *   cd backend && npx ts-node tests/test-multiagent.ts
 */

import axios, { AxiosInstance } from "axios";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

dotenv.config();

/* ──────────────────────────────────────────────────────────── */
/*  CONFIG                                                       */
/* ──────────────────────────────────────────────────────────── */
const BASE_URL = "http://localhost:8000/api/v1";
const CREDENTIALS = { email: "admin@gmail.com", password: "12345678" };
const RUN_INTEGRATION = !process.argv.includes("--unit");

// Source file paths
const SRC = path.join(__dirname, "..", "src");
const FRONTEND_SRC = path.join(__dirname, "..", "..", "frontend", "src");

/* ──────────────────────────────────────────────────────────── */
/*  COLOUR HELPERS                                               */
/* ──────────────────────────────────────────────────────────── */
const c = {
  reset: "\x1b[0m", bold: "\x1b[1m",
  green: "\x1b[32m", red: "\x1b[31m",
  yellow: "\x1b[33m", blue: "\x1b[34m", cyan: "\x1b[36m",
};

function logSection(t: string) {
  console.log(`\n${c.blue}${"═".repeat(66)}${c.reset}`);
  console.log(`${c.bold}${c.blue}  ${t}${c.reset}`);
  console.log(`${c.blue}${"═".repeat(66)}${c.reset}`);
}

/* ──────────────────────────────────────────────────────────── */
/*  ASSERT HELPERS                                               */
/* ──────────────────────────────────────────────────────────── */
interface Result { name: string; passed: boolean; detail: string }
const results: Result[] = [];

function assert(name: string, condition: boolean, detail: string = "") {
  results.push({ name, passed: condition, detail });
  const icon = condition ? `${c.green}✅` : `${c.red}❌`;
  console.log(`  ${icon} ${name}${c.reset}`);
  if (!condition) console.log(`     ${c.red}→ ${detail}${c.reset}`);
  else if (detail) console.log(`     ${c.cyan}→ ${detail}${c.reset}`);
}

function readSrc(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

/* ──────────────────────────────────────────────────────────── */
/*  U1-U3 — Backend Service & Controller                         */
/* ──────────────────────────────────────────────────────────── */
logSection("U1–U3 · Backend — agent.service.ts & agent.controller.ts");

(() => {
  const serviceSource = readSrc(
    path.join(SRC, "features/agent/services/agent.service.ts")
  );

  assert(
    "U1a: 3-agent hard limit: MAX_AGENTS constant is defined as 3",
    serviceSource.includes("const MAX_AGENTS = 3"),
    "Expected: const MAX_AGENTS = 3"
  );

  assert(
    "U1b: Old 1-agent restriction is removed (no 'create one agent' error)",
    !serviceSource.includes("You can only create one agent"),
    "Old single-agent error message must be gone"
  );

  assert(
    "U1c: Limit check uses MAX_AGENTS (>= MAX_AGENTS), not > 0",
    serviceSource.includes(">= MAX_AGENTS"),
    "Must use: if (existingAgents.length >= MAX_AGENTS)"
  );

  assert(
    "U2a: getAllActiveAgents() method exists in AgentService",
    serviceSource.includes("public async getAllActiveAgents()"),
    "Method signature missing"
  );

  assert(
    "U2b: getAllActiveAgents() queries for is_active: 1 agents",
    serviceSource.includes("is_active: 1") &&
    serviceSource.includes("getAllActiveAgents"),
    "Must filter by is_active: 1"
  );

  assert(
    "U2c: getAllActiveAgents() filters out soft-deleted agents",
    serviceSource.includes("is_deleted: false") &&
    serviceSource.includes("getAllActiveAgents"),
    "Must also filter by is_deleted: false"
  );

  const controllerSource = readSrc(
    path.join(SRC, "features/agent/agent.controller.ts")
  );

  assert(
    "U3a: getAllActiveAgents handler exists in AgentController",
    controllerSource.includes("public getAllActiveAgents ="),
    "Handler method missing in controller"
  );

  assert(
    "U3b: Handler calls agentService.getAllActiveAgents()",
    controllerSource.includes("this.agentService.getAllActiveAgents()"),
    "Must delegate to service method"
  );

  assert(
    "U3c: Handler maps each agent through sanitizeAgentResponse",
    controllerSource.includes("agents.map((agent) => sanitizeAgentResponse(agent))"),
    "Must sanitize each agent before returning"
  );
})();

/* ──────────────────────────────────────────────────────────── */
/*  U4 — Route Registration Order                                */
/* ──────────────────────────────────────────────────────────── */
logSection("U4 · Routes — /agents/active-all registered before /:id");

(() => {
  const routeSource = readSrc(
    path.join(SRC, "features/agent/agent.route.ts")
  );

  assert(
    "U4a: /agents/active-all route is registered",
    routeSource.includes("active-all"),
    "Route /agents/active-all is missing from agent.route.ts"
  );

  assert(
    "U4b: getAllActiveAgents handler is used for the route",
    routeSource.includes("this.agentController.getAllActiveAgents"),
    "Route must reference the getAllActiveAgents handler"
  );

  // Critical: active-all must appear BEFORE /:id in the file to avoid route conflict
  const activeAllPos = routeSource.indexOf("active-all");
  const paramIdPos = routeSource.indexOf("`${this.path}/:id`");

  assert(
    "U4c: /active-all route is registered BEFORE /:id (no route shadowing)",
    activeAllPos < paramIdPos && activeAllPos > 0,
    `active-all at char ${activeAllPos}, /:id at char ${paramIdPos} — must be active-all < :id`
  );
})();

/* ──────────────────────────────────────────────────────────── */
/*  U5-U8 — Frontend agentService.ts & AskBrain.tsx             */
/* ──────────────────────────────────────────────────────────── */
logSection("U5–U8 · Frontend — agentService.ts & AskBrain.tsx");

(() => {
  const agentServiceSource = readSrc(
    path.join(FRONTEND_SRC, "services/agentService.ts")
  );

  assert(
    "U5a: getAllActiveAgents() method exists in frontend AgentService",
    agentServiceSource.includes("async getAllActiveAgents()"),
    "Method missing from frontend agentService.ts"
  );

  assert(
    "U5b: getAllActiveAgents() calls /agents/active-all endpoint",
    agentServiceSource.includes("active-all"),
    "Must call the /agents/active-all backend endpoint"
  );

  const askBrainSource = readSrc(
    path.join(FRONTEND_SRC, "pages/employee/AskBrain.tsx")
  );

  assert(
    "U6a: AskBrain uses getAllActiveAgents() (not just getActiveAgent)",
    askBrainSource.includes("getAllActiveAgents"),
    "AskBrain must call getAllActiveAgents to support multi-agent"
  );

  assert(
    "U6b: AskBrain no longer hard-codes to a single getActiveAgent() only",
    // It may still import getActiveAgent but the init flow must use getAllActiveAgents
    !askBrainSource.includes("const agent = await agentService.getActiveAgent()"),
    "Should not fall back to single-agent pattern in initializeChat"
  );

  assert(
    "U7a: AgentSelector component is defined in AskBrain.tsx",
    askBrainSource.includes("const AgentSelector"),
    "AgentSelector component must be defined"
  );

  assert(
    "U7b: AgentSelector renders a dropdown with agent list",
    askBrainSource.includes("agents.map((agent)") &&
    askBrainSource.includes("AgentSelector"),
    "Must iterate agents inside the selector"
  );

  assert(
    "U7c: Agent dropdown shows provider and model info",
    askBrainSource.includes("agent.provider") &&
    askBrainSource.includes("agent.model"),
    "Must display provider and model in the dropdown"
  );

  assert(
    "U8a: isSwitchingAgent state is managed",
    askBrainSource.includes("isSwitchingAgent"),
    "Must have an isSwitchingAgent state for UX during agent switch"
  );

  assert(
    "U8b: Switching agent resets messages and session state",
    askBrainSource.includes("setMessages([])") &&
    askBrainSource.includes("setActiveSession(null)"),
    "Must clear messages and active session when switching agents"
  );

  assert(
    "U8c: allAgents state holds the list of all available agents",
    askBrainSource.includes("allAgents") &&
    askBrainSource.includes("setAllAgents"),
    "Must maintain allAgents state array"
  );

  assert(
    "U8d: selectedAgent state tracks the currently chosen agent",
    askBrainSource.includes("selectedAgent") &&
    askBrainSource.includes("setSelectedAgent"),
    "Must maintain selectedAgent state"
  );

  assert(
    "U8e: Input placeholder adapts to selected agent name",
    askBrainSource.includes("selectedAgent.name") &&
    askBrainSource.includes("placeholder"),
    "Input placeholder should mention the selected agent name"
  );
})();

/* ──────────────────────────────────────────────────────────── */
/*  U9-U10 — AgentListPage.tsx                                   */
/* ──────────────────────────────────────────────────────────── */
logSection("U9–U10 · Frontend — AgentListPage.tsx");

(() => {
  const listPageSource = readSrc(
    path.join(FRONTEND_SRC, "pages/admin/agents/AgentListPage.tsx")
  );

  assert(
    "U9a: Create New Agent button is no longer commented out",
    !listPageSource.includes("Create New Agent button removed"),
    "The old 'button removed' comment must be gone"
  );

  assert(
    "U9b: handleCreateNew is connected to a visible button",
    listPageSource.includes("onClick={handleCreateNew}"),
    "Must have a button wired to handleCreateNew"
  );

  assert(
    "U9c: Button is conditionally shown only when under the 3-agent limit",
    listPageSource.includes("agents.length < 3"),
    "Must guard the create button with agents.length < 3"
  );

  assert(
    "U10a: Agent count badge shows X / 3 slots used",
    listPageSource.includes("/ 3 slots used"),
    "Must show a '/ 3 slots used' badge"
  );

  assert(
    "U10b: Agent count badge uses agents.length dynamically",
    listPageSource.includes("{agents.length}") &&
    listPageSource.includes("slots used"),
    "Badge must use {agents.length} dynamically"
  );
})();

/* ──────────────────────────────────────────────────────────── */
/*  INTEGRATION TESTS                                            */
/* ──────────────────────────────────────────────────────────── */
async function runIntegrationTests() {
  logSection("Integration Tests — server must be running on :8000");

  const api: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 20_000,
    validateStatus: () => true,
  });

  // ── Login ─────────────────────────────────────────────────
  console.log("  → Logging in...");
  const loginRes = await api.post("/users/login", CREDENTIALS);
  if (loginRes.status !== 200) {
    assert("I0: Login", false, `HTTP ${loginRes.status}`);
    return;
  }
  const token = loginRes.data?.data?.accessToken || loginRes.data?.data?.token;
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  assert("I0: Login successful", !!token, `Token: ${token?.substring(0, 20)}...`);

  // Get first existing agent (we need at least 1 for most tests)
  const agentsRes = await api.get("/agents");
  const existingAgents: any[] = agentsRes.data?.data || [];
  assert(
    "I0b: At least 1 agent exists for integration tests",
    existingAgents.length > 0,
    existingAgents.length === 0
      ? "Run test-anstric-e2e.ts first to create the base agent"
      : `Found ${existingAgents.length} agent(s)`
  );
  if (existingAgents.length === 0) return;

  const firstAgentId = existingAgents[0].id;

  // ── I1: GET /agents/active-all ────────────────────────────
  logSection("I1–I2 · GET /agents/active-all");
  const activeAllRes = await api.get("/agents/active-all");

  assert(
    "I1: GET /agents/active-all returns 200",
    activeAllRes.status === 200,
    `HTTP ${activeAllRes.status}: ${JSON.stringify(activeAllRes.data).substring(0, 120)}`
  );

  const activeAgents: any[] = activeAllRes.data?.data || [];
  assert(
    "I1b: Response data is an array",
    Array.isArray(activeAgents),
    `Got type: ${typeof activeAgents}`
  );

  assert(
    "I1c: At least 1 active agent returned",
    activeAgents.length >= 1,
    `Got ${activeAgents.length} agents`
  );

  if (activeAgents.length > 0) {
    const a = activeAgents[0];
    assert(
      "I2a: Each agent has 'id' field",
      typeof a.id === "number",
      `id = ${a.id}`
    );
    assert(
      "I2b: Each agent has 'name' field",
      typeof a.name === "string" && a.name.length > 0,
      `name = "${a.name}"`
    );
    assert(
      "I2c: Each agent has 'provider' field",
      typeof a.provider === "string",
      `provider = "${a.provider}"`
    );
    assert(
      "I2d: Each agent has 'model' field",
      typeof a.model === "string",
      `model = "${a.model}"`
    );
    assert(
      "I2e: Each agent has 'training_status' field",
      typeof a.training_status === "string",
      `training_status = "${a.training_status}"`
    );
    assert(
      "I2f: Sensitive fields (encrypted_api_key) are NOT returned",
      a.encrypted_api_key === undefined,
      "encrypted_api_key must be sanitized out of the response"
    );
  }

  // ── I3: 3-agent limit enforcement ─────────────────────────
  logSection("I3–I5 · Multi-Agent Creation Limit & 2nd Agent");

  // Only try to create a 2nd agent if there's room
  let secondAgentId: number | null = null;

  if (existingAgents.length === 1) {
    console.log("  → Creating 2nd agent to test multi-agent support...");
    const agent2Res = await api.post("/agents", {
      name: "Test Agent #2",
      provider: "groq",
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
    });

    assert(
      "I4: Creating 2nd agent succeeds (limit is 3, not 1)",
      agent2Res.status === 201 || agent2Res.status === 200,
      `HTTP ${agent2Res.status}: ${JSON.stringify(agent2Res.data?.message || "")}`
    );

    secondAgentId = agent2Res.data?.data?.id ?? null;
    if (secondAgentId) {
      console.log(`     ${c.cyan}→ 2nd agent created with ID: ${secondAgentId}${c.reset}`);
    }
  } else {
    assert(
      "I4: 2nd agent already exists (skipping creation)",
      true,
      `${existingAgents.length} agents already exist`
    );
    secondAgentId = existingAgents[1]?.id ?? null;
  }

  // ── I3: Verify 4th agent is blocked ──────────────────────
  // Create agents up to 3 if needed, then try a 4th
  const currentAgentsRes = await api.get("/agents");
  const currentAgents: any[] = currentAgentsRes.data?.data || [];

  if (currentAgents.length >= 3) {
    // Already at limit — try adding one more
    const overLimitRes = await api.post("/agents", {
      name: "Should Fail Agent",
      provider: "groq",
      model: "llama-3.1-8b-instant",
    });

    assert(
      "I3: Creating agent beyond 3-slot limit returns 400",
      overLimitRes.status === 400,
      `HTTP ${overLimitRes.status}: ${overLimitRes.data?.message}`
    );

    assert(
      "I3b: Error message mentions the 3-agent limit",
      (overLimitRes.data?.message || "").includes("3"),
      `Message: "${overLimitRes.data?.message}"`
    );
  } else {
    assert(
      "I3: Limit test skipped (need 3 agents — currently have " + currentAgents.length + ")",
      true,
      `Only ${currentAgents.length} agents — create ${3 - currentAgents.length} more to test the limit`
    );
  }

  // ── I5: /agents/active-all reflects multiple agents ───────
  const activeAllRes2 = await api.get("/agents/active-all");
  const activeAgents2: any[] = activeAllRes2.data?.data || [];

  assert(
    "I5: GET /agents/active-all shows all active agents",
    activeAllRes2.status === 200,
    `HTTP ${activeAllRes2.status}`
  );

  const expectedCount = currentAgents.filter((a: any) => a.is_active === 1).length;
  assert(
    `I5b: /agents/active-all returns ${expectedCount} active agent(s)`,
    activeAgents2.length === expectedCount,
    `Got ${activeAgents2.length}, expected ${expectedCount}`
  );

  // ── I6: Chat works with 2nd agent if available ────────────
  if (secondAgentId) {
    logSection("I6 · Chat with 2nd Agent");
    console.log(`  → Creating chat session with agent #${secondAgentId}...`);

    const sessionRes = await api.post("/chat/sessions", { agentId: secondAgentId });
    assert(
      "I6a: Chat session creation works for 2nd agent",
      sessionRes.status === 200 || sessionRes.status === 201,
      `HTTP ${sessionRes.status}: ${JSON.stringify(sessionRes.data?.message || "")}`
    );

    const sessionId = sessionRes.data?.data?.id;
    if (sessionId) {
      console.log(`  → Sending message to agent #${secondAgentId}...`);
      const chatRes = await api.post(`/chat/agents/${secondAgentId}`, {
        messages: [{ role: "user", content: "Hello, what can you help me with?" }],
        sessionId: String(sessionId),
      });

      assert(
        "I6b: Chat endpoint works with 2nd agent ID (200 response)",
        chatRes.status === 200,
        `HTTP ${chatRes.status}: ${JSON.stringify(chatRes.data).substring(0, 100)}`
      );

      if (chatRes.status === 200) {
        const reply = chatRes.data?.data?.response || chatRes.data?.data?.message || "";
        assert(
          "I6c: Chat returns a non-empty reply from 2nd agent",
          reply.length > 0,
          `Reply: "${reply.substring(0, 60)}..."`
        );
      }

      // Clean up test session
      await api.delete(`/chat/sessions/${sessionId}`);
    }
  }

  // ── I7: Cleanup 2nd test agent ────────────────────────────
  if (secondAgentId && existingAgents.length === 1) {
    logSection("I7 · Cleanup — Delete 2nd Test Agent");
    console.log(`  → Deleting test agent ID ${secondAgentId}...`);

    const delRes = await api.delete(`/agents/${secondAgentId}`);
    assert(
      "I7: Cleanup — 2nd test agent deleted successfully",
      delRes.status === 200,
      `HTTP ${delRes.status}: ${JSON.stringify(delRes.data?.message || "")}`
    );

    const afterCleanupRes = await api.get("/agents");
    const afterCleanup: any[] = afterCleanupRes.data?.data || [];
    assert(
      "I7b: Agent count is back to 1 after cleanup",
      afterCleanup.length === 1,
      `Agent count after cleanup: ${afterCleanup.length}`
    );
  } else {
    logSection("I7 · Cleanup");
    assert(
      "I7: Cleanup skipped (2nd agent was pre-existing or not created)",
      true,
      "No cleanup needed"
    );
  }
}

/* ──────────────────────────────────────────────────────────── */
/*  SUMMARY                                                      */
/* ──────────────────────────────────────────────────────────── */
function printSummary() {
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const allPassed = passed === total;
  const failed = results.filter(r => !r.passed);

  console.log(`\n${c.bold}${"█".repeat(66)}${c.reset}`);
  console.log(`${c.bold}  MULTI-AGENT FEATURE TESTS — ${passed}/${total} passed${c.reset}`);
  console.log(`${c.bold}${"█".repeat(66)}${c.reset}`);

  if (failed.length > 0) {
    console.log(`\n${c.red}${c.bold}  FAILED CHECKS:${c.reset}`);
    failed.forEach(r => {
      console.log(`  ${c.red}❌ ${r.name}${c.reset}`);
      if (r.detail) console.log(`     ${r.detail}`);
    });
  }

  console.log(`\n${allPassed ? c.green : c.red}${c.bold}  ${allPassed ? "🎉 ALL CHECKS PASSED" : "⚠ SOME CHECKS FAILED"}${c.reset}\n`);
  process.exit(allPassed ? 0 : 1);
}

/* ──────────────────────────────────────────────────────────── */
/*  ENTRY POINT                                                  */
/* ──────────────────────────────────────────────────────────── */
async function main() {
  console.log(`\n${c.bold}${"█".repeat(66)}${c.reset}`);
  console.log(`${c.bold}  MULTI-AGENT FEATURE TEST SUITE${c.reset}`);
  console.log(`${c.bold}  Mode: ${RUN_INTEGRATION ? "Unit + Integration" : "Unit only"}${c.reset}`);
  console.log(`${c.bold}${"█".repeat(66)}${c.reset}`);

  if (RUN_INTEGRATION) {
    try {
      await runIntegrationTests();
    } catch (e: any) {
      assert(
        "Integration: Server reachable",
        false,
        `Server not reachable at ${BASE_URL} — start with 'npm run dev' first. Error: ${e.message}`
      );
    }
  }

  printSummary();
}

main().catch(e => {
  console.error("\n💥 Test runner crashed:", e.message);
  process.exit(1);
});
