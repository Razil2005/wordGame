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
        this.gameState = 'waiting'; // waiting, word-setting, playing, finished
        this.currentWordSetter = null; // Player who sets the current word
        this.currentRound = 1;
        this.maxHealth = 6;
        this.currentHealth = this.maxHealth;
        this.wordMask = '';
        this.winner = null;
        this.winnerName = null;
        this.playerOrder = []; // Order of players for turn rotation
        this.currentTurnIndex = 0;
        this.roundHistory = []; // Track who has set words
    }

    addPlayer(playerId, playerName) {
        // Always set/update the player (this will replace if already exists)
        this.players.set(playerId, {
            id: playerId,
            name: playerName,
            score: 0,
            isHost: playerId === this.hostId
        });
        
        // Update player order for turn rotation
        this.updatePlayerOrder();
        
        console.log(`Player ${playerName} (${playerId}) added/updated in room ${this.id}. Total players: ${this.players.size}`);
    }

    removePlayer(playerId) {
        this.players.delete(playerId);
        if (playerId === this.hostId && this.players.size > 0) {
            // Transfer host to another player
            const newHost = this.players.keys().next().value;
            this.hostId = newHost;
            this.players.get(newHost).isHost = true;
        }
        
        // Update player order
        this.updatePlayerOrder();
        
        // If current word setter left, reset the round
        if (playerId === this.currentWordSetter) {
            this.resetRound();
        }
    }

    updatePlayerOrder() {
        this.playerOrder = Array.from(this.players.keys());
        // Ensure current turn index is valid
        if (this.currentTurnIndex >= this.playerOrder.length) {
            this.currentTurnIndex = 0;
        }
    }

    getCurrentWordSetter() {
        if (this.playerOrder.length === 0) return null;
        return this.playerOrder[this.currentTurnIndex];
    }

    nextTurn() {
        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.playerOrder.length;
        this.currentRound++;
        this.resetRound();
    }

    resetRound() {
        this.currentWord = null;
        this.currentHints = [];
        this.guessedLetters.clear();
        this.correctLetters.clear();
        this.currentHealth = this.maxHealth;
        this.wordMask = '';
        this.winner = null;
        this.winnerName = null;
        this.gameState = 'word-setting';
        this.currentWordSetter = this.getCurrentWordSetter();
    }
    
    startGame() {
        if (this.players.size < 2) return false; // Need at least 2 players for turn-based
        
        // Initialize turn-based system
        this.updatePlayerOrder();
        this.currentTurnIndex = 0;
        this.currentRound = 1;
        this.resetRound();
        
        console.log(`🎮 Turn-based game started! Player order:`, this.playerOrder.map(id => this.players.get(id).name));
        console.log(`Round ${this.currentRound}: ${this.players.get(this.currentWordSetter).name} will set the word`);
        
        return true;
    }

    setWordAndHints(word, hints, setterId) {
        if (setterId !== this.currentWordSetter) {
            return { success: false, message: 'Not your turn to set the word' };
        }
        
        if (this.gameState !== 'word-setting') {
            return { success: false, message: 'Word has already been set for this round' };
        }
        
        if (!word || !hints || hints.length < 1) {
            return { success: false, message: 'Word and at least one hint required' };
        }
        
        this.currentWord = word.toUpperCase().trim();
        this.currentHints = hints;
        this.gameState = 'playing';
        this.updateWordMask();
        
        console.log(`📝 Word set by ${this.players.get(setterId).name}: "${this.currentWord}" with ${hints.length} hints`);
        
        return { success: true };
    }

    updateWordMask() {
        this.wordMask = this.currentWord
            .split('')
            .map(letter => {
                if (letter === ' ') return ' ';
                return this.correctLetters.has(letter) ? letter : '_';
            })
            .join(' ');
    }
    
    guessLetter(letter, playerId) {
        letter = letter.toUpperCase();
        
        // Word setter cannot guess their own word
        if (playerId === this.currentWordSetter) {
            return { success: false, message: 'You cannot guess your own word!' };
        }
        
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
                this.winnerName = this.players.get(playerId)?.name || 'Unknown Player';
                
                // Give points
                const guesser = this.players.get(playerId);
                const wordSetter = this.players.get(this.currentWordSetter);
                if (guesser) guesser.score += 10;
                if (wordSetter) wordSetter.score += 5;
                
                return { 
                    success: true, 
                    correct: true, 
                    gameWon: true, 
                    winner: this.winnerName,
                    roundComplete: true
                };
            }
            
            return { success: true, correct: true, gameWon: false };
        } else {
            this.currentHealth--;
            console.log(`Incorrect letter. Health: ${this.currentHealth}/${this.maxHealth}`);
            
            // Don't end game when health reaches 0 - keep playing until someone gets the word
            return { success: true, correct: false, gameOver: false };
        }
    }    guessWord(word, playerId) {
        word = word.toUpperCase().trim();
        console.log(`Player ${playerId} guessing word: "${word}" vs current word: "${this.currentWord}"`);
        console.log(`Word lengths: guess=${word.length}, actual=${this.currentWord.length}`);
        console.log(`Character codes - guess:`, Array.from(word).map(c => c.charCodeAt(0)));
        console.log(`Character codes - actual:`, Array.from(this.currentWord).map(c => c.charCodeAt(0)));
        console.log(`Word comparison: "${word}" === "${this.currentWord}" = ${word === this.currentWord}`);
        
        // Word setter cannot guess their own word
        if (playerId === this.currentWordSetter) {
            return { success: false, message: 'You cannot guess your own word!' };
        }
        
        if (word === this.currentWord) {
            this.gameState = 'finished';
            this.winner = 'guessers';
            this.winnerName = this.players.get(playerId)?.name || 'Unknown Player';
            
            // Give points to the guesser and word setter
            const guesser = this.players.get(playerId);
            const wordSetter = this.players.get(this.currentWordSetter);
            if (guesser) guesser.score += 10; // Points for guessing correctly
            if (wordSetter) wordSetter.score += 5; // Points for setting a good word
            
            console.log(`✅ Correct guess! Winner: ${this.winnerName}`);
            return { 
                success: true, 
                correct: true, 
                gameWon: true, 
                isWordGuess: true, 
                winner: this.winnerName,
                roundComplete: true
            };
        } else {
            // Incorrect word guess - just mark as incorrect but don't end game or reduce health
            console.log(`❌ Incorrect word guess: "${word}" - game continues`);
            return { success: true, correct: false, gameOver: false, isWordGuess: true };
        }
    }
    
    getGameState() {
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
            currentWord: this.gameState === 'finished' ? this.currentWord : null,
            currentWordSetter: this.currentWordSetter,
            currentWordSetterName: this.currentWordSetter ? this.players.get(this.currentWordSetter)?.name : null,
            currentRound: this.currentRound,
            playerOrder: this.playerOrder,
            isWordSettingPhase: this.gameState === 'word-setting'
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

        console.log('Adding player to room...', player.name);
        
        // Check if player is already in this room
        if (room.players.has(socket.id)) {
            console.log('Player already in room, updating instead of adding');
        }
        
        // Add player to room (this will update if already exists)
        room.addPlayer(socket.id, player.name);
        player.roomId = roomId;
        socket.join(roomId);
        
        // Get current game state
        const currentGameState = room.getGameState();
        console.log('Current room state - players:', currentGameState.players.length);

        console.log('Sending roomJoined event to:', socket.id);
        // Send success response to the joining player
        const roomJoinedData = { 
            roomId, 
            gameState: currentGameState,
            playerName: player.name
        };
        
        socket.emit('roomJoined', roomJoinedData);
        
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
            socket.emit('error', 'Need at least 2 players to start turn-based game');
        }
    });

    // Set word and hints for current round
    socket.on('setWordAndHints', (data) => {
        const player = players.get(socket.id);
        if (!player || !player.roomId) return;
        
        const room = rooms.get(player.roomId);
        if (!room) return;
        
        const result = room.setWordAndHints(data.word, data.hints, socket.id);
        
        if (result.success) {
            // Notify all players that word has been set and round can begin
            io.to(player.roomId).emit('wordSet', {
                gameState: room.getGameState(),
                wordSetterName: player.name
            });
        } else {
            socket.emit('error', result.message);
        }
    });

    // Next round
    socket.on('nextRound', () => {
        const player = players.get(socket.id);
        if (!player || !player.roomId) return;
        
        const room = rooms.get(player.roomId);
        if (!room || room.hostId !== socket.id) {
            socket.emit('error', 'Only host can start next round');
            return;
        }
        
        room.nextTurn();
        io.to(player.roomId).emit('gameStarted', room.getGameState());
    });    // Guess letter or word
    socket.on('guessLetter', (guess) => {
        const player = players.get(socket.id);
        if (!player || !player.roomId) return;
        
        const room = rooms.get(player.roomId);
        if (!room || room.gameState !== 'playing') return;
        
        guess = guess.toUpperCase().trim();
        console.log(`Guess received from ${player.name} (${socket.id}): "${guess}"`);
        
        let result;
        if (guess.length === 1) {
            // Single letter guess
            console.log('Processing single letter guess');
            result = room.guessLetter(guess, socket.id);
        } else {
            // Word guess - pass player ID to track winner
            console.log('Processing word guess');
            result = room.guessWord(guess, socket.id);
        }
        
        console.log('Guess result:', result);
        
        if (result.success) {
            const eventData = {
                guess,
                correct: result.correct,
                gameState: room.getGameState(),
                gameWon: result.gameWon,
                gameOver: result.gameOver,
                isWordGuess: result.isWordGuess || false,
                winner: result.winner,
                playerName: player.name,
                roundComplete: result.roundComplete || false
            };
            
            console.log('Sending letterGuessed event to room:', eventData);
            // Send to ALL players in the room (including the guesser)
            io.to(player.roomId).emit('letterGuessed', eventData);
            
            // If round is complete, send special event
            if (result.roundComplete) {
                console.log(`🏆 Round complete! Winner: ${result.winner}`);
                io.to(player.roomId).emit('roundComplete', {
                    winnerName: result.winner,
                    winningWord: guess,
                    gameState: room.getGameState(),
                    message: `🏆 ${result.winner} won Round ${room.currentRound}! 🏆`
                });
            }
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
