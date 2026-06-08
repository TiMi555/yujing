/**
 * Incrementally extract story_content string value from partial JSON during LLM streaming.
 */
export class JsonStreamParser {
  constructor() {
    this.buffer = '';
    this.emittedLength = 0;
    this.completed = false;
    this.parsed = null;
  }

  push(chunk) {
    this.buffer += chunk;
    return this.extractStoryDelta();
  }

  extractStoryDelta() {
    const keyIdx = this.buffer.indexOf('"story_content"');
    if (keyIdx === -1) return '';

    const colonIdx = this.buffer.indexOf(':', keyIdx);
    if (colonIdx === -1) return '';

    let i = colonIdx + 1;
    while (i < this.buffer.length && /\s/.test(this.buffer[i])) i += 1;
    if (this.buffer[i] !== '"') return '';

    i += 1;
    let content = '';
    let escaped = false;
    for (; i < this.buffer.length; i += 1) {
      const ch = this.buffer[i];
      if (escaped) {
        content += ch;
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        this.completed = true;
        break;
      }
      content += ch;
    }

    const delta = content.slice(this.emittedLength);
    this.emittedLength = content.length;
    return delta;
  }

  tryParseComplete(parseFn) {
    if (this.parsed) return this.parsed;
    try {
      this.parsed = parseFn(this.buffer);
      return this.parsed;
    } catch {
      return null;
    }
  }
}
