// Connect 4 - 最终可靠版本
class Connect4Final {
    constructor() {
        console.log('游戏初始化...');
        
        // Supabase配置
        this.supabase = supabase.createClient(
            'https://ffbqmickfvdnywjmnblo.supabase.co',
            'sb_publishable_B2DZvbChkjt834lzGM2EzQ_NUlZkqVE'
        );
        
        // 游戏状态
        this.playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        this.roomId = null;
        this.playerColor = null;
        this.gameActive = false;
        
        console.log('玩家ID:', this.playerId);
        
        this.init();
    }
    
    init() {
        console.log('设置事件监听器...');
        
        // 设置按钮事件
        const joinBtn = document.getElementById('joinGameBtn');
        const resetBtn = document.getElementById('resetGameBtn');
        
        if (!joinBtn) {
            console.error('找不到Join Game按钮');
            return;
        }
        
        joinBtn.onclick = () => this.handleJoinGame();
        resetBtn.onclick = () => this.resetGame();
        
        this.updateStatus('点击 Join Game 开始游戏');
        console.log('初始化完成');
    }
    
    async handleJoinGame() {
        console.log('处理加入游戏...');
        
        const btn = document.getElementById('joinGameBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';
        
        try {
            // 第一步：尝试查找等待中的游戏
            console.log('查找等待中的游戏...');
            const { data: waitingRooms, error: findError } = await this.supabase
                .from('game_rooms')
                .select('id, player1_id, player2_id')
                .eq('game_status', 'waiting')
                .order('created_at', { ascending: true })
                .limit(1);
            
            if (findError) {
                console.error('查找游戏错误:', findError);
                throw findError;
            }
            
            console.log('找到等待房间:', waitingRooms);
            
            if (waitingRooms && waitingRooms.length > 0) {
                // 加入现有游戏（黄方）
                console.log('加入现有房间:', waitingRooms[0].id);
                await this.joinAsYellow(waitingRooms[0].id);
            } else {
                // 创建新游戏（红方）
                console.log('没有等待房间，创建新房间...');
                await this.createAsRed();
            }
            
        } catch (error) {
            console.error('加入游戏失败:', error);
            this.showError('错误: ' + error.message);
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-play"></i> Join Game';
        }
    }
    
    async createAsRed() {
        console.log('创建新房间作为红方...');
        
        const { data: room, error } = await this.supabase
            .from('game_rooms')
            .insert({
                player1_id: this.playerId,
                player1_name: '红方玩家',
                board_state: this.createEmptyBoard(),
                current_player: 1,
                game_status: 'waiting',
                created_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) {
            console.error('创建房间错误:', error);
            throw error;
        }
        
        console.log('房间创建成功:', room.id);
        
        this.roomId = room.id;
        this.playerColor = 'red';
        this.gameActive = true;
        
        this.updateStatus('🎯 你是红方！等待黄方玩家加入...');
        this.updateUI();
        this.subscribeToRoom();
        
        console.log('红方设置完成');
    }
    
    async joinAsYellow(roomId) {
        console.log('加入房间作为黄方:', roomId);
        
        const { data: room, error } = await this.supabase
            .from('game_rooms')
            .update({
                player2_id: this.playerId,
                player2_name: '黄方玩家',
                game_status: 'playing',
                updated_at: new Date().toISOString()
            })
            .eq('id', roomId)
            .select()
            .single();
        
        if (error) {
            console.error('加入房间错误:', error);
            throw error;
        }
        
        console.log('加入房间成功');
        
        this.roomId = roomId;
        this.playerColor = 'yellow';
        this.gameActive = true;
        
        this.updateStatus('🎯 你是黄方！游戏开始！');
        this.updateUI();
        this.subscribeToRoom();
        
        console.log('黄方设置完成');
    }
    
    subscribeToRoom() {
        if (!this.roomId) {
            console.error('没有房间ID，无法订阅');
            return;
        }
        
        console.log('订阅房间:', this.roomId);
        
        this.supabase
            .channel(`room-${this.roomId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'game_rooms',
                filter: `id=eq.${this.roomId}`
            }, (payload) => {
                console.log('房间更新:', payload.new);
                this.handleRoomUpdate(payload.new);
            })
            .subscribe((status) => {
                console.log('订阅状态:', status);
            });
    }
    
    handleRoomUpdate(room) {
        console.log('处理房间更新:', room);
        
        if (this.playerColor === 'red' && room.game_status === 'playing') {
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
            const colorDot = this.playerColor === 'red' ? 'red' : 'yellow';
            
            document.getElementById('currentPlayer').innerHTML = 
                `<span class="player-dot ${colorDot}"></span>
                 <span>${colorText}</span>`;
                 
            console.log('UI更新完成，玩家颜色:', this.playerColor);
        }
    }
    
    updateStatus(msg) {
        console.log('更新状态:', msg);
        document.getElementById('gameStatus').innerHTML = `<h2>${msg}</h2>`;
    }
    
    showError(msg) {
        console.error('显示错误:', msg);
        document.getElementById('gameStatus').innerHTML = `<h2 style="color: red;">❌ ${msg}</h2>`;
    }
    
    async resetGame() {
        if (!this.roomId) return;
        
        console.log('重置游戏:', this.roomId);
        
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
            console.error('重置失败:', error);
            this.showError('重置失败');
        }
    }
}

// 启动游戏
console.log('准备启动Connect 4游戏...');
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，创建游戏实例');
    window.game = new Connect4Final();
});