class GameClient {
    constructor() {
        console.log('GameClient constructor called');
        
        this.socket = io({
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            timeout: 20000
        });
        
        this.currentScreen = 'welcome';
        this.playerName = '';
        this.roomId = '';
        this.isHost = false;
        this.gameState = null;
        
        this.initializeElements();
        this.bindEvents();
        this.setupSocketListeners();
    }

    initializeElements() {
        console.log('Initializing elements...');
        
        // Screens
        this.screens = {
            welcome: document.getElementById('welcomeScreen'),
            joinRoom: document.getElementById('joinRoomScreen'),
            gameRoom: document.getElementById('gameRoomScreen')
        };

        // Welcome screen elements
        this.playerNameInput = document.getElementById('playerNameInput');
        this.createRoomBtn = document.getElementById('createRoomBtn');
        this.joinRoomBtn = document.getElementById('joinRoomBtn');
        this.testConnectionBtn = document.getElementById('testConnectionBtn');

        // Join room screen elements
        this.roomCodeInput = document.getElementById('roomCodeInput');
        this.joinGameBtn = document.getElementById('joinGameBtn');
        this.backToWelcomeBtn = document.getElementById('backToWelcomeBtn');        // Game room elements  
        this.roomCodeDisplay = document.getElementById('roomCode');
        this.copyRoomCodeBtn = document.getElementById('copyRoomCodeBtn');
        this.playersDisplay = document.getElementById('playersList');
        this.heartsDisplay = document.getElementById('heartsDisplay');
        this.startGameBtn = document.getElementById('startGameBtn');
        
        // Gameplay elements
        this.wordDisplay = document.getElementById('wordMask');
        this.hintsList = document.getElementById('hintsList');
        this.letterInput = document.getElementById('letterInput');
        this.guessBtn = document.getElementById('guessBtn');
        this.guessedLettersDisplay = document.getElementById('guessedLettersDisplay');
        this.letterInputSection = document.getElementById('letterInputSection');
        
        // Game over elements
        this.newGameBtn = document.getElementById('newGameBtn');
        this.leaveRoomBtn = document.getElementById('leaveRoomBtn');
        
        // Legacy elements (for compatibility)
        this.guessInput = document.getElementById('letterInput'); // Use letterInput as guessInput
        this.submitGuessBtn = document.getElementById('guessBtn'); // Use guessBtn as submitGuessBtn
        this.hintDisplay = document.getElementById('hintsList'); // Use hintsList as hintDisplay
        
        // Notification
        this.notification = document.getElementById('notification');

        console.log('Elements initialized successfully');
    }

