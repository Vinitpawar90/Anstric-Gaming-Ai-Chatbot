/**
 * Reset Agent Training Script
 *
 * Resets a stuck/failed agent back to clean "idle" state for retraining.
 * Steps:
 *   1. Inspect current DB state (agent + sources)
 *   2. Delete all vectors from Pinecone namespace
 *   3. Reset sources → status='pending', is_embedded=false
 *   4. Reset agent → training_status='idle', progress=0
 *
 * Usage:
 *   npx tsx scripts/reset-agent-training.ts --agentId=<ID> [--dry-run]
 */

import dotenv from 'dotenv';
dotenv.config();

import DB from '../database/index.schema';
import { Pinecone } from '@pinecone-database/pinecone';

// ─── CLI Args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const agentIdArg = args.find(a => a.startsWith('--agentId='));
const dryRun = args.includes('--dry-run');

if (!agentIdArg) {
    console.error('❌  Usage: npx tsx scripts/reset-agent-training.ts --agentId=<ID> [--dry-run]');
    process.exit(1);
}

const AGENT_ID = parseInt(agentIdArg.split('=')[1]);
if (isNaN(AGENT_ID)) {
    console.error('❌  --agentId must be a valid integer');
    process.exit(1);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const log = (msg: string) => console.log(msg);
const section = (title: string) => {
    console.log('\n' + '─'.repeat(60));
    console.log(`  ${title}`);
    console.log('─'.repeat(60));
};

// ─── Step 1: Inspect DB ───────────────────────────────────────────────────────

async function inspectAgent(agentId: number) {
    section('📋  CURRENT DB STATE');

    const agent = await DB('agents').where({ id: agentId, is_deleted: false }).first();
    if (!agent) {
        console.error(`❌  No agent found with id=${agentId}`);
        process.exit(1);
    }

    log(`\n👤  Agent:`);
    log(`    ID              : ${agent.id}`);
    log(`    Name            : ${agent.name}`);
    log(`    Owner (user_id) : ${agent.user_id}`);
    log(`    Training Status : ${agent.training_status}`);
    log(`    Training Progress: ${agent.training_progress}%`);
    log(`    Training Error  : ${agent.training_error || 'none'}`);
    log(`    Embedded Sources: ${agent.embedded_sources_count} / ${agent.total_sources_count}`);
    log(`    Trained On      : ${agent.trained_on}`);

    const sources = await DB('sources')
        .where({ agent_id: agentId, is_deleted: false })
        .select('id', 'name', 'source_type', 'status', 'is_embedded');

    log(`\n📂  Sources (${sources.length} total):`);
    if (sources.length === 0) {
        log('    (no sources)');
    } else {
        const pad = (s: any, n: number) => String(s).padEnd(n);
        log(`    ${pad('ID', 6)} ${pad('Type', 10)} ${pad('Status', 12)} ${pad('Embedded', 10)} Name`);
        log(`    ${'-'.repeat(65)}`);
        for (const s of sources) {
            log(`    ${pad(s.id, 6)} ${pad(s.source_type, 10)} ${pad(s.status, 12)} ${pad(s.is_embedded, 10)} ${s.name}`);
        }
    }

    return { agent, sources };
}

// ─── Step 2: Delete Pinecone Vectors ─────────────────────────────────────────

async function deletePineconeNamespace(userId: number, agentId: number) {
    section('🗑️   DELETING PINECONE VECTORS');

    const apiKey = process.env.PINECONE_API_KEY;
    const indexName = process.env.PINECONE_INDEX_NAME || 'cbrain';
    const namespace = `user_${userId}_agent_${agentId}`;

    if (!apiKey) { log('⚠️   No PINECONE_API_KEY — skipping'); return; }

    log(`    Index     : ${indexName}`);
    log(`    Namespace : ${namespace}`);

    try {
        const pinecone = new Pinecone({ apiKey });
        const index = pinecone.index(indexName);
        const stats = await index.describeIndexStats();
        const count = stats.namespaces?.[namespace]?.recordCount ?? 0;
        log(`    Vectors   : ${count}`);

        if (count === 0) { log('    ℹ️   Already empty'); return; }

        if (dryRun) { log(`    [DRY RUN] Would delete ${count} vectors`); return; }

        await index.namespace(namespace).deleteAll();
        log(`    ✅  Deleted ${count} vectors`);

        await new Promise(r => setTimeout(r, 1500));
        const afterCount = (await index.describeIndexStats()).namespaces?.[namespace]?.recordCount ?? 0;
        log(`    ✅  Verified: ${afterCount} remaining`);
    } catch (err: any) {
        log(`    ⚠️   Pinecone error: ${err.message} — continuing`);
    }
}

// ─── Step 3 & 4: Reset DB ────────────────────────────────────────────────────

async function resetDatabase(agentId: number) {
    section('🔄  RESETTING DATABASE');

    if (dryRun) {
        log('    [DRY RUN] Would reset sources and agent to idle');
        return;
    }

    const updatedSources = await DB('sources')
        .where({ agent_id: agentId, is_deleted: false })
        .update({ status: 'pending', is_embedded: false, updated_at: new Date() });
    log(`    ✅  Reset ${updatedSources} sources → pending / not embedded`);

    await DB('agents')
        .where({ id: agentId })
        .update({
            training_status: 'idle',
            training_progress: 0,
            training_error: null,
            embedded_sources_count: 0,
            updated_at: new Date(),
        });
    log('    ✅  Agent reset → idle, progress=0');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('\n' + '═'.repeat(60));
    console.log('  🔧  AGENT TRAINING RESET TOOL');
    console.log(`  Agent ID : ${AGENT_ID}`);
    console.log(`  Mode     : ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (changes will be applied)'}`);
    console.log('═'.repeat(60));

    try {
        const { agent } = await inspectAgent(AGENT_ID);
        await deletePineconeNamespace(agent.user_id, AGENT_ID);
        await resetDatabase(AGENT_ID);

        section('✅  RESET COMPLETE');
        if (dryRun) {
            log('    No changes made. Run without --dry-run to apply.');
        } else {
            log('    Agent is ready for a fresh training run.');
            log(`\n    Go to Admin → Agents → "${agent.name}" → Click Train`);
        }
        process.exit(0);
    } catch (err: any) {
        console.error('\n❌  Fatal error:', err.message || err);
        process.exit(1);
    }
}

main();
