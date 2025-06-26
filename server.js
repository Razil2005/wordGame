const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Test route
app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-join.html'));
});

// Game state
const rooms = new Map();
const players = new Map();

// Sample words with hints
const wordList = [
    {
        word: "JAVASCRIPT",
        hints: ["Programming language", "Runs in browsers", "Used for web development", "Created by Brendan Eich"]
    },
    {
        word: "RAINBOW",
        hints: ["Appears after rain", "Has seven colors", "Arc in the sky", "ROYGBIV"]
    },
    {
        word: "ELEPHANT",
        hints: ["Large mammal", "Has a trunk", "Never forgets", "Lives in Africa and Asia"]
    },
    {
        word: "COMPUTER",
        hints: ["Electronic device", "Processes data", "Has keyboard and monitor", "Used for calculations"]
    },
    {
        word: "BUTTERFLY",
        hints: ["Flying insect", "Has colorful wings", "Starts as a caterpillar", "Undergoes metamorphosis"]
    },
    {
        word: "MOUNTAIN",
        hints: ["Tall landform", "Higher than hills", "Can be climbed", "Often snow-capped"]
    },
    {
        word: "GUITAR",
        hints: ["Musical instrument", "Has strings", "Can be acoustic or electric", "Played with fingers or pick"]
    },
    {
        word: "OCEAN",
        hints: ["Large body of water", "Covers most of Earth", "Home to whales", "Has waves and tides"]
    }
];

class GameRoom {
    constructor(id, hostId) {
        this.id = id;
        this.hostId = hostId;
        this.players = new Map();
        this.currentWord = null;
        this.currentHints = [];
        this.guessedLetters = new Set();
        this.correctLetters = new Set();
        this.gameState = 'waiting'; // waiting, playing, finished
        this.currentGuesser = null;
        this.maxHealth = 6;        this.currentHealth = this.maxHealth;
        this.wordMask = '';
        this.winner = null;
        this.winnerName = null;
    }

    addPlayer(playerId, playerName) {
        this.players.set(playerId, {
            id: playerId,
            name: playerName,
            score: 0,
            isHost: playerId === this.hostId
        });
    }

    removePlayer(playerId) {
        this.players.delete(playerId);
        if (playerId === this.hostId && this.players.size > 0) {
            // Transfer host to another player
            const newHost = this.players.keys().next().value;
            this.hostId = newHost;
            this.players.get(newHost).isHost = true;
        }
    }    startGame() {
        if (this.players.size < 1) return false; // Allow single player for testing
        
        // Select random word
        const randomIndex = Math.floor(Math.random() * wordList.length);
        const selectedWord = wordList[randomIndex];
        
        this.currentWord = selectedWord.word.toUpperCase();
        this.currentHints = selectedWord.hints;
        this.guessedLetters.clear();
        this.correctLetters.clear();
        this.gameState = 'playing';
        this.currentHealth = this.maxHealth;
        this.updateWordMask();
        
        return true;
    }

    updateWordMask() {
        this.wordMask = this.currentWord
            .split('')
            .map(letter => {
                if (letter === ' ') return ' ';
                return this.correctLetters.has(letter) ? letter : '_';
            })
            .join(' ');
    }    guessLetter(letter) {
        letter = letter.toUpperCase();
        
        if (this.guessedLetters.has(letter)) {
            return { success: false, message: 'Letter already guessed' };
        }
        
        this.guessedLetters.add(letter);
        
        if (this.currentWord.includes(letter)) {
            this.correctLetters.add(letter);
            this.updateWordMask();
            
            // Check if word is complete
            const isComplete = this.currentWord.split('').every(l => 
                l === ' ' || this.correctLetters.has(l)
            );
            
            if (isComplete) {
                this.gameState = 'finished';
                this.winner = 'guessers';
                return { success: true, correct: true, gameWon: true };
            }
            
            return { success: true, correct: true, gameWon: false };
        } else {
            this.currentHealth--;
            
            if (this.currentHealth <= 0) {
                this.gameState = 'finished';
                this.winner = 'host';
                return { success: true, correct: false, gameOver: true };
            }
            
            return { success: true, correct: false, gameOver: false };
        }
    }    guessWord(word, playerId) {
        word = word.toUpperCase().trim();
        
        if (word === this.currentWord) {
            this.gameState = 'finished';
            this.winner = 'guessers';
            this.winnerName = this.players.get(playerId)?.name || 'Unknown Player';
            return { success: true, correct: true, gameWon: true, isWordGuess: true, winner: this.winnerName };
        } else {
            this.currentHealth--;
            
            if (this.currentHealth <= 0) {
                this.gameState = 'finished';
                this.winner = 'host';
                return { success: true, correct: false, gameOver: true, isWordGuess: true };
            }
            
            return { success: true, correct: false, gameOver: false, isWordGuess: true };
        }
    }    getGameState() {
        return {
            id: this.id,
            players: Array.from(this.players.values()),
            gameState: this.gameState,
            wordMask: this.wordMask,
            hints: this.currentHints,
            guessedLetters: Array.from(this.guessedLetters),
            currentHealth: this.currentHealth,
            maxHealth: this.maxHealth,
            winner: this.winner,
            winnerName: this.winnerName,
            currentWord: this.gameState === 'finished' ? this.currentWord : null
        };
    }
}

