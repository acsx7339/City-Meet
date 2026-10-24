-- City-Meet PostgreSQL Schema & Seed Data
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    storm_level VARCHAR(50) NOT NULL,
    heat_score INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(50) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    area VARCHAR(100) NOT NULL,
    time_desc VARCHAR(100) NOT NULL,
    assembly_point JSONB NOT NULL,
    safety_trust JSONB NOT NULL,
    participants_count INTEGER NOT NULL DEFAULT 1,
    arrival_stats JSONB NOT NULL DEFAULT '{"departed": 0, "onTheWay": 0, "arrived": 0}'::jsonb,
    mood_particles JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_source_type ON events(source_type);
CREATE INDEX IF NOT EXISTS idx_events_heat_score ON events(heat_score DESC);
CREATE INDEX IF NOT EXISTS idx_events_coords ON events(latitude, longitude);

-- 使用者會員帳號資料表
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
    provider VARCHAR(50) DEFAULT 'google',
    google_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 預設種子活動（若尚未有資料時自動插入）
INSERT INTO events (
    id, title, source_type, storm_level, heat_score, category,
    latitude, longitude, area, time_desc,
    assembly_point, safety_trust, participants_count, arrival_stats, mood_particles
)
SELECT
    'evt-101-countdown',
    '2026 台北跨年倒數搖滾狂歡夜',
    'official',
    'strong',
    980,
    'party',
    25.0375,
    121.5644,
    '信義商圈',
    '今晚 19:00 - 01:00',
    '{"name": "市府路主舞台右側大螢幕下", "detail": "藍色工作人員服務帳篷旁，現場有立體風暴眼氣球標示", "backup": "捷運台北 101/世貿站 4 號出口噴水池"}'::jsonb,
    '{"score": 99, "isOfficial": true, "hostName": "台北市政府觀傳局 (認證)", "flags": ["官方大型認證", "現場醫療站設立", "夜間捷運42小時不打烊"]}'::jsonb,
    1420,
    '{"departed": 450, "onTheWay": 620, "arrived": 350}'::jsonb,
    '[
        {"id": "m1", "text": "101 煙火絕佳視角卡位中！", "emoji": "🎆", "author": "小安"},
        {"id": "m2", "text": "搖滾區音響超震撼，現場熱血沸騰！", "emoji": "🎸", "author": "阿Ken"},
        {"id": "m3", "text": "周邊人潮開始塞了，強烈建議搭捷運！", "emoji": "🚇", "author": "Kai"},
        {"id": "m4", "text": "現場限量螢光手環免費索取中～", "emoji": "✨", "author": "Rain"},
        {"id": "m5", "text": "跨年倒數的氛圍太棒了！", "emoji": "🔥", "author": "Evelyn"}
    ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM events WHERE id = 'evt-101-countdown');

INSERT INTO events (
    id, title, source_type, storm_level, heat_score, category,
    latitude, longitude, area, time_desc,
    assembly_point, safety_trust, participants_count, arrival_stats, mood_particles
)
SELECT
    'evt-christmas-city',
    '新北巨星耶誕狂歡城',
    'official',
    'moderate',
    420,
    'culture',
    25.0135,
    121.4655,
    '板橋車站特區',
    '每日 17:30 - 23:00',
    '{"name": "竹筍聖誕樹北側服務台前大時鐘", "detail": "面對板橋大遠百過馬路處，有閃爍雪花燈柱", "backup": "板橋捷運站 3A 出口地下連通道"}'::jsonb,
    '{"score": 98, "isOfficial": true, "hostName": "新北市政府 (官方認證)", "flags": ["官方節慶活動", "警力定點巡邏", "無障礙動線完善"]}'::jsonb,
    680,
    '{"departed": 180, "onTheWay": 280, "arrived": 220}'::jsonb,
    '[
        {"id": "m6", "text": "整點光雕投影秀美到不行！", "emoji": "🎄", "author": "Lily"},
        {"id": "m7", "text": "巨星演唱會彩排搶先看現場！", "emoji": "🎤", "author": "小豪"},
        {"id": "m8", "text": "德國熱紅酒市集排隊約 5 分鐘", "emoji": "🍷", "author": "Mia"},
        {"id": "m9", "text": "燈海步道拍照不用排隊衝啊", "emoji": "📸", "author": "晴晴"}
    ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM events WHERE id = 'evt-christmas-city');

