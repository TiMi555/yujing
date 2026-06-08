import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../db/pool.js';
import { config } from '../config.js';
import { llm } from '../llm/volcengine.js';
import {
  NORMALIZE_SYSTEM,
  normalizeUserPrompt,
} from '../prompts/templates.js';
import { parseLLMJson } from '../utils/helpers.js';
import { validateNormalizeResult } from '../validators/storySchema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const synonyms = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../data/synonyms.json'), 'utf8'),
);

function normalizeText(text) {
  return text.trim().toLowerCase().replace(/\s+/g, '');
}

export function matchSynonym(input) {
  const norm = normalizeText(input);
  for (const entry of synonyms) {
    for (const alias of entry.aliases) {
      if (normalizeText(alias) === norm) {
        return {
          concept_key: entry.concept_key,
          canonical_name: entry.canonical_name,
          category: entry.category || guessCategory(entry.concept_key),
          confidence: 0.95,
        };
      }
    }
  }
  return null;
}

function guessCategory(conceptKey) {
  const map = {
    prisoners_dilemma: '经济学',
    diminishing_marginal_returns: '经济学',
    matthew_effect: '社会学',
    vanishing_gradient: '计算机科学',
  };
  return map[conceptKey] || '跨学科';
}

export async function normalizeConcept(rawQuery) {
  const local = matchSynonym(rawQuery);
  if (local) {
    await upsertConceptKey(local);
    return {
      ...local,
      need_confirm: local.confidence < config.confidenceThreshold,
    };
  }

  const content = await llm.chatComplete({
    messages: [
      { role: 'system', content: NORMALIZE_SYSTEM },
      { role: 'user', content: normalizeUserPrompt(rawQuery) },
    ],
  });

  const parsed = validateNormalizeResult(parseLLMJson(content));
  await upsertConceptKey(parsed);
  return {
    ...parsed,
    need_confirm: parsed.confidence < config.confidenceThreshold,
  };
}

async function upsertConceptKey({ concept_key, canonical_name, category }) {
  await query(
    `INSERT INTO concept_keys (key, canonical_name, category)
     VALUES ($1, $2, $3)
     ON CONFLICT (key) DO UPDATE SET canonical_name = EXCLUDED.canonical_name, category = EXCLUDED.category`,
    [concept_key, canonical_name, category],
  );
}