// Socket.io connections
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Store player info
    socket.on('setPlayerName', (playerName) => {
        players.set(socket.id, { name: playerName, roomId: null });
        socket.emit('playerSet', { playerId: socket.id, playerName });
    });

    // Create room
    socket.on('createRoom', () => {
        const roomId = uuidv4().substr(0, 6).toUpperCase();
        const player = players.get(socket.id);
        
        if (!player) {
            socket.emit('error', 'Please set your name first');
            return;
        }

        const room = new GameRoom(roomId, socket.id);
        room.addPlayer(socket.id, player.name);
        rooms.set(roomId, room);
        
        player.roomId = roomId;
        socket.join(roomId);
        
        socket.emit('roomCreated', { roomId, gameState: room.getGameState() });
    });    // Join room
    socket.on('joinRoom', (roomId) => {
        console.log('Join room request:', roomId, 'from:', socket.id);
        const room = rooms.get(roomId);
        let player = players.get(socket.id);
        
        if (!room) {
            console.log('Room not found:', roomId);
            socket.emit('error', 'Room not found');
            return;
        }
        
        // If player not found, create a temporary one
        if (!player) {
            console.log('Player not found, creating temporary player');
            // Create a temporary player
            player = { name: 'Guest', roomId: null };
            players.set(socket.id, player);
        }

        console.log('Adding player to room...');
        // Allow joining even during gameplay - no restrictions
        room.addPlayer(socket.id, player.name);
        player.roomId = roomId;
        socket.join(roomId);
        
        // Get current game state
        const currentGameState = room.getGameState();        console.log('Sending roomJoined event to:', socket.id);
        // Send success response to the joining player multiple times to ensure delivery
        const roomJoinedData = { 
            roomId, 
            gameState: currentGameState,
            playerName: player.name
        };
        
        socket.emit('roomJoined', roomJoinedData);
        
        // Send again after a short delay to ensure it gets through
        setTimeout(() => {
            socket.emit('roomJoined', roomJoinedData);
        }, 100);
        
        // Also emit a simple test event
        socket.emit('testEvent', { message: 'Test event received' });
        
        console.log('Sending playerJoined to other players in room');
        // Notify all OTHER players in the room (excluding the joining player)
        socket.to(roomId).emit('playerJoined', currentGameState);
        
        console.log('Join room completed for:', player.name);
    });

    // Start game
    socket.on('startGame', () => {
        const player = players.get(socket.id);
        if (!player || !player.roomId) return;
        
        const room = rooms.get(player.roomId);
        if (!room || room.hostId !== socket.id) {
            socket.emit('error', 'Only host can start the game');
            return;
        }
          if (room.startGame()) {
            io.to(player.roomId).emit('gameStarted', room.getGameState());
        } else {
            socket.emit('error', 'Need at least 1 player to start');
        }
    });    // Guess letter or word
    socket.on('guessLetter', (guess) => {
        const player = players.get(socket.id);
        if (!player || !player.roomId) return;
        
        const room = rooms.get(player.roomId);
        if (!room || room.gameState !== 'playing') return;
        
        // Allow all players (including host) to guess in competitive mode
        guess = guess.toUpperCase().trim();
        
        let result;
        if (guess.length === 1) {
            // Single letter guess
            result = room.guessLetter(guess);
        } else {
            // Word guess - pass player ID to track winner
            result = room.guessWord(guess, socket.id);
        }
        
        if (result.success) {
            const eventData = {
                guess,
                correct: result.correct,
                gameState: room.getGameState(),
                gameWon: result.gameWon,
                gameOver: result.gameOver,
                isWordGuess: result.isWordGuess || false,
                winner: result.winner,
                playerName: player.name
            };
            
            io.to(player.roomId).emit('letterGuessed', eventData);
        } else {
            socket.emit('error', result.message);
        }
    });

    // New game
    socket.on('newGame', () => {
        const player = players.get(socket.id);
        if (!player || !player.roomId) return;
        
        const room = rooms.get(player.roomId);
        if (!room || room.hostId !== socket.id) {
            socket.emit('error', 'Only host can start a new game');
            return;
        }
        
        if (room.startGame()) {
            io.to(player.roomId).emit('gameStarted', room.getGameState());
        }
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        const player = players.get(socket.id);
        if (player && player.roomId) {
            const room = rooms.get(player.roomId);
            if (room) {
                room.removePlayer(socket.id);
                
                if (room.players.size === 0) {
                    rooms.delete(player.roomId);
                } else {
                    io.to(player.roomId).emit('playerLeft', room.getGameState());
                }
            }
        }
        
        players.delete(socket.id);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});
