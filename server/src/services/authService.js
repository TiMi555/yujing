import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { query } from '../db/pool.js';

export async function wechatLogin(code) {
  if (!config.wechat.appId || !config.wechat.secret) {
    // Dev fallback when WeChat not configured
    const openid = `dev_${code || 'anonymous'}`;
    const user = await upsertUser(openid);
    return { user, token: signToken(user) };
  }

  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${config.wechat.appId}&secret=${config.wechat.secret}&js_code=${code}&grant_type=authorization_code`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.openid) {
    throw new Error(data.errmsg || 'WeChat login failed');
  }
  const user = await upsertUser(data.openid);
  return { user, token: signToken(user) };
}

async function upsertUser(openid) {
  const { rows } = await query(
    `INSERT INTO users (openid) VALUES ($1)
     ON CONFLICT (openid) DO UPDATE SET openid = EXCLUDED.openid
     RETURNING *`,
    [openid],
  );
  return rows[0];
}

function signToken(user) {
  return jwt.sign({ sub: user.id, openid: user.openid }, config.jwtSecret, {
    expiresIn: '30d',
  });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

export async function mergeDeviceUnlocks(userId, deviceId) {
  if (!deviceId) return;
  const deviceUnlocks = await query(
    `SELECT story_id FROM user_unlocks WHERE device_id = $1 AND user_id IS NULL`,
    [deviceId],
  );
  for (const row of deviceUnlocks.rows) {
    const exists = await query(
      `SELECT 1 FROM user_unlocks WHERE user_id = $1 AND story_id = $2`,
      [userId, row.story_id],
    );
    if (exists.rows.length === 0) {
      await query(
        `UPDATE user_unlocks SET user_id = $1, device_id = NULL
         WHERE device_id = $2 AND story_id = $3 AND user_id IS NULL`,
        [userId, deviceId, row.story_id],
      );
    } else {
      await query(`DELETE FROM user_unlocks WHERE device_id = $1 AND story_id = $2`, [
        deviceId,
        row.story_id,
      ]);
    }
  }
}

export async function getLibrary(userId) {
  const { rows } = await query(
    `SELECT s.*, u.unlocked_at
     FROM user_unlocks u
     JOIN stories s ON s.id = u.story_id
     WHERE u.user_id = $1
     ORDER BY s.category, u.unlocked_at DESC`,
    [userId],
  );

  const grouped = {};
  for (const row of rows) {
    if (!grouped[row.category]) grouped[row.category] = [];
    grouped[row.category].push(row);
  }
  return grouped;
}
