import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeConcept } from '../src/services/conceptService.js';
import { generateStorySync } from '../src/services/generateService.js';
import { insertStory, releaseGenerationLock } from '../src/services/storyService.js';
import { pool } from '../src/db/pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function seed() {
  const file = process.argv[2] || path.join(__dirname, 'concepts.json');
  const concepts = JSON.parse(fs.readFileSync(file, 'utf8'));

  for (const item of concepts) {
    console.log(`Seeding: ${item.query}`);
    try {
      const normalized = await normalizeConcept(item.query);
      const json = await generateStorySync(normalized);
      await insertStory(normalized.concept_key, json);
      console.log(`  ✓ ${normalized.concept_key}`);
    } catch (err) {
      console.error(`  ✗ ${item.query}:`, err.message);
      await releaseGenerationLock(item.query).catch(() => {});
    }
  }
  await pool.end();
}

seed();
