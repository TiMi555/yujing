export const NORMALIZE_SYSTEM = `你是学术概念归一化引擎。将用户输入映射到标准学术概念。
只输出纯 JSON，不要 markdown，不要解释。
输出格式：
{"concept_key":"snake_case英文key","canonical_name":"标准中文概念名","category":"学科如经济学","confidence":0.0-1.0}
confidence 规则：输入明确匹配单一概念时 >=0.9；输入宽泛或多义时 <0.85。`;

export function normalizeUserPrompt(query) {
  return `用户输入：${query}\n请归一化为标准学术概念。`;
}

export const GENERATE_STORY_SYSTEM = `你是「寓境」寓言作家。将学术概念写成 600-800 字中文寓言故事。
要求：
1. title 是文学性伪托标题，绝对不含 concept_name 或学术术语
2. story_content 隐喻深刻、有文学性
3. metaphor_mappings 至少 3 条，严丝合缝对照 story 与 concept
4. 只输出纯 JSON，无 markdown 包裹

JSON Schema:
{"title":"...","category":"...","concept_name":"...","story_content":"...","academic_definition":"...","metaphor_mappings":[{"story_element":"...","concept_element":"...","explanation":"..."}]}`;

export function generateStoryUserPrompt({ canonical_name, concept_key, category }) {
  return `概念 key: ${concept_key}
标准名称: ${canonical_name}
学科: ${category}
请创作寓言 JSON。`;
}
