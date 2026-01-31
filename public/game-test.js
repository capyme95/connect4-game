// Connect 4 - 最小测试版本
console.log('测试脚本开始加载...');

// 测试按钮点击
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM已加载');
    
    const joinBtn = document.getElementById('joinGameBtn');
    const statusEl = document.getElementById('gameStatus');
    
    if (!joinBtn) {
        console.error('错误：找不到Join Game按钮');
        return;
    }
    
    console.log('找到按钮，添加点击事件');
    
    joinBtn.onclick = function() {
        console.log('按钮被点击了！');
        statusEl.innerHTML = '<h2>✅ 按钮工作正常！</h2>';
        joinBtn.innerHTML = '<i class="fas fa-check"></i> 已点击';
        joinBtn.disabled = true;
        
        // 测试Supabase
        testSupabase();
    };
    
    console.log('初始化完成，等待点击...');
    statusEl.innerHTML = '<h2>点击按钮测试</h2>';
});

// 测试Supabase连接
async function testSupabase() {
    console.log('测试Supabase连接...');
    const statusEl = document.getElementById('gameStatus');
    
    try {
        // 检查supabase是否加载
        if (typeof supabase === 'undefined') {
            console.error('Supabase未定义');
            statusEl.innerHTML = '<h2 style="color: red;">❌ Supabase库未加载</h2>';
            return;
        }
        
        console.log('Supabase已加载，创建客户端...');
        
        // 创建客户端
        const supabaseClient = supabase.createClient(
            'https://ffbqmickfvdnywjmnblo.supabase.co',
            'sb_publishable_B2DZvbChkjt834lzGM2EzQ_NUlZkqVE'
        );
        
        console.log('客户端创建成功，测试查询...');
        statusEl.innerHTML = '<h2>测试数据库连接...</h2>';
        
        // 简单查询测试
        const { data, error } = await supabaseClient
            .from('game_rooms')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('查询错误:', error);
            statusEl.innerHTML = `<h2 style="color: red;">❌ 数据库错误: ${error.message}</h2>`;
            return;
        }
        
        console.log('查询成功:', data);
        statusEl.innerHTML = '<h2 style="color: green;">✅ 所有测试通过！</h2>';
        
    } catch (error) {
        console.error('测试失败:', error);
        statusEl.innerHTML = `<h2 style="color: red;">❌ 测试失败: ${error.message}</h2>`;
    }
}

console.log('测试脚本加载完成');