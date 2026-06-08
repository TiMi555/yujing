import { BASE_URL } from '../config.js';
import { getToken } from '../utils/auth.js';

export function sseGenerate(body, { onEvent, onError, onComplete }) {
  let buffer = '';
  const requestTask = uni.request({
    url: BASE_URL + '/api/stories/generate',
    method: 'POST',
    data: body,
    enableChunked: true,
    responseType: 'text',
    header: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      Authorization: getToken() ? `Bearer ${getToken()}` : '',
    },
    success: () => onComplete?.(),
    fail: (err) => onError?.(err),
  });

  requestTask.onChunkReceived((res) => {
    const chunk = typeof res.data === 'string'
      ? res.data
      : String.fromCharCode.apply(null, new Uint8Array(res.data));
    buffer += chunk;
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';
    for (const part of parts) {
      const line = part.split('\n').find((l) => l.startsWith('data:'));
      if (!line) continue;
      const payload = line.slice(5).trim();
      if (payload === '[DONE]') {
        onComplete?.();
        return;
      }
      try {
        onEvent?.(JSON.parse(payload));
      } catch {
        // ignore
      }
    }
  });

  return requestTask;
}
