// Connect 4 - 确保能工作的版本
class Connect4Working {
    constructor() {
        console.log('初始化游戏...');
        
        this.supabase = supabase.createClient(
            'https://ffbqmickfvdnywjmnblo.supabase.co',
            'sb_publishable_B2DZvbChkjt834lzGM2EzQ_NUlZkqVE'
        );
        
        this.playerId = 'player_' + Date.now();
        this.roomId = null;
        this.playerColor = null;
        
        this.init();
    }
    
    init() {
        console.log('设置事件...');
        document.getElementById('joinGameBtn').onclick = () => this.simpleJoinGame();
        document.getElementById('resetGameBtn').onclick = () => this.resetGame();
        this.updateStatus('准备开始');
    }
    
    async simpleJoinGame() {
        console.log('简单加入游戏...');
        const btn = document.getElementById('joinGameBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';
        
        try {
            // 方法1：先尝试创建游戏（红方）
            console.log('尝试创建游戏...');
            const { data: newRoom, error: createError } = await this.supabase
                .from('game_rooms')
                .insert({
                    player1_id: this.playerId,
                    player1_name: '玩家',
                    board_state: JSON.stringify(this.createEmptyBoard()),
                    current_player: 1,
                    game_status: 'waiting'
                })
                .select()
                .single();
            
            if (!createError && newRoom) {
                console.log('创建成功：红方');
                this.setupGame(newRoom.id, 'red');
                return;
            }
            
            console.log('创建失败，错误:', createError);
            
            // 方法2：查找并加入游戏（黄方）
            console.log('尝试查找游戏...');
            const { data: rooms, error: findError } = await this.supabase
                .from('game_rooms')
                .select('*')
                .eq('game_status', 'waiting')
                .limit(1);
            
            if (findError) {
                console.error('查找错误:', findError);
                throw findError;
            }
            
            if (rooms && rooms.length > 0) {
                console.log('找到房间，尝试加入...');
                const room = rooms[0];
                
                const { data: updatedRoom, error: updateError } = await this.supabase
                    .from('game_rooms')
                    .update({
                        player2_id: this.playerId,
                        player2_name: '玩家2',
                        game_status: 'playing'
                    })
                    .eq('id', room.id)
                    .select()
                    .single();
                
                if (!updateError && updatedRoom) {
                    console.log('加入成功：黄方');
                    this.setupGame(room.id, 'yellow');
                    return;
                }
                
                console.log('加入失败，错误:', updateError);
            }
            
            // 方法3：直接创建，忽略错误
            console.log('最后尝试：强制创建...');
            const { data: finalRoom, error: finalError } = await this.supabase
                .from('game_rooms')
                .insert({
                    player1_id: this.playerId + '_final',
                    player1_name: '最终玩家',
                    board_state: JSON.stringify(this.createEmptyBoard()),
                    current_player: 1,
                    game_status: 'waiting'
                })
                .select()
                .single();
            
            if (finalError) {
                console.error('最终创建失败:', finalError);
                throw new Error('Supabase错误: ' + finalError.message);
            }
            
            console.log('最终创建成功');
            this.setupGame(finalRoom.id, 'red');
            
        } catch (error) {
            console.error('全部失败:', error);
            this.showError('连接错误，请刷新重试');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-play"></i> Join Game';
        }
    }
    
    setupGame(roomId, color) {
        console.log('设置游戏:', roomId, color);
        
        this.roomId = roomId;
        this.playerColor = color;
        
        if (color === 'red') {
            this.updateStatus('✅ 你是红方！等待对手...');
        } else {
            this.updateStatus('✅ 你是黄方！游戏开始！');
        }
        
        this.updateUI();
        this.subscribeToRoom();
    }
    
    subscribeToRoom() {
        if (!this.roomId) return;
        
        console.log('订阅房间:', this.roomId);
        
        this.supabase
            .channel(`simple-room-${this.roomId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'game_rooms',
                filter: `id=eq.${this.roomId}`
            }, (payload) => {
                console.log('房间更新:', payload.new);
                if (this.playerColor === 'red' && payload.new.game_status === 'playing') {
                    this.updateStatus('🎮 对手已加入！红方先手');
                }
            })
            .subscribe();
    }
    
    createEmptyBoard() {
        const board = [];
        for (let i = 0; i < 6; i++) {
            board[i] = [0, 0, 0, 0, 0, 0, 0];
        }
        return board;
    }
    
    updateUI() {
        const btn = document.getElementById('joinGameBtn');
        btn.innerHTML = '<i class="fas fa-user-check"></i> 游戏中';
        btn.disabled = true;
        
        document.getElementById('resetGameBtn').disabled = false;
        
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
        console.log('状态更新:', msg);
        document.getElementById('gameStatus').innerHTML = `<h2>${msg}</h2>`;
    }
    
    showError(msg) {
        console.error('显示错误:', msg);
        document.getElementById('gameStatus').innerHTML = `<h2 style="color: red;">❌ ${msg}</h2>`;
    }
    
    async resetGame() {
        if (!this.roomId) return;
        
        try {
            await this.supabase
                .from('game_rooms')
                .update({
                    board_state: JSON.stringify(this.createEmptyBoard()),
                    current_player: 1,
                    game_status: 'playing'
                })
                .eq('id', this.roomId);
            
            this.updateStatus('🔄 游戏重置！红方开始');
        } catch (error) {
            this.showError('重置失败');
        }
    }
}

// 启动
console.log('加载Connect 4游戏...');
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM就绪，启动游戏');
    window.game = new Connect4Working();
});