// Connect 4 - 调试版本
console.log('游戏脚本加载...');

class Connect4Debug {
    constructor() {
        console.log('构造函数调用');
        this.supabaseUrl = 'https://ffbqmickfvdnywjmnblo.supabase.co';
        this.supabaseKey = 'sb_publishable_B2DZvbChkjt834lzGM2EzQ_NUlZkqVE';
        this.supabase = null;
        this.gameActive = false;
        
        this.init();
    }
    
    init() {
        console.log('初始化开始');
        
        try {
            if (typeof supabase === 'undefined') {
                console.error('Supabase未定义');
                this.showError('Supabase库未加载');
                return;
            }
            
            console.log('创建Supabase客户端...');
            this.supabase = supabase.createClient(this.supabaseUrl, this.supabaseKey);
            console.log('Supabase客户端创建成功');
            
            this.setupEvents();
            this.updateStatus('就绪');
            
        } catch (error) {
            console.error('初始化错误:', error);
            this.showError('初始化失败: ' + error.message);
        }
    }
    
    setupEvents() {
        console.log('设置事件监听器');
        
        const joinBtn = document.getElementById('joinGameBtn');
        if (!joinBtn) {
            console.error('找不到Join Game按钮');
            return;
        }
        
        joinBtn.addEventListener('click', () => {
            console.log('Join Game按钮点击');
            this.joinGame();
        });
        
        console.log('事件监听器设置完成');
    }
    
    async joinGame() {
        console.log('加入游戏函数调用');
        
        try {
            // 测试Supabase连接
            console.log('测试Supabase连接...');
            const { data, error } = await this.supabase
                .from('game_rooms')
                .select('count')
                .limit(1);
            
            if (error) {
                console.error('Supabase查询错误:', error);
                this.showError('数据库错误: ' + error.message);
                return;
            }
            
            console.log('Supabase连接成功');
            
            // 创建游戏
            const playerId = 'player_' + Math.random().toString(36).substr(2, 9);
            const { data: room, error: createError } = await this.supabase
                .from('game_rooms')
                .insert({
                    player1_id: playerId,
                    player1_name: 'Player',
                    game_status: 'waiting'
                })
                .select()
                .single();
            
            if (createError) {
                console.error('创建游戏错误:', createError);
                this.showError('创建游戏失败: ' + createError.message);
                return;
            }
            
            console.log('游戏创建成功:', room.id);
            this.gameActive = true;
            this.updateStatus('游戏已创建！等待对手...');
            
            // 启用重置按钮
            document.getElementById('resetGameBtn').disabled = false;
            
        } catch (error) {
            console.error('加入游戏错误:', error);
            this.showError('错误: ' + error.message);
        }
    }
    
    updateStatus(msg) {
        const statusEl = document.getElementById('gameStatus');
        if (statusEl) {
            statusEl.innerHTML = `<h2>${msg}</h2>`;
        }
    }
    
    showError(msg) {
        console.error('显示错误:', msg);
        const statusEl = document.getElementById('gameStatus');
        if (statusEl) {
            statusEl.innerHTML = `<h2 style="color: red;">❌ ${msg}</h2>`;
        }
    }
}

// 启动
console.log('准备启动游戏...');
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，启动游戏');
    window.game = new Connect4Debug();
});