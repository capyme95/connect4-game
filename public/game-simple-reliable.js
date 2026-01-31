// Connect 4 - 简单可靠版本
class SimpleConnect4 {
    constructor() {
        this.supabase = supabase.createClient(
            'https://ffbqmickfvdnywjmnblo.supabase.co',
            'sb_publishable_B2DZvbChkjt834lzGM2EzQ_NUlZkqVE'
        );
        
        this.playerId = 'player_' + Math.random().toString(36).substr(2, 9);
        this.roomId = null;
        this.playerColor = null;
        this.gameActive = false;
        
        this.init();
    }
    
    init() {
        document.getElementById('joinGameBtn').onclick = () => this.joinGame();
        document.getElementById('resetGameBtn').onclick = () => this.resetGame();
        this.updateStatus('点击 Join Game 开始');
    }
    
    async joinGame() {
        const btn = document.getElementById('joinGameBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 寻找游戏中...';
        
        try {
            // 查找等待中的房间
            const { data: rooms, error } = await this.supabase
                .from('game_rooms')
                .select('*')
                .eq('game_status', 'waiting')
                .order('created_at', { ascending: true })
                .limit(1);
            
            if (error) throw error;
            
            if (rooms && rooms.length > 0) {
                // 加入现有房间（黄方）
                await this.joinExistingRoom(rooms[0].id);
            } else {
                // 创建新房间（红方）
                await this.createNewRoom();
            }
            
        } catch (error) {
            this.showError('错误: ' + error.message);
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-play"></i> Join Game';
        }
    }
    
    async createNewRoom() {
        const { data: room, error } = await this.supabase
            .from('game_rooms')
            .insert({
                player1_id: this.playerId,
                player1_name: '红方',
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
        
        this.updateStatus('🎯 你是红方！等待黄方加入...');
        this.updateUI();
        this.subscribeToRoom();
    }
    
    async joinExistingRoom(roomId) {
        const { data: room, error } = await this.supabase
            .from('game_rooms')
            .update({
                player2_id: this.playerId,
                player2_name: '黄方',
                game_status: 'playing'
            })
            .eq('id', roomId)
            .select()
            .single();
        
        if (error) throw error;
        
        this.roomId = roomId;
        this.playerColor = 'yellow';
        this.gameActive = true;
        
        this.updateStatus('🎯 你是黄方！游戏开始！');
        this.updateUI();
        this.subscribeToRoom();
    }
    
    subscribeToRoom() {
        if (!this.roomId) return;
        
        this.supabase
            .channel(`room-${this.roomId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'game_rooms',
                filter: `id=eq.${this.roomId}`
            }, (payload) => {
                this.handleRoomUpdate(payload.new);
            })
            .subscribe();
    }
    
    handleRoomUpdate(room) {
        console.log('房间更新:', room);
        
        if (room.game_status === 'playing' && this.playerColor === 'red') {
            this.updateStatus('🎮 游戏开始！你是红方先手！');
        }
        
        this.updateUI();
    }
    
    createEmptyBoard() {
        return Array(6).fill().map(() => Array(7).fill(0));
    }
    
    updateUI() {
        const joinBtn = document.getElementById('joinGameBtn');
        const resetBtn = document.getElementById('resetGameBtn');
        
        if (this.gameActive) {
            joinBtn.innerHTML = '<i class="fas fa-user-check"></i> 游戏中';
            joinBtn.disabled = true;
            resetBtn.disabled = false;
            
            if (this.roomId) {
                document.getElementById('roomId').textContent = this.roomId.substring(0, 8) + '...';
            }
            
            // 更新玩家颜色显示
            const colorText = this.playerColor === 'red' ? '红方' : '黄方';
            document.getElementById('currentPlayer').innerHTML = 
                `<span class="player-dot ${this.playerColor}"></span>
                 <span>${colorText}</span>`;
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
            
            this.updateStatus('🔄 游戏已重置！红方开始');
        } catch (error) {
            this.showError('重置失败');
        }
    }
}

// 启动
document.addEventListener('DOMContentLoaded', () => {
    new SimpleConnect4();
});