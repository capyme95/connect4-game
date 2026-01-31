-- Connect4 Game - Supabase 数据库设置（简化版）
-- 一次执行即可

-- 1. 创建表
CREATE TABLE IF NOT EXISTS game_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player1_id TEXT NOT NULL,
    player1_name TEXT DEFAULT 'Player 1',
    player2_id TEXT,
    player2_name TEXT DEFAULT 'Player 2',
    board_state JSONB DEFAULT '[[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]]'::jsonb,
    current_player INTEGER DEFAULT 1,
    game_status TEXT DEFAULT 'waiting',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_moves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
    player_id TEXT NOT NULL,
    col_index INTEGER NOT NULL CHECK (col_index >= 0 AND col_index <= 6),
    row_index INTEGER NOT NULL CHECK (row_index >= 0 AND row_index <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 启用行级安全
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_moves ENABLE ROW LEVEL SECURITY;

-- 3. 创建简单策略（允许所有操作）
CREATE POLICY "game_rooms_all" ON game_rooms FOR ALL USING (true);
CREATE POLICY "game_moves_all" ON game_moves FOR ALL USING (true);

-- 4. 启用实时
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE game_rooms, game_moves;

-- 5. 完成
SELECT '数据库设置完成！表已创建：game_rooms, game_moves' as message;