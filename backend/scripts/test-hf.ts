import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';

const TOKEN = process.env.HUGGINGFACE_TOKEN!;

async function tryUrl(url: string, body: any, label: string) {
    try {
        console.log(`\n🔍 [${label}]`);
        const res = await axios.post(url, body, {
            headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
            timeout: 60000,
        });
        const data = res.data;
        console.log(`   ✅ SUCCESS ${res.status} type=${typeof data} isArr=${Array.isArray(data)}`);
        if (Array.isArray(data) && data[0]) {
            const f = data[0];
            if (Array.isArray(f)) {
                if (Array.isArray(f[0])) console.log(`   Shape: [${data.length}][${f.length}][${f[0].length}]`);
                else console.log(`   Shape: [${data.length}][${f.length}] dims`);
            } else {
                console.log(`   data[0] type: ${typeof f}, val: ${JSON.stringify(f).slice(0, 100)}`);
            }
        }
        return true;
    } catch (err: any) {
        console.log(`   ❌ ${err?.response?.status}: ${JSON.stringify(err?.response?.data)?.slice(0, 200)}`);
        return false;
    }
}

async function main() {
    const BGEM3 = 'https://router.huggingface.co/hf-inference/models/BAAI/bge-m3';

    // sentence_pairs input - returns pair embeddings
    await tryUrl(BGEM3, {
        inputs: [['query: Hello world', 'passage: Hello world test']],
    }, 'bge-m3 sentence_pairs');

    // batched with sentence pairs
    await tryUrl(BGEM3, {
        inputs: { source_sentence: 'Hello world', sentences: ['Test sentence one', 'Test sentence two'] },
        options: { wait_for_model: true },
    }, 'bge-m3 source_sentence');

    // Try with payload format sentence-transformers expects
    await tryUrl('https://router.huggingface.co/hf-inference/models/intfloat/multilingual-e5-large', {
        inputs: ['Hello world', 'Another text here'],
        options: { wait_for_model: true },
    }, 'multilingual-e5-large array');

    // Try BAAI/bge-m3 with string (not array)
    await tryUrl('https://router.huggingface.co/hf-inference/models/BAAI/bge-large-en-v1.5', {
        inputs: ['Hello world', 'Another text'],
        options: { wait_for_model: true },
    }, 'bge-large-en-v1.5 array');

    process.exit(0);
}
main();
