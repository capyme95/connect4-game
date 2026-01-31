// Connect 4 Game with Supabase
class Connect4Game {
    constructor() {
        // Supabase配置
        this.supabaseUrl = 'https://ffbqmickfvdnywjmnblo.supabase.co';
        this.supabaseKey = 'sb_publishable_B2DZvbChkjt834lzGM2EzQ_NUlZkqVE';
        
        // 游戏状态
        this.roomId = null;
        this.playerId = null;
        this.playerNumber = null; // 1 = 红方, 2 = 黄方
        this.playerName = 'Player';
        this.gameActive = false;
        this.currentPlayer = 1;
        this.board = this.createEmptyBoard();
        this.gameOver = false;
        this.winner = null;
        
        // Supabase客户端
        this.supabase = null;
        this.subscription = null;
        
        // DOM元素
        this.boardElement = document.getElementById('game-board');
        this.statusElement = document.getElementById('game-status');
        this.playerInfoElement = document.getElementById('player-info');
        this.chatMessagesElement = document.getElementById('chat-messages');
        this.chatInputElement = document.getElementById('chat-input');
        this.chatFormElement = document.getElementById('chat-form');
        this.createGameBtn = document.getElementById('create-game');
        this.joinGameBtn = document.getElementById('join-game');
        this.resetGameBtn = document.getElementById('reset-game');
        this.waitingRoomsElement = document.getElementById('waiting-rooms');
        this.roomIdInput = document.getElementById('room-id');
        
        this.init();
    }

    init() {
        // 初始化Supabase
        this.initSupabase();
        
        // 设置事件监听器
        this.setupEventListeners();
        
        // 初始化棋盘
        this.renderBoard();
        
        // 更新状态
        this.updateGameStatus('等待连接游戏服务器...');
        
        // 尝试获取玩家名称
        this.getPlayerName();
        
        // 加载等待中的游戏
        this.loadWaitingRooms();
    }

    initSupabase() {
        // 动态加载Supabase客户端
        if (typeof supabase === 'undefined') {
            console.error('Supabase客户端未加载');
            this.updateGameStatus('错误: Supabase客户端未加载');
            return;
        }
        
        this.supabase = supabase.createClient(this.supabaseUrl, this.supabaseKey);
        console.log('Supabase客户端初始化完成');
    }

