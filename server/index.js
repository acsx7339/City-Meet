import express from 'express';
import cors from 'cors';
import { query, checkConnection } from './db.js';
import { fetchAndSyncCultureEvents } from './sync-taiwan-events.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 輔助函式：將 DB snake_case 欄位轉換為前端 camelCase 格式
function mapRowToEvent(row) {
  return {
    id: row.id,
    title: row.title,
    sourceType: row.source_type,
    stormLevel: row.storm_level,
    heatScore: row.heat_score,
    category: row.category,
    coordinates: [row.latitude, row.longitude],
    area: row.area,
    timeDesc: row.time_desc,
    assemblyPoint: row.assembly_point,
    safetyTrust: row.safety_trust,
    participantsCount: row.participants_count,
    arrivalStats: row.arrival_stats,
    moodParticles: row.mood_particles,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// 根據熱度分數計算颱風分級
function mapScoreToStormLevel(score) {
  if (score >= 600) return 'strong';
  if (score >= 250) return 'moderate';
  if (score >= 80) return 'mild';
  if (score >= 30) return 'depression';
  return 'seed';
}

// 1. 健康檢查與資料庫狀態
app.get('/api/health', async (req, res) => {
  const dbStatus = await checkConnection();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

// --- 後台管理員登入認證 API ---
const ADMIN_USERNAME = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'sjwd5407';

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.json({
      success: true,
      message: '認證成功',
      token: `adm-token-${Date.now()}`
    });
  }
  return res.status(401).json({
    success: false,
    error: '管理員帳號或密碼錯誤，請重新輸入'
  });
});

// 管理員一鍵同步全台活動 (文化部 Open Data API)
app.post('/api/admin/sync-events', async (req, res) => {
  try {
    const limit = parseInt(req.body.limit, 10) || 100;
    const result = await fetchAndSyncCultureEvents(limit);
    res.json({
      success: true,
      count: result.count,
      events: result.events,
      message: `成功從文化部同步並寫入 ${result.count} 筆全台活動資料`
    });
  } catch (error) {
    console.error('Error during Taiwan events sync:', error);
    res.status(500).json({
      success: false,
      error: `同步全台活動失敗: ${error.message}`
    });
  }
});

// --- 使用者認證與 Google 登入 API ---

// 取得 Google Client ID 配置
app.get('/api/auth/config', (req, res) => {
  res.json({
    googleClientId: process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ''
  });
});

// Google 登入驗證與會員存檔至 PostgreSQL
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential, email, name, avatar, googleId } = req.body;
    let userEmail = email;
    let userName = name;
    let userAvatar = avatar;
    let userGoogleId = googleId;

    // 若傳入 Google 官方核發之 credential (JWT ID Token)，進行 Base64 解碼取得 profile
    if (credential) {
      try {
        const payloadBase64 = credential.split('.')[1];
        const decodedJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
        const payload = JSON.parse(decodedJson);
        userEmail = payload.email || userEmail;
        userName = payload.name || userName;
        userAvatar = payload.picture || userAvatar;
        userGoogleId = payload.sub || userGoogleId;
      } catch (decodeErr) {
        console.warn('Failed to parse Google JWT payload:', decodeErr.message);
      }
    }

    if (!userEmail) {
      return res.status(400).json({ error: 'Email is required for authentication' });
    }

    const userId = `usr-${userGoogleId || Date.now()}`;
    const sql = `
      INSERT INTO users (id, email, name, avatar, provider, google_id)
      VALUES ($1, $2, $3, $4, 'google', $5)
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        avatar = EXCLUDED.avatar,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const result = await query(sql, [
      userId,
      userEmail,
      userName || userEmail.split('@')[0],
      userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${userEmail}`,
      userGoogleId || null
    ]);

    const userRow = result.rows[0];
    res.json({
      success: true,
      user: {
        id: userRow.id,
        email: userRow.email,
        name: userRow.name,
        avatar: userRow.avatar,
        provider: userRow.provider,
        createdAt: userRow.created_at
      }
    });
  } catch (error) {
    console.error('Error during Google authentication:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// 2. 獲取所有活動列表（支援搜尋與分類過濾）
app.get('/api/events', async (req, res) => {
  try {
    const { category, source, q } = req.query;
    let sql = 'SELECT * FROM events WHERE 1=1';
    const params = [];

    if (category && category !== 'all') {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    if (source && source !== 'all') {
      params.push(source);
      sql += ` AND source_type = $${params.length}`;
    }

    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      sql += ` AND (title ILIKE $${params.length} OR area ILIKE $${params.length})`;
    }

    sql += ' ORDER BY heat_score DESC, created_at DESC';

    const result = await query(sql, params);
    res.json(result.rows.map(mapRowToEvent));
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events from database' });
  }
});

// 3. 全民自主造局：建立新氣旋
app.post('/api/events', async (req, res) => {
  try {
    const evt = req.body;
    if (!evt.id || !evt.title || !evt.coordinates) {
      return res.status(400).json({ error: 'Missing required event fields' });
    }

    const sql = `
      INSERT INTO events (
        id, title, source_type, storm_level, heat_score, category,
        latitude, longitude, area, time_desc,
        assembly_point, safety_trust, participants_count, arrival_stats, mood_particles
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        storm_level = EXCLUDED.storm_level,
        heat_score = EXCLUDED.heat_score,
        category = EXCLUDED.category,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        area = EXCLUDED.area,
        time_desc = EXCLUDED.time_desc,
        assembly_point = EXCLUDED.assembly_point,
        safety_trust = EXCLUDED.safety_trust,
        participants_count = EXCLUDED.participants_count,
        arrival_stats = EXCLUDED.arrival_stats,
        mood_particles = EXCLUDED.mood_particles,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const params = [
      evt.id,
      evt.title,
      evt.sourceType || 'ugc',
      evt.stormLevel || 'seed',
      evt.heatScore || 20,
      evt.category || 'other',
      evt.coordinates[0],
      evt.coordinates[1],
      evt.area || '台北市區',
      evt.timeDesc || '即刻集合',
      JSON.stringify(evt.assemblyPoint || {}),
      JSON.stringify(evt.safetyTrust || { score: 90, isOfficial: false }),
      evt.participantsCount || 1,
      JSON.stringify(evt.arrivalStats || { departed: 0, onTheWay: 0, arrived: 1 }),
      JSON.stringify(evt.moodParticles || [])
    ];

    const result = await query(sql, params);
    res.status(201).json(mapRowToEvent(result.rows[0]));
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event in database' });
  }
});

// 4. 後台管理大量匯入活動 (Batch Import)
app.post('/api/events/batch', async (req, res) => {
  try {
    const { events } = req.body;
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'Events array is required' });
    }

    const insertedEvents = [];
    for (const evt of events) {
      const sql = `
        INSERT INTO events (
          id, title, source_type, storm_level, heat_score, category,
          latitude, longitude, area, time_desc,
          assembly_point, safety_trust, participants_count, arrival_stats, mood_particles
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          source_type = EXCLUDED.source_type,
          storm_level = EXCLUDED.storm_level,
          heat_score = EXCLUDED.heat_score,
          category = EXCLUDED.category,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          area = EXCLUDED.area,
          time_desc = EXCLUDED.time_desc,
          assembly_point = EXCLUDED.assembly_point,
          safety_trust = EXCLUDED.safety_trust,
          participants_count = EXCLUDED.participants_count,
          arrival_stats = EXCLUDED.arrival_stats,
          mood_particles = EXCLUDED.mood_particles,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *;
      `;

      const params = [
        evt.id,
        evt.title,
        evt.sourceType || 'official',
        evt.stormLevel || 'mild',
        evt.heatScore || 100,
        evt.category || 'culture',
        evt.coordinates[0],
        evt.coordinates[1],
        evt.area || '市區',
        evt.timeDesc || '近期舉辦',
        JSON.stringify(evt.assemblyPoint || {}),
        JSON.stringify(evt.safetyTrust || { score: 95, isOfficial: true }),
        evt.participantsCount !== undefined ? evt.participantsCount : 0,
        JSON.stringify(evt.arrivalStats || { departed: 0, onTheWay: 0, arrived: 0 }),
        JSON.stringify(evt.moodParticles || [])
      ];

      const resRow = await query(sql, params);
      insertedEvents.push(mapRowToEvent(resRow.rows[0]));
    }

    res.json({
      success: true,
      count: insertedEvents.length,
      events: insertedEvents
    });
  } catch (error) {
    console.error('Error batch importing events:', error);
    res.status(500).json({ error: 'Failed to batch import events' });
  }
});

// 5. 新增現場小心聲（熱度 +15，動態升級風暴半徑）
app.post('/api/events/:id/moods', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, emoji, author } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Mood text is required' });
    }

    // 取得當前活動
    const checkRes = await query('SELECT * FROM events WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const current = checkRes.rows[0];
    const newMood = {
      id: `m-${Date.now()}`,
      text: text.trim(),
      emoji: emoji || '✨',
      author: author || '現場同好',
      createdAt: new Date().toISOString()
    };

    const nextParticles = [newMood, ...(current.mood_particles || [])];
    const nextHeat = (current.heat_score || 0) + 15;
    const nextLevel = mapScoreToStormLevel(nextHeat);

    const updateRes = await query(
      `UPDATE events
       SET mood_particles = $1::jsonb,
           heat_score = $2,
           storm_level = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [JSON.stringify(nextParticles), nextHeat, nextLevel, id]
    );

    res.json(mapRowToEvent(updateRes.rows[0]));
  } catch (error) {
    console.error('Error adding mood:', error);
    res.status(500).json({ error: 'Failed to add mood' });
  }
});

// 6. 更新使用者抵達狀態（更新人數與熱度）
app.patch('/api/events/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { statusKey } = req.body; // 'arrived' | 'onTheWay' | 'departed'

    const checkRes = await query('SELECT * FROM events WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const current = checkRes.rows[0];
    const stats = { ...(current.arrival_stats || { departed: 0, onTheWay: 0, arrived: 0 }) };

    if (statusKey === 'arrived') stats.arrived = (stats.arrived || 0) + 1;
    else if (statusKey === 'onTheWay') stats.onTheWay = (stats.onTheWay || 0) + 1;
    else if (statusKey === 'departed') stats.departed = (stats.departed || 0) + 1;

    const heatBonus = statusKey === 'arrived' ? 5 : 2;
    const nextHeat = (current.heat_score || 0) + heatBonus;
    const nextLevel = mapScoreToStormLevel(nextHeat);

    const updateRes = await query(
      `UPDATE events
       SET arrival_stats = $1::jsonb,
           heat_score = $2,
           storm_level = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [JSON.stringify(stats), nextHeat, nextLevel, id]
    );

    res.json(mapRowToEvent(updateRes.rows[0]));
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[City-Meet API Server] running on http://0.0.0.0:${PORT}`);
});
