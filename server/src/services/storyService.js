import { query } from '../db/pool.js';
import { config } from '../config.js';

export async function expireStaleLocks() {
  await query(`DELETE FROM generation_locks WHERE expires_at < NOW()`);
}

export async function getActiveStory(conceptKey) {
  await expireStaleLocks();
  const { rows } = await query(
    `SELECT * FROM stories WHERE concept_key = $1 AND is_active = true LIMIT 1`,
    [conceptKey],
  );
  return rows[0] || null;
}

export async function isLocked(conceptKey) {
  await expireStaleLocks();
  const { rows } = await query(
    `SELECT 1 FROM generation_locks WHERE concept_key = $1 AND expires_at > NOW()`,
    [conceptKey],
  );
  return rows.length > 0;
}

export async function acquireGenerationLock(conceptKey) {
  await expireStaleLocks();
  const expiresAt = new Date(Date.now() + config.lockTimeoutMs);
  try {
    await query(
      `INSERT INTO generation_locks (concept_key, status, started_at, expires_at)
       VALUES ($1, 'generating', NOW(), $2)`,
      [conceptKey, expiresAt],
    );
    return true;
  } catch (err) {
    if (err.code === '23505') return false;
    throw err;
  }
}

export async function releaseGenerationLock(conceptKey) {
  await query(`DELETE FROM generation_locks WHERE concept_key = $1`, [conceptKey]);
}

export async function logGenerationFailure({ conceptKey, rawInput, errorMessage, rawLlmOutput }) {
  await query(
    `INSERT INTO generation_failures (concept_key, raw_input, error_message, raw_llm_output)
     VALUES ($1, $2, $3, $4)`,
    [conceptKey, rawInput, errorMessage, rawLlmOutput || null],
  );
}

export async function getStoryById(id) {
  const { rows } = await query(`SELECT * FROM stories WHERE id = $1`, [id]);
  return rows[0] || null;
}

export async function insertStory(conceptKey, storyJson) {
  const { calcReadingMinutes } = await import('../utils/helpers.js');
  const readingMinutes = calcReadingMinutes(storyJson.story_content);

  const { rows: versionRows } = await query(
    `SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM stories WHERE concept_key = $1`,
    [conceptKey],
  );
  const version = versionRows[0].next_version;

  await query(`UPDATE stories SET is_active = false WHERE concept_key = $1 AND is_active = true`, [
    conceptKey,
  ]);

  const { rows } = await query(
    `INSERT INTO stories (
      concept_key, version, is_active, title, category, concept_name,
      story_content, academic_definition, metaphor_mappings, reading_minutes
    ) VALUES ($1,$2,true,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *`,
    [
      conceptKey,
      version,
      storyJson.title,
      storyJson.category,
      storyJson.concept_name,
      storyJson.story_content,
      storyJson.academic_definition,
      JSON.stringify(storyJson.metaphor_mappings),
      readingMinutes,
    ],
  );
  return rows[0];
}

export async function regenerateStoryAdmin(conceptKey, storyJson, inheritedUnlockCount) {
  const { calcReadingMinutes } = await import('../utils/helpers.js');
  const readingMinutes = calcReadingMinutes(storyJson.story_content);

  const { rows: versionRows } = await query(
    `SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM stories WHERE concept_key = $1`,
    [conceptKey],
  );
  const version = versionRows[0].next_version;

  await query(`UPDATE stories SET is_active = false WHERE concept_key = $1 AND is_active = true`, [
    conceptKey,
  ]);

  const { rows } = await query(
    `INSERT INTO stories (
      concept_key, version, is_active, title, category, concept_name,
      story_content, academic_definition, metaphor_mappings, reading_minutes, unlock_count
    ) VALUES ($1,$2,true,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *`,
    [
      conceptKey,
      version,
      storyJson.title,
      storyJson.category,
      storyJson.concept_name,
      storyJson.story_content,
      storyJson.academic_definition,
      JSON.stringify(storyJson.metaphor_mappings),
      readingMinutes,
      inheritedUnlockCount,
    ],
  );
  return rows[0];
}

export async function getFeed({ sort = 'hot', category, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;
  const params = [];
  let where = 'WHERE is_active = true';
  if (category) {
    params.push(category);
    where += ` AND category = $${params.length}`;
  }

  const orderBy =
    sort === 'new' ? 'created_at DESC' : 'unlock_count DESC, created_at DESC';

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM stories ${where}`,
    params,
  );
  const total = countResult.rows[0].total;

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT id, title, category, reading_minutes, unlock_count, cover_image_url, created_at
     FROM stories ${where}
     ORDER BY ${orderBy}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  const catResult = await query(
    `SELECT DISTINCT category FROM stories WHERE is_active = true ORDER BY category`,
  );

  return {
    items: rows,
    total,
    categories: catResult.rows.map((r) => r.category),
    show_tags: total >= 5,
    show_sort_tabs: total >= 5,
  };
}

export async function getGenerationStatus(conceptKey) {
  await expireStaleLocks();
  const story = await getActiveStory(conceptKey);
  if (story) return { status: 'ready', story_id: story.id };

  const locked = await isLocked(conceptKey);
  if (locked) return { status: 'generating' };

  const { rows } = await query(
    `SELECT error_message FROM generation_failures
     WHERE concept_key = $1 ORDER BY created_at DESC LIMIT 1`,
    [conceptKey],
  );
  if (rows[0]) return { status: 'failed', message: rows[0].error_message };

  return { status: 'not_found' };
}

export async function unlockStory({ storyId, userId, deviceId }) {
  const story = await getStoryById(storyId);
  if (!story) return null;

  let isNew = false;
  if (userId) {
    const existing = await query(
      `SELECT id FROM user_unlocks WHERE user_id = $1 AND story_id = $2`,
      [userId, storyId],
    );
    if (existing.rows.length === 0) {
      await query(`INSERT INTO user_unlocks (user_id, story_id) VALUES ($1, $2)`, [
        userId,
        storyId,
      ]);
      isNew = true;
    }
  } else if (deviceId) {
    const existing = await query(
      `SELECT id FROM user_unlocks WHERE device_id = $1 AND story_id = $2`,
      [deviceId, storyId],
    );
    if (existing.rows.length === 0) {
      await query(`INSERT INTO user_unlocks (device_id, story_id) VALUES ($1, $2)`, [
        deviceId,
        storyId,
      ]);
      isNew = true;
    }
  }

  if (isNew) {
    await query(`UPDATE stories SET unlock_count = unlock_count + 1 WHERE id = $1`, [storyId]);
    story.unlock_count += 1;
  }

  return story;
}

export async function isStoryUnlockedByUser({ storyId, userId, deviceId }) {
  if (userId) {
    const { rows } = await query(
      `SELECT 1 FROM user_unlocks WHERE user_id = $1 AND story_id = $2`,
      [userId, storyId],
    );
    return rows.length > 0;
  }
  if (deviceId) {
    const { rows } = await query(
      `SELECT 1 FROM user_unlocks WHERE device_id = $1 AND story_id = $2`,
      [deviceId, storyId],
    );
    return rows.length > 0;
  }
  return false;
}

export async function listAllStoriesAdmin({ page = 1, limit = 50 }) {
  const offset = (page - 1) * limit;
  const { rows } = await query(
    `SELECT id, concept_key, title, concept_name, category, unlock_count, is_active, created_at
     FROM stories ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  return rows;
}

export async function listFailuresAdmin({ limit = 50 }) {
  const { rows } = await query(
    `SELECT * FROM generation_failures ORDER BY created_at DESC LIMIT $1`,
    [limit],
  );
  return rows;
}
