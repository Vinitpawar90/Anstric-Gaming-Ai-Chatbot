const fs = require('fs');
const path = require('path');
const { spawnSync, spawn, execSync } = require('child_process');
const http = require('http');

function killProcessOnPort(port) {
    try {
        const pid = execSync(`lsof -t -i:${port}`).toString().trim();
        if (pid) {
            console.log(`  ➤ Port ${port} is occupied by PID ${pid}. Killing it to reset port...`);
            const pids = pid.split('\n');
            for (const p of pids) {
                if (p.trim()) {
                    execSync(`kill -9 ${p.trim()}`);
                }
            }
        }
    } catch (e) {
        // Safe to ignore
    }
}

const backendDir = path.join(__dirname, '..', 'backend');
const frontendDir = path.join(__dirname, '..', 'frontend');

// Helper to run sync commands
function runCmd(cmd, args, cwd) {
    console.log(`\n\x1b[36m➤ Running: ${cmd} ${args.join(' ')}\x1b[0m`);
    const result = spawnSync(cmd, args, { cwd, shell: true, stdio: 'inherit' });
    if (result.error || result.status !== 0) {
        console.error(`\x1b[31m❌ Command failed: ${cmd} ${args.join(' ')}\x1b[0m`);
        process.exit(1);
    }
}

function checkHealth() {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:8000/health', (res) => {
            resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
    });
}

async function waitForServer() {
    console.log(`  ➤ Waiting for backend server to be ready on port 8000...`);
    for (let i = 0; i < 30; i++) {
        const isReady = await checkHealth();
        if (isReady) return true;
        await new Promise(r => setTimeout(r, 1000));
    }
    return false;
}

async function main() {
    console.log(`\n\x1b[1m\x1b[34m[0/4] Checking and Clearing Ports...\x1b[0m`);
    killProcessOnPort(8000);
    killProcessOnPort(8080);

    // 1. Install Dependencies
    console.log(`\n\x1b[1m\x1b[34m[1/4] Installing Node Modules...\x1b[0m`);
    runCmd('npm', ['install'], backendDir);
    runCmd('npm', ['install'], frontendDir);

    // 2. Database Reset & Seeding (Knex)
    console.log(`\n\x1b[1m\x1b[34m[2/4] Resetting Database & Seeding Data...\x1b[0m`);
    runCmd('npx', ['ts-node', 'database/migrate.schema.ts', '--drop'], backendDir);
    runCmd('npm', ['run', 'create-admin'], backendDir);

    // 3. Start Backend For Testing & Demo Setup
    console.log(`\n\x1b[1m\x1b[34m[3/4] Starting Backend Server...\x1b[0m`);
    const backendProcess = spawn('npm', ['run', 'dev'], { 
        cwd: backendDir, 
        shell: true,
        stdio: 'ignore' // hide server logs to keep test output clean
    });

    const ready = await waitForServer();
    if (!ready) {
        console.error(`\x1b[31m❌ Backend server failed to start within 30 seconds.\x1b[0m`);
        backendProcess.kill();
        process.exit(1);
    }

    console.log(`  ✓ Backend server is ready.`);

    // Now run demo setup since backend is up
    console.log(`\n\x1b[36m➤ Running: npm run demo:setup\x1b[0m`);
    const demoResult = spawnSync('npm', ['run', 'demo:setup'], { 
        cwd: backendDir, 
        shell: true, 
        stdio: 'inherit' 
    });

    if (demoResult.error || demoResult.status !== 0) {
        console.error(`\x1b[31m❌ Demo Setup failed.\x1b[0m`);
        backendProcess.kill();
        process.exit(1);
    }

    // 4. Run Tests
    console.log(`\n\x1b[1m\x1b[34m[4/4] Running End-to-End Tests...\x1b[0m`);
    console.log(`\n\x1b[36m➤ Running: npm run test:anstric-e2e\x1b[0m`);
    const testResult = spawnSync('npm', ['run', 'test:anstric-e2e'], { 
        cwd: backendDir, 
        shell: true, 
        stdio: 'inherit' 
    });

    // Cleanup
    backendProcess.kill('SIGTERM');

    if (testResult.error || testResult.status !== 0) {
        console.error(`\n\x1b[31m❌ Reset completed but tests FAILED.\x1b[0m`);
        process.exit(1);
    } else {
        console.log(`\n\x1b[32m🎉 Full reset successful! All tests passed.\x1b[0m`);
        console.log(`\x1b[32mRun \x1b[1mnpm start\x1b[0m \x1b[32mto launch the application.\x1b[0m\n`);
    }
}

main().catch(console.error);

// Ensure we don't leave zombie processes on crash
process.on('SIGINT', () => {
    process.exit();
});
