import dotenv from 'dotenv';
dotenv.config();

import VectorSearchService from '../src/features/vector/services/vector-search.service';

async function main() {
    const vectorSearch = new VectorSearchService();
    const USER_ID = 1;
    const AGENT_ID = 2;
    
    const query = "What is Anstric Games’ long-term goal?";
    console.log(`Query: ${query}`);
    
    const results = await vectorSearch.searchSimilar(query, USER_ID, AGENT_ID, {
        topK: 10,
        includeMetadata: true
    });
    
    console.log(`Found ${results.length} results:`);
    for (let i = 0; i < results.length; i++) {
        console.log(`\nRank ${i+1} (Score: ${results[i].score}):`);
        console.log(results[i].text);
    }
}

main().catch(console.error);
