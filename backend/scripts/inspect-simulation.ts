import fs from 'fs';
import path from 'path';

const maxChunkSize = 1000;
const minChunkSize = 300;
const maxChunkSizeMultiplier = 1.5;

function splitIntoSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => s + '.');
}

function finalizeChunk(chunk: string): string[] {
  if (chunk.length <= maxChunkSize) {
    return [chunk];
  }

  const sentences = splitIntoSentences(chunk);
  const result: string[] = [];
  let currentPart = '';

  for (const sentence of sentences) {
    const potentialPart = currentPart + (currentPart ? ' ' : '') + sentence;

    if (potentialPart.length > maxChunkSize && currentPart.length >= minChunkSize) {
      result.push(currentPart.trim());
      currentPart = sentence;
    } else {
      currentPart = potentialPart;
    }
  }

  if (currentPart.trim()) {
    result.push(currentPart.trim());
  }

  return result.filter(part => part.length >= minChunkSize);
}

function intelligentChunking(text: string): string[] {
  const chunks: string[] = [];
  const lines = text.split('\n');
  let currentChunk = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    const isMajorBreak = line.match(/^#{1,2}\s+/) || 
                         (line.length > 5 && line === line.toUpperCase() && line.match(/^[A-Z\s]+$/)) ||
                         line.match(/^\d+\.\s+[A-Z]/) ||
                         line.match(/^=+$/) || line.match(/^-+$/);

    if (isMajorBreak) {
      if (currentChunk.trim()) {
        chunks.push(...finalizeChunk(currentChunk.trim()));
        currentChunk = '';
      }
      currentChunk = line + '\n';
      continue;
    }

    currentChunk += line + '\n';

    if (currentChunk.length > maxChunkSize * maxChunkSizeMultiplier) {
      chunks.push(...finalizeChunk(currentChunk.trim()));
      currentChunk = '';
    }
  }

  if (currentChunk.trim()) {
    chunks.push(...finalizeChunk(currentChunk.trim()));
  }

  return chunks;
}

function main() {
  const filePath = path.join(__dirname, '..', '..', 'Anstric QNA.txt');
  const text = fs.readFileSync(filePath, 'utf-8');
  const chunks = intelligentChunking(text);
  
  for (let i = 0; i < Math.min(3, chunks.length); i++) {
    console.log(`=== CHUNK ${i} ===`);
    console.log(chunks[i]);
    console.log("=================\n");
  }
}

main();