    setupEventListeners() {
        // 创建游戏按钮
        if (this.createGameBtn) {
            this.createGameBtn.addEventListener('click', () => this.createNewGame());
        }
        
        // 加入游戏按钮
        if (this.joinGameBtn) {
            this.joinGameBtn.addEventListener('click', () => this.joinGame());
        }
        
        // 重置游戏按钮
        if (this.resetGameBtn) {
            this.resetGameBtn.addEventListener('click', () => this.resetGame());
        }
        
        // 聊天表单
        if (this.chatFormElement) {
            this.chatFormElement.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendChatMessage();
            });
        }
        
        // 棋盘点击事件
        if (this.boardElement) {
            // 使用事件委托处理棋盘点击
            this.boardElement.addEventListener('click', (e) => {
                const cell = e.target.closest('.cell');
                if (cell && this.gameActive && !this.gameOver) {
                    const col = parseInt(cell.dataset.col);
                    this.makeMove(col);
                }
            });
        }
        
        // 自动刷新等待房间列表
        setInterval(() => this.loadWaitingRooms(), 10000);
    }

    async createNewGame() {
        try {
            this.updateGameStatus('创建新游戏中...');
            
            const response = await fetch('/api/game/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerName: this.playerName
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.roomId = data.roomId;
                this.playerId = data.playerId;
                this.playerNumber = data.playerNumber;
                this.gameActive = true;
                
                this.updatePlayerInfo();
                this.updateGameStatus('游戏已创建！等待其他玩家加入...');
                this.subscribeToGameUpdates();
                
                // 显示房间ID
                if (this.roomIdInput) {
                    this.roomIdInput.value = this.roomId;
                }
                
                // 添加到等待房间列表
                this.loadWaitingRooms();
            } else {
                throw new Error(data.error || '创建游戏失败');
            }
        } catch (error) {
            console.error('创建游戏失败:', error);
            this.updateGameStatus('创建游戏失败: ' + error.message);
        }
    }

    async joinGame() {
        try {
            let roomId = this.roomIdInput ? this.roomIdInput.value.trim() : null;
            
            if (!roomId) {
                // 如果没有输入房间ID，尝试加入第一个等待中的房间
                const waitingRooms = await this.getWaitingRooms();
                if (waitingRooms.length > 0) {
                    roomId = waitingRooms[0].id;
                } else {
                    throw new Error('没有等待中的游戏房间');
                }
            }
            
            this.updateGameStatus('加入游戏中...');
            
            const response = await fetch(`/api/game/join/${roomId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerName: this.playerName
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.roomId = data.roomId;
                this.playerId = data.playerId;
                this.playerNumber = data.playerNumber;
                this.gameActive = true;
                
                this.updatePlayerInfo();
                this.updateGameStatus('已加入游戏！游戏开始！');
                this.subscribeToGameUpdates();
                
                // 加载游戏状态
                await this.loadGameState();
            } else {
                throw new Error(data.error || '加入游戏失败');
            }
        } catch (error) {
            console.error('加入游戏失败:', error);
            this.updateGameStatus('加入游戏失败: ' + error.message);
        }
    }

    async loadGameState() {
        try {
            const response = await fetch(`/api/game/${this.roomId}`);
            const data = await response.json();
            
            if (data.success && data.room) {
                this.updateGameFromRoom(data.room);
            }
        } catch (error) {
            console.error('加载游戏状态失败:', error);
        }
    }

    subscribeToGameUpdates() {
        if (!this.roomId || !this.supabase) return;
        
        // 取消之前的订阅
        if (this.subscription) {
            this.supabase.removeChannel(this.subscription);
        }
        
        // 订阅游戏房间更新
        this.subscription = this.supabase
            .channel(`room-${this.roomId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'game_rooms',
                    filter: `id=eq.${this.roomId}`
                },
                (payload) => {
                    this.handleRoomUpdate(payload);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'game_moves',
                    filter: `room_id=eq.${this.roomId}`
                },
                (payload) => {
                    this.handleNewMove(payload);
                }
            )
            .subscribe((status) => {
                console.log('Supabase订阅状态:', status);
            });
    }

    handleRoomUpdate(payload) {
        console.log('房间更新:', payload);
        
        if (payload.new) {
            this.updateGameFromRoom(payload.new);
        }
    }

    handleNewMove(payload) {
        console.log('新移动:', payload);
        
        if (payload.new) {
            const move = payload.new;
            // 这里可以处理新移动，比如更新聊天显示
            this.addChatMessage('系统', `玩家在列 ${move.column + 1} 下棋`);
        }
    }

    updateGameFromRoom(room) {
        // 更新棋盘
        if (room.board_state) {
            this.board = room.board_state;
            this.renderBoard();
        }
        
        // 更新当前玩家
        this.currentPlayer = room.current_player || 1;
        
        // 更新游戏状态
        this.gameOver = room.game_status !== 'playing';
        
        if (room.game_status === 'red_won') {
            this.winner = 1;
            this.updateGameStatus('游戏结束！红方获胜！');
        } else if (room.game_status === 'yellow_won') {
            this.winner = 2;
            this.updateGameStatus('游戏结束！黄方获胜！');
        } else if (room.game_status === 'draw') {
            this.winner = 0;
            this.updateGameStatus('游戏结束！平局！');
        } else if (room.game_status === 'playing') {
            const playerText = this.currentPlayer === 1 ? '红方' : '黄方';
            this.updateGameStatus(`游戏中... 当前回合: ${playerText}`);
        } else if (room.game_status === 'waiting') {
            this.updateGameStatus('等待其他玩家加入...');
        }
        
        // 更新玩家信息
        this.updatePlayerInfo();
    }

    async makeMove(column) {
        if (!this.gameActive || this.gameOver) return;
        
        // 检查是否是当前玩家的回合
        if ((this.currentPlayer === 1 && this.playerNumber !== 1) ||
            (this.currentPlayer === 2 && this.playerNumber !== 2)) {
            this.showNotification('不是你的回合！');
            return;
        }
        
        try {
            const response = await fetch(`/api/game/${this.roomId}/move`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerId: this.playerId,
                    column: column
                })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || '下棋失败');
            }
        } catch (error) {
            console.error('下棋失败:', error);
            this.showNotification('下棋失败: ' + error.message);
        }
    }

    async resetGame() {
        if (!this.roomId) return;
        
        try {
            const response = await fetch(`/api/game/${this.roomId}/reset`, {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('游戏已重置');
            }
        } catch (error) {
            console.error('重置游戏失败:', error);
            this.showNotification('重置失败: ' + error.message);
        }
    }

    async sendChatMessage() {
        if (!this.chatInputElement || !this.roomId || !this.playerId) return;
        
        const message = this.chatInputElement.value.trim();
        if (!message) return;
        
        try {
            const response = await fetch(`/api/game/${this.roomId}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerId: this.playerId,
                    message: message
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // 本地显示消息
                const playerName = this.playerNumber === 1 ? '红方' : '黄方';
                this.addChatMessage(playerName, message);
                this.chatInputElement.value = '';
            }
        } catch (error) {
            console.error('发送聊天失败:', error);
        }
    }

    async loadWaitingRooms() {
        try {
            const response = await fetch('/api/game/waiting');
            const data = await response.json();
            
            if (data.success && this.waitingRoomsElement) {
                this.displayWaitingRooms(data.rooms || []);
            }
        } catch (error) {
            console.error('加载等待房间失败:', error);
        }
    }

    async getWaitingRooms() {
        try {
            const response = await fetch('/api/game/waiting');
            const data = await response.json();
            return data.success ? data.rooms || [] : [];
        } catch (error) {
            console.error('获取等待房间失败:', error);
            return [];
        }
    }

    displayWaitingRooms(rooms) {
        if (!this.waitingRoomsElement) return;
        
        if (rooms.length === 0) {
            this.waitingRoomsElement.innerHTML = '<p>没有等待中的游戏房间</p>';
            return;
        }
        
        let html = '<h3>等待中的游戏房间:</h3><ul>';
        
        rooms.forEach(room => {
            const timeAgo = this.getTimeAgo(new Date(room.created_at));
            html += `
                <li>
                    <strong>房间: ${room.id.substring(0, 8)}...</strong><br>
                    玩家: ${room.player1_name || '玩家1'}<br>
                    创建于: ${timeAgo}
                    <button onclick="game.joinRoomById('${room.id}')" class="btn-join">
                        加入游戏
                    </button>
                </li>
            `;
        });
        
        html += '</ul>';
        this.waitingRoomsElement.innerHTML = html;
    }

    joinRoomById(roomId) {
        if (this.roomIdInput) {
            this.roomIdInput.value = roomId;
        }
        this.joinGame();
    }

    // 工具方法
    createEmptyBoard() {
        const board = [];
        for (let row = 0; row < 6; row++) {
            board[row] = [];
            for (let col = 0; col < 7; col++) {
                board[row][col] = 0;
            }
        }
        return board;
    }

    renderBoard() {
        if (!this.boardElement) return;
        
        let html = '';
        for (let row = 0; row < 6; row++) {
            html += '<div class="row">';
            for (let col = 0; col < 7; col++) {
                const cellValue = this.board[row][col];
                let cellClass = 'cell';
                let cellContent = '';
                
                if (cellValue === 1) {
                    cellClass += ' red';
                    cellContent = '<div class="piece"></div>';
                } else if (cellValue === 2) {
                    cellClass += ' yellow';
                    cellContent = '<div class="piece"></div>';
                }
                
                html += `
                    <div class="${cellClass}" data-row="${row}" data-col="${col}">
                        ${cellContent}
                    </div>
                `;
            }
            html += '</div>';
        }
        
        this.boardElement.innerHTML = html;
    }

    updateGameStatus(message) {
        if (this.statusElement) {
            this.statusElement.textContent = message;
        }
    }

    updatePlayerInfo() {
        if (!this.playerInfoElement) return;
        
        let info = '';
        
        if (this.playerId) {
            const playerColor = this.playerNumber === 1 ? '红方' : '黄方';
            info += `你是: ${playerColor} (${this.playerName})<br>`;
        }
        
        if (this.roomId) {
            info += `房间ID: ${this.roomId.substring(0, 12)}...<br>`;
        }
        
        this.playerInfoElement.innerHTML = info;
    }

    addChatMessage(sender, message) {
        if (!this.chatMessagesElement) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        messageElement.innerHTML = `
            <strong>${sender}:</strong> ${message}
            <small>${new Date().toLocaleTimeString()}</small>
        `;
        
        this.chatMessagesElement.appendChild(messageElement);
        this.chatMessagesElement.scrollTop = this.chatMessagesElement.scrollHeight;
    }

    showNotification(message) {
        // 简单的通知系统
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: fadeInOut 3s;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    getPlayerName() {
        const savedName = localStorage.getItem('connect4_player_name');
        if (savedName) {
            this.playerName = savedName;
        } else {
            const name = prompt('请输入你的名字:', 'Player');
            if (name) {
                this.playerName = name;
                localStorage.setItem('connect4_player_name', name);
            }
        }
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        if (seconds < 60) return '刚刚';
        if (seconds < 3600) return Math.floor(seconds / 60) + '分钟前';
        if (seconds < 86400) return Math.floor(seconds / 3600) + '小时前';
        return Math.floor(seconds / 86400) + '天前';
    }
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(-10px); }
        10% { opacity: 1; transform: translateY(0); }
        90% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-10px); }
    }
    
    .btn-join {
        background: #4CAF50;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 3px;
        cursor: pointer;
        margin-top: 5px;
    }
    
    .btn-join:hover {
        background: #45a049;
    }
    
    #waiting-rooms ul {
        list-style: none;
        padding: 0;
    }
    
    #waiting-rooms li {
        background: #f5f5f5;
        padding: 10px;
        margin: 5px 0;
        border-radius: 5px;
        border-left: 4px solid #4CAF50;
    }
`;
document.head.appendChild(style);

// 初始化游戏
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new Connect4Game();
    
    // 全局函数供按钮使用
    window.game = game;
    window.joinRoomById = (roomId) => game.joinRoomById(roomId);
});