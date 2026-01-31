# 🎮 Connect 4 Game

A real-time multiplayer Connect 4 game built with **Supabase** and **Vercel**.

## 🚀 Live Demo

[Play Now](https://connect4.vercel.app) *(部署后更新此链接)*

## ✨ Features

- ✅ **Real-time multiplayer** - Play with friends in real-time
- ✅ **Supabase Realtime** - Live updates without WebSocket setup
- ✅ **Responsive design** - Works on mobile and desktop
- ✅ **Chat system** - In-game chat between players
- ✅ **Win animations** - Celebration effects for winners
- ✅ **Game persistence** - Games saved in Supabase database

## 🏗️ Architecture

```
Frontend (Vercel) → Supabase API → PostgreSQL Database
        ↖________ Realtime ________↗
```

- **Frontend**: HTML/CSS/JavaScript + Supabase Client
- **Backend**: Node.js + Express (Vercel Serverless Functions)
- **Database**: Supabase PostgreSQL with Realtime
- **Hosting**: Vercel (Global CDN)

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime
- **Hosting**: Vercel
- **Styling**: Custom CSS with animations

## 📦 Installation & Deployment

### Prerequisites
- GitHub account
- Vercel account (free)
- Supabase account (free)

### Quick Deployment

1. **Create GitHub Repository**
   ```bash
   # Clone this repository
   git clone https://github.com/yourusername/connect4-game.git
   cd connect4-game
   ```

2. **Deploy to Vercel**
   - Visit https://vercel.com/new
   - Import from GitHub
   - Configure environment variables (see below)

3. **Set up Supabase Database**
   - Run the SQL in `supabase-setup.sql`
   - Enable Realtime for tables

### Environment Variables

Add these to your Vercel project:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=production
```

## 🎮 How to Play

1. **Player 1 (Red)**: Click "Create New Game"
2. **Player 2 (Yellow)**: Enter the Room ID or click "Join Game"
3. **Take turns**: Click on a column to drop your piece
4. **Win**: Connect 4 pieces horizontally, vertically, or diagonally
5. **Chat**: Use the chat box to communicate

## 📁 Project Structure

```
connect4-game/
├── public/              # Frontend files
│   ├── index.html     # Game interface
│   ├── style.css      # Styles
│   └── game-supabase.js # Game logic
├── server-supabase.js  # API server
├── package.json        # Dependencies
├── vercel.json         # Vercel config
├── supabase-setup.sql  # Database schema
└── README.md          # This file
```

## 🔧 Development

### Local Development
```bash
# Install dependencies
npm install

# Start local server
npm start

# Visit http://localhost:3000
```

### API Endpoints
- `GET /health` - Health check
- `POST /api/game/create` - Create new game
- `POST /api/game/join/:roomId` - Join existing game
- `POST /api/game/:roomId/move` - Make a move
- `GET /api/game/waiting` - List waiting games

## 📊 Database Schema

### game_rooms table
- `id` - UUID primary key
- `player1_id`, `player2_id` - Player identifiers
- `board_state` - JSON array of game board
- `game_status` - waiting/playing/red_won/yellow_won/draw
- `current_player` - 1 (red) or 2 (yellow)

### game_moves table
- `room_id` - Foreign key to game_rooms
- `player_id` - Player who made the move
- `col_index`, `row_index` - Position on board
- `created_at` - Timestamp

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ by CapybaraBot 🐹
- Powered by Supabase and Vercel
- Inspired by classic Connect 4 game

## 📞 Support

- **Issues**: GitHub Issues
- **Questions**: Open a discussion
- **Live Help**: Check the deployed game

---

**Enjoy the game!** 🎮