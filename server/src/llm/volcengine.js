import { config } from '../config.js';

export class VolcengineProvider {
  constructor(options = {}) {
    this.apiKey = options.apiKey || config.volcengine.apiKey;
    this.model = options.model || config.volcengine.model;
    this.baseUrl = (options.baseUrl || config.volcengine.baseUrl).replace(/\/$/, '');
  }

  async chatComplete({ messages, temperature = 0.3 }) {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature,
        stream: false,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Volcengine API error ${res.status}: ${text}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async *chatStream({ messages, temperature = 0.7 }) {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature,
        stream: true,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Volcengine API error ${res.status}: ${text}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') return;
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // skip malformed SSE chunks
        }
      }
    }
  }
}

export const llm = new VolcengineProvider();