INSERT INTO events (
    id, title, source_type, storm_level, heat_score, category,
    latitude, longitude, area, time_desc,
    assembly_point, safety_trust, participants_count, arrival_stats, mood_particles
)
SELECT
    'evt-daan-picnic',
    '大安森林公園春日不插電吉他野餐局',
    'ugc',
    'mild',
    115,
    'music',
    25.0300,
    121.5350,
    '大安區',
    '今天 14:30 - 18:30',
    '{"name": "露天音樂台後方大草坪大樹下", "detail": "鋪黃白格紋野餐墊，立著一支木吉他琴袋", "backup": "捷運大安森林公園站 2 號出口斜坡"}'::jsonb,
    '{"score": 94, "isOfficial": false, "hostName": "野餐主理人 Emma (常客)", "flags": ["實名手機認證", "歷史活動完成率 100%", "白天開闊公園"]}'::jsonb,
    38,
    '{"departed": 8, "onTheWay": 12, "arrived": 18}'::jsonb,
    '[
        {"id": "m10", "text": "帶了自烤檸檬磅蛋糕，歡迎免費吃！", "emoji": "🍰", "author": "Emma"},
        {"id": "m11", "text": "微風吹來聽指彈吉他好療癒", "emoji": "🍃", "author": "Ray"},
        {"id": "m12", "text": "有人帶兩隻柯基來一起打滾草皮", "emoji": "🐕", "author": "瑄瑄"},
        {"id": "m13", "text": "帶了手沖咖啡器材現場分享", "emoji": "☕", "author": "咖啡小飛"}
    ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM events WHERE id = 'evt-daan-picnic');

INSERT INTO events (
    id, title, source_type, storm_level, heat_score, category,
    latitude, longitude, area, time_desc,
    assembly_point, safety_trust, participants_count, arrival_stats, mood_particles
)
SELECT
    'evt-chifeng-photo',
    '赤峰街微醺底片攝影夜散步',
    'ugc',
    'depression',
    52,
    'culture',
    25.0558,
    121.5204,
    '中山赤峰商圈',
    '今晚 20:00 - 22:30',
    '{"name": "捷運雙連站 1 號出口旁手搖飲門口", "detail": "大家都背相機或底片機，很好辨識", "backup": "赤峰街巷口打鐵老店前"}'::jsonb,
    '{"score": 91, "isOfficial": false, "hostName": "老莫 (攝影愛好者)", "flags": ["信箱已驗證", "熱門商圈徒步"]}'::jsonb,
    16,
    '{"departed": 3, "onTheWay": 5, "arrived": 8}'::jsonb,
    '[
        {"id": "m14", "text": "今天帶柯達金 200 出動！", "emoji": "📷", "author": "老莫"},
        {"id": "m15", "text": "準備拐進打鐵小巷拍懷舊霓虹", "emoji": "💡", "author": "Iris"},
        {"id": "m16", "text": "散步完再去喝杯精釀啤酒", "emoji": "🍺", "author": "Danny"}
    ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM events WHERE id = 'evt-chifeng-photo');

INSERT INTO events (
    id, title, source_type, storm_level, heat_score, category,
    latitude, longitude, area, time_desc,
    assembly_point, safety_trust, participants_count, arrival_stats, mood_particles
)
SELECT
    'evt-ximen-ramen',
    '西門町深夜隱藏拉麵覓食小局',
    'ugc',
    'seed',
    18,
    'food',
    25.0425,
    121.5075,
    '西門町商圈',
    '今晚 22:30 集合',
    '{"name": "西門捷運 6 號出口彩虹地景斑馬線旁", "detail": "戴黑色鴨舌帽、手拿手機看地圖", "backup": "屈臣氏前大騎樓"}'::jsonb,
    '{"score": 88, "isOfficial": false, "hostName": "宵夜戰士 Leo", "flags": ["新進主辦人", "市區公共鬧區"]}'::jsonb,
    6,
    '{"departed": 1, "onTheWay": 2, "arrived": 3}'::jsonb,
    '[
        {"id": "m17", "text": "剛加班完好餓，求麵友同行！", "emoji": "🍜", "author": "Leo"},
        {"id": "m18", "text": "剛打聽過店內還有 4 個吧檯位", "emoji": "🥢", "author": "Leo"}
    ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM events WHERE id = 'evt-ximen-ramen');
