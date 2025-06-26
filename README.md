# 🎯 Guess the Word - Multiplayer Game

A real-time multiplayer word guessing game similar to Hangman, built with Node.js, Express, Socket.io, and vanilla JavaScript.

## 🎮 Game Features

- **Real-time Multiplayer**: Play with friends in real-time using Socket.io
- **Room System**: Create or join game rooms with unique codes
- **Health System**: Lives decrease with each wrong letter guess (like Hangman)
- **Word Hints**: Get helpful hints to guess the word
- **Modern UI**: Beautiful, responsive design that works on all devices
- **Player Roles**: Host and guest player management
- **Live Updates**: See guessed letters and game progress in real-time

## 🚀 How to Play

1. **Start**: Enter your name on the welcome screen
2. **Create/Join Room**: 
   - Create a new room (you become the host)
   - Or join an existing room with a 6-character code
3. **Wait for Players**: At least 2 players needed to start
4. **Play**: 
   - Host starts the game
   - Players guess letters one by one
   - Wrong guesses reduce health (hearts)
   - Correct guesses reveal letters in the word
5. **Win/Lose**: 
   - Win by guessing the complete word
   - Lose when health reaches zero

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation Steps

1. **Clone/Download** the project files

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Server**:
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Open Game**: 
   Open your browser and go to `http://localhost:3000`

## 📁 Project Structure

```
guess-the-word-multiplayer/
├── server.js              # Main server file with game logic
├── package.json           # Project dependencies and scripts
├── public/                # Frontend files
│   ├── index.html        # Main HTML file
│   ├── style.css         # Styles and responsive design
│   └── script.js         # Client-side game logic
└── .github/
    └── copilot-instructions.md
```

## 🎯 Game Mechanics

### Word Selection
- 8 pre-loaded words with hints
- Random selection for each game
- Words include: JAVASCRIPT, RAINBOW, ELEPHANT, COMPUTER, BUTTERFLY, MOUNTAIN, GUITAR, OCEAN

### Health System
- Start with 6 hearts (health points)
- Each wrong letter guess removes 1 heart
- Game over when all hearts are lost

### Multiplayer Features
- Room-based gameplay with unique codes
- Host can start games and create new rounds
- Real-time synchronization of all game events
- Automatic host transfer if original host leaves

## 🔧 Technical Details

### Backend (Node.js)
- **Express**: Web server framework
- **Socket.io**: Real-time bidirectional communication
- **UUID**: Unique room code generation
- Game state management for multiple rooms

### Frontend (Vanilla JavaScript)
- **Socket.io Client**: Real-time server communication
- **Modern CSS**: Flexbox/Grid layouts, animations
- **Responsive Design**: Mobile-friendly interface
- **ES6+ JavaScript**: Clean, modern code structure

### Socket Events
- `setPlayerName` - Set player name
- `createRoom` - Create new game room
- `joinRoom` - Join existing room
- `startGame` - Begin game (host only)
- `guessLetter` - Make letter guess
- `newGame` - Start new round (host only)

## 🎨 UI Features

- **Beautiful Gradient Backgrounds**
- **Smooth Animations & Transitions**
- **Responsive Design** (mobile-friendly)
- **Real-time Notifications**
- **Heart-based Health Display**
- **Modern Typography** (Google Fonts)

## 🚀 Running the Game

### Development Mode
```bash
npm run dev
```
Uses nodemon for automatic server restarts during development.

### Production Mode
```bash
npm start
```
Runs the server in production mode.

### Accessing the Game
- **Local**: http://localhost:3000
- **Network**: http://[your-ip]:3000 (for multiplayer across devices)

## 🎮 Game Flow

1. **Welcome Screen**: Enter name, choose create/join room
2. **Room Lobby**: Wait for players, see room code
3. **Game Screen**: Word display, hints, letter input, health
4. **Game Over**: Results, option for new game

## 🌟 Features in Detail

### Real-time Multiplayer
- Instant updates when letters are guessed
- Live player list with host indicators
- Synchronized game state across all clients

### Room Management
- 6-character unique room codes
- Easy room sharing via copy button
- Automatic cleanup of empty rooms

### Game Logic
- Fair letter guessing system
- Comprehensive word validation
- Win/lose condition handling

## 🎯 Future Enhancements

Potential features that could be added:
- Custom word lists
- Difficulty levels
- Player scoring system
- Chat functionality
- Spectator mode
- Tournament brackets

## 🐛 Troubleshooting

### Common Issues
1. **Port Already in Use**: Change PORT in server.js or set environment variable
2. **Connection Issues**: Check firewall settings for local network play
3. **Browser Compatibility**: Use modern browsers (Chrome, Firefox, Safari, Edge)

### Performance Tips
- Use latest Node.js version
- Ensure stable internet connection for smooth multiplayer experience

## 📝 License

MIT License - Feel free to modify and distribute.

## 🎉 Enjoy Playing!

Have fun playing Guess the Word with your friends! Create rooms, share codes, and see who can guess the words fastest while managing their health wisely.
