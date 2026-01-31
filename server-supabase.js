// Connect 4 Game Server with Supabase
const express = require('express');
const cors = require('cors');
const path = require('path');
const { SupabaseGameManager } = require('./supabase-client');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 游戏管理器
const gameManager = new SupabaseGameManager();

// 生成玩家ID
function generatePlayerId() {
  return 'player_' + Math.random().toString(36).substr(2, 9);
}

// API路由

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Connect4 Game with Supabase',
    players: 0 // 需要从Supabase获取
  });
});

// 创建新游戏
app.post('/api/game/create', async (req, res) => {
  try {
    const { playerName } = req.body;
    const playerId = generatePlayerId();
    
    const room = await gameManager.createGameRoom(playerId, playerName);
    
    res.json({
      success: true,
      roomId: room.id,
      playerId: playerId,
      playerNumber: 1, // 红方
      room: room
    });
  } catch (error) {
    console.error('创建游戏失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 加入游戏
app.post('/api/game/join/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerName } = req.body;
    const playerId = generatePlayerId();
    
    const room = await gameManager.joinGameRoom(roomId, playerId, playerName);
    
    res.json({
      success: true,
      roomId: room.id,
      playerId: playerId,
      playerNumber: 2, // 黄方
      room: room
    });
  } catch (error) {
    console.error('加入游戏失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取等待中的游戏
app.get('/api/game/waiting', async (req, res) => {
  try {
    const rooms = await gameManager.getWaitingRooms();
    res.json({
      success: true,
      rooms: rooms
    });
  } catch (error) {
    console.error('获取等待游戏失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取游戏状态
app.get('/api/game/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await gameManager.getGameRoom(roomId);
    
    res.json({
      success: true,
      room: room
    });
  } catch (error) {
    console.error('获取游戏状态失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 下棋
app.post('/api/game/:roomId/move', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId, column } = req.body;
    
    // 获取当前房间状态
    const room = await gameManager.getGameRoom(roomId);
    
    // 验证玩家
    if (playerId !== room.player1_id && playerId !== room.player2_id) {
      throw new Error('无效的玩家');
    }
    
    // 验证当前玩家
    const expectedPlayer = room.current_player === 1 ? room.player1_id : room.player2_id;
    if (playerId !== expectedPlayer) {
      throw new Error('不是你的回合');
    }
    
    // 验证游戏状态
    if (room.game_status !== 'playing') {
      throw new Error('游戏未进行中');
    }
    
    // 找到可用的行
    let row = -1;
    for (let r = 5; r >= 0; r--) {
      if (room.board_state[r][column] === 0) {
        row = r;
        break;
      }
    }
    
    if (row === -1) {
      throw new Error('该列已满');
    }
    
    // 记录移动
    const move = await gameManager.recordMove(roomId, playerId, column, row);
    
    res.json({
      success: true,
      move: move,
      row: row,
      column: column
    });
  } catch (error) {
    console.error('下棋失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 重置游戏
app.post('/api/game/:roomId/reset', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // 这里需要实现重置逻辑
    // 暂时返回成功
    res.json({
      success: true,
      message: '游戏重置功能待实现'
    });
  } catch (error) {
    console.error('重置游戏失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 聊天消息
app.post('/api/game/:roomId/chat', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId, message } = req.body;
    
    // 这里可以保存聊天消息到Supabase
    // 暂时直接返回
    
    res.json({
      success: true,
      message: '聊天消息已发送',
      data: {
        playerId,
        message,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('发送聊天失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 默认路由 - 提供游戏页面
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Connect 4 Game Server with Supabase is running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});