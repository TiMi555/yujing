export class StructuredError extends Error {
  constructor(message, status = 400, code = 'BAD_REQUEST') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function parseLLMJson(text) {
  if (!text || typeof text !== 'string') {
    throw new StructuredError('Empty LLM response', 502, 'LLM_EMPTY');
  }
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new StructuredError('LLM did not return valid JSON', 502, 'LLM_INVALID_JSON');
  }
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new StructuredError('Failed to parse LLM JSON', 502, 'LLM_PARSE_ERROR');
  }
}

export function calcReadingMinutes(content) {
  const charCount = [...(content || '')].length;
  return Math.max(1, Math.ceil(charCount / 300));
}

export function rowToStory(row, { includeConcept = false } = {}) {
  if (!row) return null;
  const base = {
    id: row.id,
    title: row.title,
    category: row.category,
    story_content: row.story_content,
    reading_minutes: row.reading_minutes,
    unlock_count: row.unlock_count,
    cover_image_url: row.cover_image_url,
    created_at: row.created_at,
    from_cache: true,
  };
  if (includeConcept) {
    return {
      ...base,
      concept_name: row.concept_name,
      academic_definition: row.academic_definition,
      metaphor_mappings: row.metaphor_mappings,
    };
  }
  return base;
}

export function feedRowToCard(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    reading_minutes: row.reading_minutes,
    unlock_count: row.unlock_count,
    cover_image_url: row.cover_image_url,
    created_at: row.created_at,
  };
}
