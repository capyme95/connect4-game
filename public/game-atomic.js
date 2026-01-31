// Connect 4 - 原子操作版本（解决竞争条件）
class Connect4Atomic {
    constructor() {
        this.supabase = supabase.createClient(
            'https://ffbqmickfvdnywjmnblo.supabase.co',
            'sb_publishable_B2DZvbChkjt834lzGM2EzQ_NUlZkqVE'
        );
        
        this.playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        this.roomId = null;
        this.playerColor = null;
        
        this.init();
    }
    
    init() {
        document.getElementById('joinGameBtn').onclick = () => this.joinGameAtomic();
        document.getElementById('resetGameBtn').onclick = () => this.resetGame();
        this.updateStatus('点击 Join Game 开始');
    }
    
    async joinGameAtomic() {
        const btn = document.getElementById('joinGameBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';
        
        try {
            // 尝试最多3次
            for (let attempt = 1; attempt <= 3; attempt++) {
                console.log(`尝试 ${attempt}/3`);
                
                // 1. 查找等待中的房间
                const { data: rooms, error: findError } = await this.supabase
                    .from('game_rooms')
                    .select('id, player1_id, player2_id, created_at')
                    .eq('game_status', 'waiting')
                    .is('player2_id', null)  // 确保player2_id为空
                    .order('created_at', { ascending: true })
                    .limit(1);
                
                if (findError) throw findError;
                
                if (rooms && rooms.length > 0) {
                    // 2. 尝试加入这个房间（原子操作）
                    const room = rooms[0];
                    console.log('尝试加入房间:', room.id);
                    
                    const { data: updatedRoom, error: joinError } = await this.supabase
                        .from('game_rooms')
                        .update({
                            player2_id: this.playerId,
                            player2_name: '黄方',
                            game_status: 'playing',
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', room.id)
                        .eq('player2_id', null)  // 关键：只有player2_id为空时才更新
                        .select()
                        .single();
                    
                    if (!joinError && updatedRoom) {
                        // 加入成功（黄方）
                        console.log('加入成功：黄方');
                        await this.setupGame(room.id, 'yellow');
                        return;
                    }
                    
                    // 如果更新失败（被别人抢先了），继续循环
                    console.log('加入失败，可能被抢先，重试...');
                    await new Promise(resolve => setTimeout(resolve, 500));
                    continue;
                }
                
                // 3. 没有等待房间，创建新房间
                console.log('没有等待房间，创建新房间...');
                const { data: newRoom, error: createError } = await this.supabase
                    .from('game_rooms')
                    .insert({
                        player1_id: this.playerId,
                        player1_name: '红方',
                        board_state: this.createEmptyBoard(),
                        current_player: 1,
                        game_status: 'waiting',
                        created_at: new Date().toISOString()
                    })
                    .select()
                    .single();
                
                if (createError) throw createError;
                
                console.log('创建成功：红方');
                await this.setupGame(newRoom.id, 'red');
                return;
            }
            
            // 所有尝试都失败
            throw new Error('无法加入或创建游戏，请重试');
            
        } catch (error) {
            console.error('加入游戏失败:', error);
            this.showError('错误: ' + error.message);
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-play"></i> Join Game';
        }
    }
    
    async setupGame(roomId, color) {
        this.roomId = roomId;
        this.playerColor = color;
        
        if (color === 'red') {
            this.updateStatus('🎯 你是红方！等待黄方加入...');
            this.subscribeToRoom();
        } else {
            this.updateStatus('🎯 你是黄方！游戏开始！');
            this.subscribeToRoom();
        }
        
        this.updateUI();
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
        if (this.playerColor === 'red' && room.game_status === 'playing') {
            this.updateStatus('🎮 游戏开始！你是红方先手！');
        }
    }
    
    createEmptyBoard() {
        return Array(6).fill().map(() => Array(7).fill(0));
    }
    
    updateUI() {
        const joinBtn = document.getElementById('joinGameBtn');
        const resetBtn = document.getElementById('resetGameBtn');
        
        joinBtn.innerHTML = '<i class="fas fa-user-check"></i> 游戏中';
        joinBtn.disabled = true;
        resetBtn.disabled = false;
        
        if (this.roomId) {
            document.getElementById('roomId').textContent = this.roomId.substring(0, 8) + '...';
        }
        
        const colorText = this.playerColor === 'red' ? '红方' : '黄方';
        const colorDot = this.playerColor === 'red' ? 'red' : 'yellow';
        
        document.getElementById('currentPlayer').innerHTML = 
            `<span class="player-dot ${colorDot}"></span>
             <span>${colorText}</span>`;
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
    new Connect4Atomic();
});