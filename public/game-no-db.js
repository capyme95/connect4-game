// Connect 4 - 纯前端版本（无需数据库）
class Connect4NoDB {
    constructor() {
        this.playerColor = null;
        this.currentTurn = 'red';
        this.board = this.createBoard();
        this.gameActive = false;
        this.roomId = null;
        
        this.init();
    }
    
    init() {
        this.renderBoard();
        this.setupEvents();
        this.updateStatus('点击 "开始游戏"');
    }
    
    createBoard() {
        const board = [];
        for (let r = 0; r < 6; r++) {
            board[r] = Array(7).fill(0);
        }
        return board;
    }
    
    setupEvents() {
        document.getElementById('joinGameBtn').onclick = () => this.startGame();
        document.getElementById('resetGameBtn').onclick = () => this.resetGame();
        
        document.getElementById('gameBoard').onclick = (e) => {
            const cell = e.target.closest('.cell');
            if (cell && this.gameActive) {
                const col = +cell.dataset.col;
                this.makeMove(col);
            }
        };
    }
    
    startGame() {
        this.playerColor = 'red';
        this.gameActive = true;
        this.roomId = 'room_' + Math.random().toString(36).substr(2, 9);
        
        document.getElementById('joinGameBtn').disabled = true;
        document.getElementById('resetGameBtn').disabled = false;
        
        this.updateStatus('你是红方，等待黄方...');
        this.updateUI();
    }
    
    makeMove(col) {
        if (!this.gameActive || this.currentTurn !== this.playerColor) return;
        
        for (let row = 5; row >= 0; row--) {
            if (this.board[row][col] === 0) {
                this.board[row][col] = this.playerColor === 'red' ? 1 : 2;
                this.renderBoard();
                
                if (this.checkWin(row, col)) {
                    this.updateStatus(`${this.playerColor === 'red' ? '红方' : '黄方'} 获胜！`);
                    this.gameActive = false;
                    return;
                }
                
                this.currentTurn = this.currentTurn === 'red' ? 'yellow' : 'red';
                this.updateUI();
                return;
            }
        }
    }
    
    checkWin(row, col) {
        const player = this.board[row][col];
        const dirs = [[0,1],[1,0],[1,1],[1,-1]];
        
        for (const [dx, dy] of dirs) {
            let count = 1;
            for (let i = 1; i < 4; i++) {
                const r = row + dx * i, c = col + dy * i;
                if (r >= 0 && r < 6 && c >= 0 && c < 7 && this.board[r][c] === player) count++;
                else break;
            }
            for (let i = 1; i < 4; i++) {
                const r = row - dx * i, c = col - dy * i;
                if (r >= 0 && r < 6 && c >= 0 && c < 7 && this.board[r][c] === player) count++;
                else break;
            }
            if (count >= 4) return true;
        }
        return false;
    }
    
    resetGame() {
        this.board = this.createBoard();
        this.currentTurn = 'red';
        this.gameActive = true;
        this.renderBoard();
        this.updateStatus('游戏重置，红方开始');
        this.updateUI();
    }
    
    renderBoard() {
        const boardEl = document.getElementById('gameBoard');
        let html = '';
        
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 7; col++) {
                const val = this.board[row][col];
                let cls = 'cell';
                if (val === 1) cls += ' red';
                if (val === 2) cls += ' yellow';
                
                html += `<div class="${cls}" data-row="${row}" data-col="${col}">
                    ${val ? '<div class="piece"></div>' : ''}
                </div>`;
            }
        }
        
        boardEl.innerHTML = html;
    }
    
    updateUI() {
        document.getElementById('currentPlayer').innerHTML = 
            `<span class="player-dot ${this.currentTurn}"></span>
             <span>${this.currentTurn === 'red' ? '红方回合' : '黄方回合'}</span>`;
        
        document.getElementById('roomId').textContent = 
            this.roomId ? this.roomId.substring(0, 8) + '...' : '-';
    }
    
    updateStatus(msg) {
        document.getElementById('gameStatus').innerHTML = `<h2>${msg}</h2>`;
    }
}

// 启动游戏
new Connect4NoDB();