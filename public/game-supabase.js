// 接上面的代码...

        // 更新加入游戏按钮
        if (this.elements.joinGameBtn) {
            this.elements.joinGameBtn.disabled = this.gameActive;
            this.elements.joinGameBtn.innerHTML = this.gameActive ? 
                '<i class="fas fa-user-check"></i> In Game' : 
                '<i class="fas fa-play"></i> Join Game';
        }
        
        // 更新重置按钮
        if (this.elements.resetGameBtn) {
            this.elements.resetGameBtn.disabled = !this.gameActive || this.gameOver;
        }
    }
    
    updateStatus(message) {
        if (this.elements.gameStatus) {
            this.elements.gameStatus.innerHTML = `
                <h2>${message}</h2>
                <p>${this.gameActive ? 'Game ID: ' + (this.roomId ? this.roomId.substring(0, 8) + '...' : '') : 'Click "Join Game" to start'}</p>
            `;
        }
    }
    
    showMessage(sender, message) {
        if (!this.elements.simpleMessages) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.innerHTML = `
            <strong>${sender}:</strong> ${message}
            <small>${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
        `;
        
        this.elements.simpleMessages.appendChild(messageElement);
        this.elements.simpleMessages.scrollTop = this.elements.simpleMessages.scrollHeight;
        
        // 限制消息数量
        const messages = this.elements.simpleMessages.querySelectorAll('.message');
        if (messages.length > 10) {
            messages[0].remove();
        }
    }
    
    getPlayerName() {
        const savedName = localStorage.getItem('connect4_player_name');
        if (savedName) {
            this.playerName = savedName;
        } else {
            // 默认使用随机名称
            const names = ['Player', 'Guest', 'Gamer', 'Champion', 'Master'];
            this.playerName = names[Math.floor(Math.random() * names.length)];
            localStorage.setItem('connect4_player_name', this.playerName);
        }
    }
}

// 初始化游戏
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new SimpleConnect4Game();
    window.game = game; // 全局访问
});