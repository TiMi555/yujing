import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true });

const normalizeSchema = {
  type: 'object',
  required: ['concept_key', 'canonical_name', 'category', 'confidence'],
  properties: {
    concept_key: { type: 'string', minLength: 1, maxLength: 128 },
    canonical_name: { type: 'string', minLength: 1 },
    category: { type: 'string', minLength: 1 },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
  additionalProperties: false,
};

const storySchema = {
  type: 'object',
  required: [
    'title',
    'category',
    'concept_name',
    'story_content',
    'academic_definition',
    'metaphor_mappings',
  ],
  properties: {
    title: { type: 'string', minLength: 1 },
    category: { type: 'string', minLength: 1 },
    concept_name: { type: 'string', minLength: 1 },
    story_content: { type: 'string', minLength: 200 },
    academic_definition: { type: 'string', minLength: 20 },
    metaphor_mappings: {
      type: 'array',
      minItems: 3,
      items: {
        type: 'object',
        required: ['story_element', 'concept_element', 'explanation'],
        properties: {
          story_element: { type: 'string' },
          concept_element: { type: 'string' },
          explanation: { type: 'string' },
        },
      },
    },
  },
  additionalProperties: false,
};

const validateNormalize = ajv.compile(normalizeSchema);
const validateStory = ajv.compile(storySchema);

export function validateNormalizeResult(obj) {
  if (!validateNormalize(obj)) {
    throw new Error(`Invalid normalize JSON: ${ajv.errorsText(validateNormalize.errors)}`);
  }
  return obj;
}

export function validateStoryJson(obj) {
  if (!validateStory(obj)) {
    throw new Error(`Invalid story JSON: ${ajv.errorsText(validateStory.errors)}`);
  }
  if (obj.title.includes(obj.concept_name)) {
    throw new Error('Story title must not contain the concept name');
  }
  return obj;
}
