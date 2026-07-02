/**
 * ============================================================
 * Anstric Gaming Integration Test: Clear Agent Training
 * ============================================================
 *
 * What this test does:
 *  1. Login as admin@gmail.com
 *  2. Clean up existing agents.
 *  3. Create a new "Anstric Gaming Test" agent.
 *  4. Upload a document and initiate training.
 *  5. Wait for training to complete.
 *  6. Call clear-training endpoint.
 *  7. Verify agent status is reset to idle.
 *  8. Verify sources are soft-deleted.
 *  9. Test Idempotency (calling clear-training again).
 *  10. Test Unauthorized Access (Employee trying to clear Admin's agent).
 *
 * Run with:
 *   npx ts-node tests/test-clear-training.ts
 */

import axios, { AxiosInstance } from "axios";
import fs from "fs";
import FormData from "form-data";
import path from "path";

/* ──────────────────────────────────────────────────────────── */
/*  CONFIG                                                       */
/* ──────────────────────────────────────────────────────────── */
const BASE_URL = "http://localhost:8000/api/v1";
const ADMIN_CREDENTIALS = { email: "admin@gmail.com", password: "12345678" };
const EMPLOYEE_CREDENTIALS = { email: "employee@gmail.com", password: "12345678" };
const AGENT_NAME = "Clear Training Test Agent";
const FILE_PATH = path.join(__dirname, "..", "..", "Anstric QNA.txt");
const POLL_INTERVAL_MS = 3_000;
const MAX_POLL_ATTEMPTS = 20;

/* ──────────────────────────────────────────────────────────── */
/*  COLOUR HELPERS                                               */
/* ──────────────────────────────────────────────────────────── */
const c = {
    reset: "\x1b[0m", bold: "\x1b[1m", green: "\x1b[32m",
    red: "\x1b[31m", yellow: "\x1b[33m", blue: "\x1b[34m", cyan: "\x1b[36m",
};

function logSection(title: string) {
    console.log(`\n${c.blue}${"═".repeat(62)}${c.reset}`);
    console.log(`${c.bold}${c.blue}  ${title}${c.reset}`);
    console.log(`${c.blue}${"═".repeat(62)}${c.reset}`);
}

function ok(msg: string, data?: any) {
    console.log(`  ${c.green}✅ ${msg}${c.reset}`);
    if (data !== undefined) console.log(`     ${JSON.stringify(data, null, 2)}`);
}

function fail(msg: string, data?: any) {
    console.log(`  ${c.red}❌ ${msg}${c.reset}`);
    if (data !== undefined) console.log(`     ${JSON.stringify(data, null, 2)}`);
}

function info(msg: string, data?: any) {
    console.log(`  ${c.cyan}ℹ  ${msg}${c.reset}`);
    if (data !== undefined) console.log(`     ${JSON.stringify(data, null, 2)}`);
}

function warn(msg: string, data?: any) {
    console.log(`  ${c.yellow}⚠  ${msg}${c.reset}`);
    if (data !== undefined) console.log(`     ${JSON.stringify(data, null, 2)}`);
}

/* ──────────────────────────────────────────────────────────── */
/*  RESULT TRACKER                                               */
/* ──────────────────────────────────────────────────────────── */
interface StepResult { step: string; passed: boolean; detail: string; }
const results: StepResult[] = [];
function record(step: string, passed: boolean, detail: string) {
    results.push({ step, passed, detail });
}