    bindEvents() {
        console.log('Binding events...');
        
        // Join Game button - main button we're fixing
        if (this.joinGameBtn) {
            this.joinGameBtn.addEventListener('click', () => {
                console.log('Join Game button clicked!');
                
                // Visual feedback
                this.joinGameBtn.disabled = true;
                this.joinGameBtn.textContent = 'Joining...';
                this.joinGameBtn.style.backgroundColor = '#ccc';
                
                // Call join room function
                this.joinRoom();
                
                // Reset button after 3 seconds if still on join screen
                setTimeout(() => {
                    if (this.currentScreen === 'joinRoom' && this.joinGameBtn) {
                        this.joinGameBtn.disabled = false;
                        this.joinGameBtn.textContent = 'Join Game';
                        this.joinGameBtn.style.backgroundColor = '';
                    }
                }, 3000);
            });
            console.log('Join Game button event listener added');
        } else {
            console.error('joinGameBtn not found!');
        }

        // Create Room button
        if (this.createRoomBtn) {
            this.createRoomBtn.addEventListener('click', () => {
                console.log('Create Room button clicked');
                this.createRoom();
            });
        }
        
        // Join Room button (navigate to join screen)
        if (this.joinRoomBtn) {
            this.joinRoomBtn.addEventListener('click', () => {
                console.log('Join Room button clicked');
                this.showJoinRoomScreen();
            });
        }
        
        // Back to Welcome button
        if (this.backToWelcomeBtn) {
            this.backToWelcomeBtn.addEventListener('click', () => {
                console.log('Back to Welcome button clicked');
                this.showWelcomeScreen();
            });
        }

        // Test Connection button
        if (this.testConnectionBtn) {
            this.testConnectionBtn.addEventListener('click', () => {
                console.log('Test Connection button clicked');
                this.testConnection();
            });
        }

        // Start Game button
        if (this.startGameBtn) {
            this.startGameBtn.addEventListener('click', () => {
                console.log('Start Game button clicked');
                this.startGame();
            });
        }

        // Submit Guess button
        if (this.submitGuessBtn) {
            this.submitGuessBtn.addEventListener('click', () => {
                console.log('Submit Guess button clicked');
                this.submitGuess();
            });
        }

        // Guess button (gameplay)
        if (this.guessBtn) {
            this.guessBtn.addEventListener('click', () => {
                console.log('Guess button clicked');
                this.makeGuess();
            });
        }

        // Enter key for room code input
        if (this.roomCodeInput) {
            this.roomCodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.joinRoom();
                }
            });
        }

        // Enter key for guess input
        if (this.guessInput) {
            this.guessInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.submitGuess();
                }
            });
        }

        // Enter key for letter input (gameplay)
        if (this.letterInput) {
            this.letterInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.makeGuess();
                }
            });
        }

        // Copy room code button
        if (this.copyRoomCodeBtn) {
            this.copyRoomCodeBtn.addEventListener('click', () => {
                console.log('Copy room code button clicked');
                this.copyRoomCode();
            });
        }

        // New Game button
        if (this.newGameBtn) {
            this.newGameBtn.addEventListener('click', () => {
                console.log('New Game button clicked');
                this.startNewGame();
            });
        }

        // Leave Room button
        if (this.leaveRoomBtn) {
            this.leaveRoomBtn.addEventListener('click', () => {
                console.log('Leave Room button clicked');
                this.leaveRoom();
            });
        }

        console.log('All events bound successfully');
    }

    setupSocketListeners() {
        console.log('Setting up socket listeners...');
        
        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket.id);
            this.showNotification('Connected to server!', 'success');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.showNotification('Cannot connect to server. Please start the server first.', 'error');
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            this.showNotification('Disconnected from server', 'error');
        });

        this.socket.on('error', (message) => {
            console.log('Socket error received:', message);
            this.showNotification('Error: ' + message, 'error');
        });        this.socket.on('roomCreated', (data) => {
            console.log('Room created:', data);
            this.roomId = data.roomId;
            this.isHost = true;
            this.gameState = data.gameState; // Store the game state
            this.showGameRoomScreen();
            this.updateGameDisplay(); // Update the display to show players and start button
            this.showNotification('Room created successfully!', 'success');
        });        this.socket.on('roomJoined', (data) => {
            console.log('Room joined successfully:', data);
            
            // Clear join timeout
            if (this.joinTimeout) {
                clearTimeout(this.joinTimeout);
                this.joinTimeout = null;
            }
            
            this.roomId = data.roomId;
            this.isHost = false;
            this.gameState = data.gameState; // Store the game state
            this.showGameRoomScreen();
            this.updateGameDisplay(); // Update the display to show players
            this.showNotification('Successfully joined room!', 'success');
        });

        this.socket.on('playerUpdate', (data) => {
            console.log('Player update:', data);
            // Update the game state with the new players list
            if (this.gameState) {
                this.gameState.players = data.players;
            } else {
                this.gameState = { players: data.players };
            }
            this.updateGameDisplay();
        });

        // Handle when a new player joins the room
        this.socket.on('playerJoined', (gameState) => {
            console.log('Player joined:', gameState);
            // Only update if we're not the joining player and are already in the room
            if (this.currentScreen === 'gameRoom') {
                this.gameState = gameState;
                this.updateGameDisplay();
                this.showNotification('A player joined the room', 'info');
            }
        });

        // Handle when a player leaves the room
        this.socket.on('playerLeft', (gameState) => {
            console.log('Player left:', gameState);
            this.gameState = gameState;
            this.updateGameDisplay();
            this.showNotification('A player left the room', 'info');
        });

        this.socket.on('gameStarted', (data) => {
            console.log('Game started:', data);
            this.gameState = data;
            this.updateGameDisplay();
            this.showNotification('Game started!', 'success');
        });

        this.socket.on('gameUpdate', (data) => {
            console.log('Game update:', data);
            this.gameState = data;
            this.updateGameDisplay();
        });

        this.socket.on('gameEnded', (data) => {
            console.log('Game ended:', data);
            this.showNotification(`Game ended! ${data.message}`, 'info');
        });

        // Handle letter/word guesses
        this.socket.on('letterGuessed', (data) => {
            console.log('Letter guessed response:', data);
            
            // Update game state
            this.gameState = data.gameState;
            this.updateGameDisplay();
            
            // Show result
            if (data.correct) {
                if (data.isWordGuess) {
                    if (data.winner) {
                        this.showNotification(`🎉 ${data.winner} won by guessing "${data.guess}"!`, 'success');
                    } else {
                        this.showNotification(`✅ "${data.guess}" is correct!`, 'success');
                    }
                } else {
                    this.showNotification(`✅ "${data.guess}" is in the word!`, 'success');
                }
                
                if (data.gameWon) {
                    this.showGameOver(true, data.winner);
                }
            } else {
                if (data.isWordGuess) {
                    this.showNotification(`❌ "${data.guess}" is not the word`, 'error');
                } else {
                    this.showNotification(`❌ "${data.guess}" is not in the word`, 'error');
                }
                
                if (data.gameOver) {
                    this.showGameOver(false);
                }
            }
            
            // Update guessed letters display
            this.updateGuessedLetters();
        });
    }    joinRoom() {
        console.log('joinRoom function called');
        
        if (!this.socket.connected) {
            this.showNotification('Not connected to server. Please start the server and refresh the page.', 'error');
            return;
        }
        
        const roomCode = this.roomCodeInput?.value?.trim()?.toUpperCase();
        console.log('Room code:', roomCode);
        
        if (!roomCode) {
            this.showNotification('Please enter a room code', 'error');
            return;
        }
        
        if (roomCode.length !== 6) {
            this.showNotification('Room code must be 6 characters', 'error');
            return;
        }
        
        // Get player name if not set
        if (!this.playerName) {
            const name = this.playerNameInput?.value?.trim();
            if (!name) {
                this.showNotification('Please enter your name first', 'error');
                return;
            }
            this.playerName = name;
        }
        
        console.log('Attempting to join room:', roomCode, 'with name:', this.playerName);
        
        // Set player name first
        this.socket.emit('setPlayerName', this.playerName);
        
        // Add timeout to handle server response
        const timeoutId = setTimeout(() => {
            if (this.currentScreen === 'joinRoom') {
                this.showNotification('Room join timed out. Please check the room code and try again.', 'error');
                // Reset button state
                if (this.joinGameBtn) {
                    this.joinGameBtn.disabled = false;
                    this.joinGameBtn.textContent = 'Join Game';
                    this.joinGameBtn.style.backgroundColor = '';
                }
            }
        }, 5000);
        
        // Store timeout ID to clear it if join succeeds
        this.joinTimeout = timeoutId;
        
        // Emit join room request
        this.socket.emit('joinRoom', roomCode);
        this.showNotification('Attempting to join room...', 'info');
    }

    createRoom() {
        console.log('Create room called');
        
        if (!this.socket.connected) {
            this.showNotification('Not connected to server', 'error');
            return;
        }
        
        const name = this.playerNameInput?.value?.trim();
        if (!name) {
            this.showNotification('Please enter your name', 'error');
            return;
        }
        
        this.playerName = name;
        this.socket.emit('setPlayerName', name);
        this.socket.emit('createRoom');
        this.showNotification('Creating room...', 'info');
    }

    showJoinRoomScreen() {
        const name = this.playerNameInput?.value?.trim();
        if (!name) {
            this.showNotification('Please enter your name first', 'error');
            return;
        }
        
        this.playerName = name;
        this.socket.emit('setPlayerName', name);
        this.showScreen('joinRoom');
    }

    showWelcomeScreen() {
        this.showScreen('welcome');
        this.roomId = '';
        this.isHost = false;
    }    showGameRoomScreen() {
        console.log('Showing game room screen, roomId:', this.roomId, 'isHost:', this.isHost);
        this.showScreen('gameRoom');
        
        if (this.roomCodeDisplay && this.roomId) {
            this.roomCodeDisplay.textContent = this.roomId;
        }
        
        // Force update the game display to show current state
        setTimeout(() => {
            this.updateGameDisplay();
        }, 100);
    }

    showScreen(screenName) {
        console.log('Switching to screen:', screenName);
        
        Object.values(this.screens).forEach(screen => {
            if (screen) screen.classList.remove('active');
        });
        
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
            this.currentScreen = screenName;
        } else {
            console.error('Screen not found:', screenName);
        }
    }

    testConnection() {
        console.log('Testing connection...');
        console.log('Socket connected:', this.socket.connected);
        console.log('Socket ID:', this.socket.id);
        
        if (this.socket.connected) {
            this.showNotification('Connection is working!', 'success');
        } else {
            this.showNotification('Not connected to server', 'error');
        }
    }

    startGame() {
        if (!this.isHost) {
            this.showNotification('Only the host can start the game', 'error');
            return;
        }
        
        this.socket.emit('startGame');
        this.showNotification('Starting game...', 'info');
    }

    submitGuess() {
        if (!this.gameState || !this.gameState.active) {
            this.showNotification('No active game', 'error');
            return;
        }
        
        const guess = this.guessInput?.value?.trim()?.toLowerCase();
        if (!guess) {
            this.showNotification('Please enter a guess', 'error');
            return;
        }
        
        this.socket.emit('guess', guess);
        this.guessInput.value = '';
    }

    makeGuess() {
        if (!this.gameState || this.gameState.gameState !== 'playing') {
            this.showNotification('Game is not active', 'error');
            return;
        }
        
        const guess = this.letterInput?.value?.trim()?.toUpperCase();
        if (!guess) {
            this.showNotification('Please enter a letter or word', 'error');
            return;
        }
        
        // Validate input (letters only)
        if (!/^[A-Z]+$/.test(guess)) {
            this.showNotification('Please enter only letters', 'error');
            return;
        }
        
        console.log('Making guess:', guess);
        this.socket.emit('guessLetter', guess);
        this.letterInput.value = '';
        this.showNotification(`Guessed: ${guess}`, 'info');
    }

    copyRoomCode() {
        if (!this.roomId) {
            this.showNotification('No room code to copy', 'error');
            return;
        }

        // Try to use the modern clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(this.roomId).then(() => {
                this.showNotification('Room code copied to clipboard!', 'success');
            }).catch(err => {
                console.error('Failed to copy room code:', err);
                this.fallbackCopyTextToClipboard(this.roomId);
            });
        } else {
            // Fallback for older browsers or non-secure contexts
            this.fallbackCopyTextToClipboard(this.roomId);
        }
    }

    fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        
        // Avoid scrolling to bottom
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this.showNotification('Room code copied to clipboard!', 'success');
            } else {
                this.showNotification('Failed to copy room code', 'error');
            }
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
            this.showNotification('Copy not supported in this browser', 'error');
        }
        
        document.body.removeChild(textArea);
    }

    updateGuessedLetters() {
        if (!this.guessedLettersDisplay || !this.gameState) return;
        
        this.guessedLettersDisplay.innerHTML = '';
        
        if (this.gameState.guessedLetters && this.gameState.guessedLetters.length > 0) {
            this.gameState.guessedLetters.forEach(letter => {
                const letterSpan = document.createElement('span');
                letterSpan.className = 'guessed-letter';
                letterSpan.textContent = letter;
                
                // Check if letter is correct (in the word)
                if (this.gameState.currentWord && this.gameState.currentWord.includes(letter)) {
                    letterSpan.classList.add('correct');
                } else {
                    letterSpan.classList.add('incorrect');
                }
                
                this.guessedLettersDisplay.appendChild(letterSpan);
            });
        }
    }

    showGameOver(won, winner = null) {
        const gameOverArea = document.getElementById('gameOverArea');
        const waitingArea = document.getElementById('waitingArea');
        const gamePlayArea = document.getElementById('gamePlayArea');
        
        if (waitingArea) waitingArea.style.display = 'none';
        if (gamePlayArea) gamePlayArea.style.display = 'none';
        if (gameOverArea) gameOverArea.style.display = 'block';
        
        const gameResult = document.getElementById('gameResult');
        const revealedWord = document.getElementById('revealedWord');
        
        if (gameResult) {
            if (won) {
                if (winner) {
                    gameResult.textContent = `🎉 ${winner} Won!`;
                    gameResult.className = 'win';
                } else {
                    gameResult.textContent = '🎉 You Won!';
                    gameResult.className = 'win';
                }
            } else {
                gameResult.textContent = '💀 Game Over!';
                gameResult.className = 'lose';
            }
        }
        
        if (revealedWord && this.gameState && this.gameState.currentWord) {
            revealedWord.textContent = this.gameState.currentWord;
        }
        
        // Show appropriate buttons
        const newGameBtn = document.getElementById('newGameBtn');
        const leaveRoomBtn = document.getElementById('leaveRoomBtn');
        
        if (newGameBtn) {
            newGameBtn.style.display = this.isHost ? 'inline-block' : 'none';
        }
        
        if (leaveRoomBtn) {
            leaveRoomBtn.style.display = 'inline-block';
        }
    }

    updateGameDisplay() {
        console.log('updateGameDisplay called, gameState:', this.gameState);
        if (!this.gameState) {
            console.log('No game state available');
            return;
        }

        // Update players list
        this.updatePlayersList();

        // Update health display
        this.updateHealthDisplay();

        // Update game areas based on game state
        if (this.gameState.gameState === 'waiting') {
            this.showWaitingArea();
        } else if (this.gameState.gameState === 'playing') {
            this.showGamePlay();
        } else if (this.gameState.gameState === 'finished') {
            this.showGameOver(this.gameState.winner === 'guessers', this.gameState.winnerName);
        }
    }

    updatePlayersList() {
        console.log('updatePlayersList called');
        if (!this.playersDisplay) {
            console.error('playersDisplay element not found!');
            return;
        }
        
        // Clear the display completely
        this.playersDisplay.innerHTML = '';
        
        if (!this.gameState || !this.gameState.players) {
            console.log('No players data available');
            return;
        }
        
        console.log('Updating players list with:', this.gameState.players);
        
        // Create a Set to track unique players and avoid duplicates
        const uniquePlayers = new Map();
        this.gameState.players.forEach(player => {
            uniquePlayers.set(player.id, player);
        });
        
        // Add each unique player to the display
        uniquePlayers.forEach(player => {
            const playerElement = document.createElement('div');
            playerElement.className = `player-item ${player.isHost ? 'host' : ''}`;
            playerElement.setAttribute('data-player-id', player.id); // Add for debugging
            
            playerElement.innerHTML = `
                <span class="player-name">${player.name}</span>
                ${player.isHost ? '<span class="player-badge">HOST</span>' : '<span class="player-badge">PLAYER</span>'}
            `;
            
            this.playersDisplay.appendChild(playerElement);
        });
        
        console.log(`Added ${uniquePlayers.size} unique players to display`);
    }

    updateHealthDisplay() {
        if (!this.heartsDisplay || !this.gameState) return;
        
        const hearts = [];
        for (let i = 0; i < this.gameState.maxHealth; i++) {
            if (i < this.gameState.currentHealth) {
                hearts.push('<span class="heart">❤️</span>');
            } else {
                hearts.push('<span class="heart empty">🤍</span>');
            }
        }
        this.heartsDisplay.innerHTML = hearts.join('');
    }

    showWaitingArea() {
        console.log('showWaitingArea called, isHost:', this.isHost);
        
        // Find the waiting area elements
        const waitingArea = document.getElementById('waitingArea');
        const gamePlayArea = document.getElementById('gamePlayArea');
        const gameOverArea = document.getElementById('gameOverArea');
        
        if (waitingArea) waitingArea.style.display = 'block';
        if (gamePlayArea) gamePlayArea.style.display = 'none';
        if (gameOverArea) gameOverArea.style.display = 'none';
        
        // Show start button for host if there are players
        if (this.startGameBtn) {
            if (this.isHost && this.gameState && this.gameState.players && this.gameState.players.length >= 1) {
                console.log('Showing start game button for host');
                this.startGameBtn.style.display = 'block';
            } else {
                console.log('Hiding start game button - isHost:', this.isHost, 'playerCount:', this.gameState?.players?.length);
                this.startGameBtn.style.display = 'none';
            }
        }
    }

    showGamePlay() {
        const waitingArea = document.getElementById('waitingArea');
        const gamePlayArea = document.getElementById('gamePlayArea');
        const gameOverArea = document.getElementById('gameOverArea');
        
        if (waitingArea) waitingArea.style.display = 'none';
        if (gamePlayArea) gamePlayArea.style.display = 'block';
        if (gameOverArea) gameOverArea.style.display = 'none';
        
        // Update word mask
        if (this.wordDisplay && this.gameState) {
            this.wordDisplay.textContent = this.gameState.wordMask || '';
        }
        
        // Update hints
        this.updateHints();
        
        // Update guessed letters
        this.updateGuessedLetters();
        
        // Show letter input for all players
        if (this.letterInputSection) {
            this.letterInputSection.style.display = 'block';
        }
    }

    updateHints() {
        if (!this.hintsList || !this.gameState) return;
        
        this.hintsList.innerHTML = '';
        
        if (this.gameState.hints) {
            this.gameState.hints.forEach(hint => {
                const li = document.createElement('li');
                li.textContent = hint;
                this.hintsList.appendChild(li);
            });
        }
    }

    showNotification(message, type = 'info') {
        console.log('Notification:', message, type);
        
        if (!this.notification) {
            console.error('notification element not found!');
            return;
        }
        
        this.notification.textContent = message;
        this.notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            if (this.notification) {
                this.notification.classList.remove('show');
            }
        }, 3000);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, creating GameClient...');
        window.game = new GameClient();
    });
} else {
    console.log('DOM already loaded, creating GameClient...');
    window.game = new GameClient();
}
