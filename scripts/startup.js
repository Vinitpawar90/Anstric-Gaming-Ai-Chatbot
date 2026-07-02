const fs = require('fs');
const path = require('path');
const { spawnSync, spawn, execSync } = require('child_process');
const http = require('http');

function killProcessOnPort(port) {
    try {
        const pid = execSync(`lsof -t -i:${port}`).toString().trim();
        if (pid) {
            console.log(`  ➤ Port ${port} is occupied by PID ${pid}. Killing it to start fresh...`);
            // Split PIDs by newline in case there are multiple and kill each
            const pids = pid.split('\n');
            for (const p of pids) {
                if (p.trim()) {
                    execSync(`kill -9 ${p.trim()}`);
                }
            }
        }
    } catch (e) {
        // Safe to ignore if port is not in use or lsof fails
    }
}

const backendDir = path.join(__dirname, '..', 'backend');
const frontendDir = path.join(__dirname, '..', 'frontend');

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

    // 1. Check Env
    console.log(`\n\x1b[1m\x1b[34m[1/4] Checking Environment Variables...\x1b[0m`);
    const bEnv = path.join(backendDir, '.env');
    const bEnvExample = path.join(backendDir, '.env.example');
    if (!fs.existsSync(bEnv) && fs.existsSync(bEnvExample)) {
        console.log(`  ➤ Creating backend/.env`);
        fs.copyFileSync(bEnvExample, bEnv);
    } else {
        console.log(`  ✓ backend/.env exists`);
    }

    const fEnv = path.join(frontendDir, '.env');
    const fEnvExample = path.join(frontendDir, '.env.example');
    if (!fs.existsSync(fEnv) && fs.existsSync(fEnvExample)) {
        console.log(`  ➤ Creating frontend/.env`);
        fs.copyFileSync(fEnvExample, fEnv);
    } else {
        console.log(`  ✓ frontend/.env exists`);
    }

    // 2. Check Dependencies
    console.log(`\n\x1b[1m\x1b[34m[2/4] Checking Node Modules...\x1b[0m`);
    if (!fs.existsSync(path.join(backendDir, 'node_modules'))) {
        console.log(`  ➤ Missing backend node_modules. Installing...`);
        runCmd('npm', ['install'], backendDir);
    } else {
        console.log(`  ✓ backend/node_modules exists`);
    }

    if (!fs.existsSync(path.join(frontendDir, 'node_modules'))) {
        console.log(`  ➤ Missing frontend node_modules. Installing...`);
        runCmd('npm', ['install'], frontendDir);
    } else {
        console.log(`  ✓ frontend/node_modules exists`);
    }

    // 3. Start Backend Server
    console.log(`\n\x1b[1m\x1b[34m[3/4] Starting Backend Server...\x1b[0m`);
    const backendProcess = spawn('npm', ['run', 'dev'], { cwd: backendDir, shell: true, stdio: 'inherit' });

    // Ensure backend dies if we exit
    process.on('SIGINT', () => {
        backendProcess.kill('SIGINT');
        process.exit();
    });
    process.on('exit', () => {
        backendProcess.kill();
    });

    const ready = await waitForServer();
    if (!ready) {
        console.error(`\x1b[31m❌ Backend server failed to start within 30 seconds.\x1b[0m`);
        backendProcess.kill();
        process.exit(1);
    }
    console.log(`  ✓ Backend server is ready.`);

    // 4. Check Database & Setup
    console.log(`\n\x1b[1m\x1b[34m[4/4] Checking Database...\x1b[0m`);
    const dbPath = path.join(backendDir, 'data', 'local.db');
    const dbExists = fs.existsSync(dbPath);
    const dbSize = dbExists ? fs.statSync(dbPath).size : 0;
    if (!dbExists || dbSize === 0) {
        console.log(`  ➤ Database missing or empty. Initializing...`);
        runCmd('npx', ['ts-node', 'database/migrate.schema.ts'], backendDir);
        runCmd('npm', ['run', 'create-admin'], backendDir);
        
        // Backend is already running, so demo:setup will work
        console.log(`\n\x1b[36m➤ Running: npm run demo:setup\x1b[0m`);
        const demoResult = spawnSync('npm', ['run', 'demo:setup'], { cwd: backendDir, shell: true, stdio: 'inherit' });
        if (demoResult.error || demoResult.status !== 0) {
            console.error(`\x1b[31m❌ Demo Setup failed.\x1b[0m`);
            backendProcess.kill();
            process.exit(1);
        }
        console.log(`  ✓ Database initialized successfully`);
    } else {
        console.log(`  ✓ Database already exists with data. Skipping initialization.`);
    }

    // Start Frontend Server
    console.log(`\n\x1b[1m\x1b[34mStarting Frontend Server...\x1b[0m`);
    console.log(`\x1b[32m  Frontend will be available at: http://localhost:8080\x1b[0m`);
    console.log(`\x1b[32m  Backend API available at: http://localhost:8000/api/v1\x1b[0m`);
    console.log(`\n\x1b[33mPress Ctrl+C to stop both servers.\x1b[0m\n`);
    
    const frontendProcess = spawn('npm', ['run', 'dev'], { cwd: frontendDir, shell: true, stdio: 'inherit' });
    
    process.on('SIGINT', () => {
        frontendProcess.kill('SIGINT');
    });
    process.on('exit', () => {
        frontendProcess.kill();
    });
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
