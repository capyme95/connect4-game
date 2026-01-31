// Connect 4 - 修复匹配逻辑
class Connect4Fixed {
    constructor() {
        this.supabaseUrl = 'https://ffbqmickfvdnywjmnblo.supabase.co';
        this.supabaseKey = 'sb_publishable_B2DZvbChkjt834lzGM2EzQ_NUlZkqVE';
        this.supabase = null;
        this.gameActive = false;
        this.roomId = null;
        this.playerColor = null;
        
        this.init();
    }
    
    async init() {
        try {
            this.supabase = supabase.createClient(this.supabaseUrl, this.supabaseKey);
            this.setupEvents();
            this.updateStatus('就绪');
        } catch (error) {
            this.showError('初始化失败');
        }
    }
    
    setupEvents() {
        document.getElementById('joinGameBtn').addEventListener('click', () => this.findOrCreateGame());
        document.getElementById('resetGameBtn').addEventListener('click', () => this.resetGame());
    }
    
    async findOrCreateGame() {
        this.updateStatus('寻找游戏中...');
        document.getElementById('joinGameBtn').disabled = true;
        
        try {
            // 1. 查找等待中的游戏
            const { data: waitingRooms, error: findError } = await this.supabase
                .from('game_rooms')
                .select('*')
                .eq('game_status', 'waiting')
                .order('created_at', { ascending: true })
                .limit(1);
            
            if (findError) throw findError;
            
            if (waitingRooms && waitingRooms.length > 0) {
                // 2. 加入现有游戏（黄方）
                await this.joinGame(waitingRooms[0].id);
            } else {
                // 3. 创建新游戏（红方）
                await this.createGame();
            }
            
        } catch (error) {
            this.showError('错误: ' + error.message);
            document.getElementById('joinGameBtn').disabled = false;
        }
    }
    
    async createGame() {
        const playerId = 'player_' + Math.random().toString(36).substr(2, 9);
        
        const { data: room, error } = await this.supabase
            .from('game_rooms')
            .insert({
                player1_id: playerId,
                player1_name: 'Player 1',
                board_state: this.createEmptyBoard(),
                current_player: 1,
                game_status: 'waiting'
            })
            .select()
            .single();
        
        if (error) throw error;
        
        this.roomId = room.id;
        this.playerColor = 'red';
        this.gameActive = true;
        
        this.updateStatus('✅ 你是红方！等待黄方加入...');
        this.subscribeToGame();
        this.updateUI();
    }
    
    async joinGame(roomId) {
        const playerId = 'player_' + Math.random().toString(36).substr(2, 9);
        
        const { data: room, error } = await this.supabase
            .from('game_rooms')
            .update({
                player2_id: playerId,
                player2_name: 'Player 2',
                game_status: 'playing'
            })
            .eq('id', roomId)
            .select()
            .single();
        
        if (error) throw error;
        
        this.roomId = roomId;
        this.playerColor = 'yellow';
        this.gameActive = true;
        
        this.updateStatus('✅ 你是黄方！游戏开始！');
        this.subscribeToGame();
        this.updateUI();
    }
    
    subscribeToGame() {
        if (!this.roomId) return;
        
        this.supabase
            .channel(`room-${this.roomId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'game_rooms',
                filter: `id=eq.${this.roomId}`
            }, (payload) => {
                this.handleGameUpdate(payload.new);
            })
            .subscribe();
    }
    
    handleGameUpdate(room) {
        console.log('游戏更新:', room);
        
        if (room.game_status === 'playing') {
            this.updateStatus('游戏进行中...');
        }
        
        this.updateUI();
    }
    
    createEmptyBoard() {
        return Array(6).fill().map(() => Array(7).fill(0));
    }
    
    updateUI() {
        document.getElementById('resetGameBtn').disabled = !this.gameActive;
        document.getElementById('joinGameBtn').innerHTML = 
            this.gameActive ? '<i class="fas fa-user-check"></i> 游戏中' : '<i class="fas fa-play"></i> Join Game';
        
        if (this.roomId) {
            document.getElementById('roomId').textContent = this.roomId.substring(0, 8) + '...';
        }
    }
    
    updateStatus(msg) {
        document.getElementById('gameStatus').innerHTML = `<h2>${msg}</h2>`;
    }
    
    showError(msg) {
        document.getElementById('gameStatus').innerHTML = `<h2 style="color: red;">❌ ${msg}</h2>`;
    }
    
    async resetGame() {
        if (!this.roomId) return;
        
        try {
            await this.supabase
                .from('game_rooms')
                .update({
                    board_state: this.createEmptyBoard(),
                    current_player: 1,
                    game_status: 'playing'
                })
                .eq('id', this.roomId);
            
            this.updateStatus('游戏已重置！红方开始');
        } catch (error) {
            this.showError('重置失败');
        }
    }
}

// 启动
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Connect4Fixed();
});