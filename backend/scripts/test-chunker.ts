import fs from 'fs';
import path from 'path';
import { SemanticChunkerService } from '../src/features/vector/services/semantic-chunker.service';
import { vectorConfig } from '../src/config/vector.config';

async function main() {
    const filePath = path.join(__dirname, '..', '..', 'Anstric QNA.txt');
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const chunker = new SemanticChunkerService();
    const result = await chunker.chunkText(content, vectorConfig.chunking, 1, 'test', 'test');
    
    console.log(`Total chunks generated: ${result.chunks.length}`);
    
    let foundQ91 = false;
    for (let i = 0; i < result.chunks.length; i++) {
        if (result.chunks[i].includes('long-term goal')) {
            console.log(`\nFound in chunk ${i}:\n`);
            console.log(result.chunks[i]);
            foundQ91 = true;
        }
    }
    
    if (!foundQ91) {
        console.error('\n❌ Q91 ("long-term goal") was NOT found in any chunk!');
    } else {
        console.log('\n✅ Q91 is correctly chunked.');
    }
}

main().catch(console.error);
