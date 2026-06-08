import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://yujing:yujing_dev@localhost:5432/yujing',
  volcengine: {
    apiKey: process.env.VOLCENGINE_API_KEY || '',
    model: process.env.VOLCENGINE_MODEL || 'doubao-pro-32k',
    baseUrl: process.env.VOLCENGINE_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
  },
  wechat: {
    appId: process.env.WECHAT_APPID || '',
    secret: process.env.WECHAT_SECRET || '',
  },
  adminApiKey: process.env.ADMIN_API_KEY || 'dev-admin-key',
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret',
  confidenceThreshold: 0.85,
  lockTimeoutMs: 90_000,
};

export function assertLlmConfigured() {
  if (!config.volcengine.apiKey) {
    throw new Error('VOLCENGINE_API_KEY is not configured');
  }
}
