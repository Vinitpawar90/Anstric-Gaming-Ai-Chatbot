import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import VectorSearchService from '../src/features/vector/services/vector-search.service';

const FILE_PATH = path.join(__dirname, '..', '..', 'Anstric QNA.txt');

// Config
const USER_ID = 1;
const DEFAULT_AGENT_ID = 2; // Hardcoded fallback

function parseQnAFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const pairs: { question: string; answer: string }[] = [];
    let currentQ = '';
    let currentA = '';
    
    for (const line of lines) {
        if (line.startsWith('Q') && line.includes(':')) {
            if (currentQ && currentA) {
                pairs.push({ question: currentQ, answer: currentA });
            }
            // Extract everything after the first colon
            const firstColon = line.indexOf(':');
            currentQ = line.substring(firstColon + 1).trim();
            currentA = '';
        } else if (line.startsWith('A') && line.includes(':') && currentA === '') {
            const firstColon = line.indexOf(':');
            currentA = line.substring(firstColon + 1).trim();
        } else if (line.trim() !== '') {
            if (currentA !== '') {
                currentA += ' ' + line.trim();
            } else if (currentQ !== '' && currentA === '') {
                // Multi-line question? Rare in this dataset, but just in case
                currentQ += ' ' + line.trim();
            }
        }
    }
    
    // push the last one
    if (currentQ && currentA) {
        pairs.push({ question: currentQ, answer: currentA });
    }
    
    return pairs;
}

function normalizeText(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function main() {
    console.log("🚀 Starting RAG Retrieval Test...");
    
    // Parse
    console.log(`📄 Parsing questions from ${FILE_PATH}...`);
    const qnaPairs = parseQnAFile(FILE_PATH);
    console.log(`✅ Parsed ${qnaPairs.length} Q&A pairs.`);

    if (qnaPairs.length === 0) {
        console.error("❌ No Q&A pairs found.");
        process.exit(1);
    }

    const vectorSearch = new VectorSearchService();
    const agentId = DEFAULT_AGENT_ID; 
    console.log(`🔍 Testing against Agent ID: ${agentId} (User ID: ${USER_ID})`);

    let passed = 0;
    let failed = 0;
    
    console.log("\n=======================================================");
    console.log("             RUNNING RETRIEVAL EVALUATION                ");
    console.log("=======================================================\n");

    for (let i = 0; i < qnaPairs.length; i++) {
        const { question, answer } = qnaPairs[i];
        
        try {
            const results = await vectorSearch.searchSimilar(question, USER_ID, agentId, {
                topK: 5,
                includeMetadata: true
            });
            
            const normalizedExpectedAnswer = normalizeText(answer);
            
            let isHit = false;
            let hitText = "";
            let hitScore = 0;

            for (const res of results) {
                const retrievedText = normalizeText(res.text);
                
                // Fuzzy match: We check if the retrieved chunk contains at least 50% of the words of the answer, 
                // OR if the retrieved chunk contains the first 50 chars of the answer.
                const expectedSnippet = normalizeText(answer.substring(0, Math.min(answer.length, 50)));
                
                if (retrievedText.includes(expectedSnippet) || retrievedText.includes(normalizedExpectedAnswer)) {
                    isHit = true;
                    hitText = res.text;
                    hitScore = res.score;
                    break;
                }
            }
            
            if (isHit) {
                passed++;
                process.stdout.write('✅');
            } else {
                failed++;
                process.stdout.write('❌');
                console.log(`\n\n❌ FAILED Q${i+1}: ${question}`);
                console.log(`Expected Answer Snippet: ${answer.substring(0, 100)}...`);
                console.log(`Top Retrieved Chunk (Score: ${results[0]?.score}):\n${results[0]?.text || 'None'}\n`);
            }
            
        } catch (error: any) {
            console.error(`\n❌ Error querying Q${i+1} (${question}):`, error.message);
            failed++;
        }
        
        // Small delay to avoid rate limiting from embedding API
        await new Promise(r => setTimeout(r, 200));
    }

    console.log("\n\n=======================================================");
    console.log("                   TEST RESULTS                          ");
    console.log("=======================================================");
    console.log(`Total Queries: ${qnaPairs.length}`);
    console.log(`Passed:        ${passed}`);
    console.log(`Failed:        ${failed}`);
    console.log(`Hit Rate:      ${((passed / qnaPairs.length) * 100).toFixed(2)}%`);
    console.log("=======================================================\n");

    if (failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

main().catch(console.error);