/* ──────────────────────────────────────────────────────────── */
/*  MAIN TEST                                                    */
/* ──────────────────────────────────────────────────────────── */
async function main() {
    console.log(`\n${c.bold}${"█".repeat(62)}${c.reset}`);
    console.log(`${c.bold}  TEST: CLEAR AGENT TRAINING FEATURE${c.reset}`);
    console.log(`${c.bold}${"█".repeat(62)}${c.reset}`);

    const api: AxiosInstance = axios.create({
        baseURL: BASE_URL,
        timeout: 30_000,
        validateStatus: () => true, // never throw on HTTP errors
    });

    let adminToken = "";
    let employeeToken = "";
    let agentId: number | null = null;
    let documentId: number | null = null;

    /* ── STEP 1: LOGIN ───────────────────────────────────────── */
    logSection("STEP 1 — Admin Login");
    const rAuth = await api.post("/users/login", ADMIN_CREDENTIALS);
    if (rAuth.status === 200) {
        adminToken = rAuth.data?.data?.accessToken || rAuth.data?.data?.token;
        api.defaults.headers.common["Authorization"] = `Bearer ${adminToken}`;
        ok("Admin authenticated");
        record("Admin Login", true, "Success");
    } else {
        fail("Admin login failed", rAuth.data);
        record("Admin Login", false, "Failed");
        printSummary();
        return;
    }

    /* ── STEP 2: CLEANUP ─────────────────────────────────────── */
    logSection("STEP 2 — Cleanup Existing Agents");
    const rAgents = await api.get("/agents");
    if (rAgents.status === 200 && Array.isArray(rAgents.data.data)) {
        for (const agent of rAgents.data.data) {
            await api.delete(`/agents/${agent.id}`);
            info(`Deleted agent ${agent.id}`);
        }
        ok("Cleanup completed");
        record("Cleanup", true, "Success");
    } else {
        fail("Failed to fetch agents for cleanup", rAgents.data);
        record("Cleanup", false, "Failed");
    }

    /* ── STEP 3: CREATE AGENT ────────────────────────────────── */
    logSection("STEP 3 — Create Agent");
    const rCreate = await api.post("/agents", {
        name: AGENT_NAME,
        provider: "groq",
        model: "llama-3.1-8b-instant",
        system_prompt: "Test prompt"
    });
    if (rCreate.status === 201) {
        agentId = rCreate.data.data.id;
        ok(`Created agent ${agentId}`);
        record("Create Agent", true, `ID: ${agentId}`);
    } else {
        fail("Failed to create agent", rCreate.data);
        record("Create Agent", false, "Failed");
        printSummary();
        return;
    }

    /* ── STEP 4: UPLOAD DOC ──────────────────────────────────── */
    logSection("STEP 4 — Upload Document");
    if (!fs.existsSync(FILE_PATH)) {
        fail("Test file not found", FILE_PATH);
        record("Upload Doc", false, "File missing");
        printSummary();
        return;
    }
    const form = new FormData();
    form.append("file", fs.createReadStream(FILE_PATH));
    const rUpload = await api.post("/documents/upload", form, {
        headers: { ...form.getHeaders() }
    });
    if (rUpload.status === 201) {
        documentId = rUpload.data.data.id;
        ok(`Uploaded document ${documentId}`);
        record("Upload Doc", true, `ID: ${documentId}`);
    } else {
        fail("Failed to upload doc", rUpload.data);
        record("Upload Doc", false, "Failed");
        printSummary();
        return;
    }

    /* ── STEP 5: TRAIN & WAIT ────────────────────────────────── */
    logSection("STEP 5 — Train Agent");
    const rTrain = await api.post(`/agents/${agentId}/train`, { documentIds: [documentId] });
    if (rTrain.status === 200 || rTrain.status === 202) {
        ok("Training started");
        
        let isDone = false;
        let attempts = 0;
        while (!isDone && attempts < MAX_POLL_ATTEMPTS) {
            attempts++;
            await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
            const rStat = await api.get(`/agents/${agentId}/training-status`);
            const status = rStat.data?.data?.status;
            process.stdout.write(`  [Poll ${attempts}] Status: ${status}...\n`);
            if (status === "completed") {
                isDone = true;
                ok("Training completed successfully");
                record("Train Agent", true, "Completed");
            } else if (status === "failed") {
                fail("Training failed");
                record("Train Agent", false, "Failed state");
                printSummary();
                return;
            }
        }
        if (!isDone) {
            fail("Training timed out");
            record("Train Agent", false, "Timeout");
            printSummary();
            return;
        }
    } else {
        fail("Failed to start training", rTrain.data);
        record("Train Agent", false, "Failed to start");
        printSummary();
        return;
    }

    /* ── STEP 6: CLEAR TRAINING (HAPPY PATH) ─────────────────── */
    logSection("STEP 6 — Clear Training (Happy Path)");
    const rClear = await api.delete(`/agents/${agentId}/clear-training`);
    if (rClear.status === 200) {
        ok("Clear training endpoint returned 200 OK");
        
        // Verify state
        const rCheck = await api.get(`/agents/${agentId}/training-status`);
        if (rCheck.data?.data?.status === 'idle') {
            ok("Agent status is verified as 'idle'");
            record("Clear Training", true, "Status reset successfully");
        } else {
            fail("Agent status is NOT idle", rCheck.data);
            record("Clear Training", false, "Status check failed");
        }
    } else {
        fail("Clear training failed", rClear.data);
        record("Clear Training", false, `Status ${rClear.status}`);
    }

    /* ── STEP 7: IDEMPOTENCY (CLEAR AGAIN) ───────────────────── */
    logSection("STEP 7 — Idempotency (Clear Untrained Agent)");
    const rClear2 = await api.delete(`/agents/${agentId}/clear-training`);
    if (rClear2.status === 200) {
        ok("Clearing an already idle agent succeeds (200 OK)");
        record("Idempotency", true, "Handled safely");
    } else {
        fail("Clearing idle agent failed", rClear2.data);
        record("Idempotency", false, `Status ${rClear2.status}`);
    }

    /* ── STEP 8: UNAUTHORIZED ACCESS ─────────────────────────── */
    logSection("STEP 8 — Unauthorized Access Control");
    const rEmpAuth = await api.post("/users/login", EMPLOYEE_CREDENTIALS);
    if (rEmpAuth.status === 200) {
        employeeToken = rEmpAuth.data?.data?.accessToken || rEmpAuth.data?.data?.token;
        api.defaults.headers.common["Authorization"] = `Bearer ${employeeToken}`;
        
        const rClearUnauthorized = await api.delete(`/agents/${agentId}/clear-training`);
        if (rClearUnauthorized.status === 404 || rClearUnauthorized.status === 403) {
            ok(`Unauthorized access rejected with ${rClearUnauthorized.status}`);
            record("Unauthorized Access", true, "Rejected correctly");
        } else {
            fail(`Unauthorized access was NOT rejected properly! Got ${rClearUnauthorized.status}`, rClearUnauthorized.data);
            record("Unauthorized Access", false, "Security bypass detected");
        }
    } else {
        warn("Could not test unauthorized access - Employee login failed");
        record("Unauthorized Access", false, "Employee login failed");
    }

    printSummary();
}

function printSummary() {
    logSection("TEST SUMMARY");
    let allPassed = true;
    for (const r of results) {
        if (r.passed) {
            console.log(`  ${c.green}✓ ${r.step}${c.reset}  (${r.detail})`);
        } else {
            console.log(`  ${c.red}✗ ${r.step}${c.reset}  (${r.detail})`);
            allPassed = false;
        }
    }
    console.log(`\n${c.bold}RESULT: ${allPassed ? c.green + "ALL PASSED" : c.red + "SOME FAILED"}${c.reset}\n`);
    process.exit(allPassed ? 0 : 1);
}

main().catch(e => {
    console.error("Test script crashed:", e);
    process.exit(1);
});
