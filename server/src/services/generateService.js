import { llm } from '../llm/volcengine.js';
import {
  GENERATE_STORY_SYSTEM,
  generateStoryUserPrompt,
} from '../prompts/templates.js';
import { JsonStreamParser } from '../stream/JsonStreamParser.js';
import { parseLLMJson } from '../utils/helpers.js';
import { validateStoryJson } from '../validators/storySchema.js';
import {
  acquireGenerationLock,
  releaseGenerationLock,
  getActiveStory,
  isLocked,
  insertStory,
  logGenerationFailure,
} from './storyService.js';

export async function generateStoryStream(concept, send) {
  const { concept_key, canonical_name, category } = concept;

  const cached = await getActiveStory(concept_key);
  if (cached) {
    send({ type: 'complete', story: cached, from_cache: true });
    return;
  }

  if (await isLocked(concept_key)) {
    send({ type: 'locked' });
    return;
  }

  const acquired = await acquireGenerationLock(concept_key);
  if (!acquired) {
    send({ type: 'locked' });
    return;
  }

  const parser = new JsonStreamParser();
  let rawBuffer = '';

  try {
    for await (const delta of llm.chatStream({
      messages: [
        { role: 'system', content: GENERATE_STORY_SYSTEM },
        {
          role: 'user',
          content: generateStoryUserPrompt({ concept_key, canonical_name, category }),
        },
      ],
    })) {
      rawBuffer += delta;
      const storyDelta = parser.push(delta);
      if (storyDelta) {
        send({ type: 'chunk', field: 'story_content', delta: storyDelta });
      }
    }

    const storyJson = validateStoryJson(parseLLMJson(rawBuffer));
    const story = await insertStory(concept_key, storyJson);
    send({ type: 'complete', story, from_cache: false });
  } catch (err) {
    await logGenerationFailure({
      conceptKey: concept_key,
      rawInput: canonical_name,
      errorMessage: err.message,
      rawLlmOutput: rawBuffer,
    });
    send({ type: 'error', message: err.message });
  } finally {
    await releaseGenerationLock(concept_key);
  }
}

export async function generateStorySync(concept) {
  const content = await llm.chatComplete({
    messages: [
      { role: 'system', content: GENERATE_STORY_SYSTEM },
      {
        role: 'user',
        content: generateStoryUserPrompt(concept),
      },
    ],
  });
  return validateStoryJson(parseLLMJson(content));
}
