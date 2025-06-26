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
        this.backToWelcomeBtn = document.getElementById('backToWelcomeBtn');

        // Game room elements  
        this.roomCodeDisplay = document.getElementById('roomCode');
        this.copyRoomCodeBtn = document.getElementById('copyRoomCodeBtn');
        this.playersDisplay = document.getElementById('playersList');
        this.wordDisplay = document.getElementById('wordDisplay');
        this.guessInput = document.getElementById('guessInput');
        this.submitGuessBtn = document.getElementById('submitGuessBtn');
        this.heartsDisplay = document.getElementById('heartsDisplay');
        this.hintDisplay = document.getElementById('hintDisplay');
        this.startGameBtn = document.getElementById('startGameBtn');
        
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

        // Copy room code button
        if (this.copyRoomCodeBtn) {
            this.copyRoomCodeBtn.addEventListener('click', () => {
                console.log('Copy room code button clicked');
                this.copyRoomCode();
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
            this.updatePlayersList(data.players);
        });

        // Handle when a new player joins the room
        this.socket.on('playerJoined', (gameState) => {
            console.log('Player joined:', gameState);
            this.gameState = gameState;
            this.updateGameDisplay();
            this.showNotification('A player joined the room', 'info');
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
    }    updatePlayersList(players) {
        if (!this.playersDisplay) {
            console.error('playersDisplay element not found!');
            return;
        }
        
        console.log('Updating players list with:', players);
        
        this.playersDisplay.innerHTML = '';
        
        if (!players || players.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'player-item empty';
            emptyDiv.textContent = 'No players yet...';
            this.playersDisplay.appendChild(emptyDiv);
            return;
        }
        
        players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = `player-item ${player.isHost ? 'host' : 'guest'}`;
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'player-name';
            nameSpan.textContent = player.name;
            
            const badgeSpan = document.createElement('span');
            badgeSpan.className = 'player-badge';
            badgeSpan.textContent = player.isHost ? '👑 HOST' : '👤 PLAYER';
            
            playerDiv.appendChild(nameSpan);
            playerDiv.appendChild(badgeSpan);
            
            this.playersDisplay.appendChild(playerDiv);
        });
        
        console.log(`Added ${players.length} players to display`);
    }updateGameDisplay() {
        if (!this.gameState) return;
        
        console.log('Updating game display with state:', this.gameState);
        
        // Update players list
        this.updatePlayersList(this.gameState.players || []);
        
        // Update hearts display if in game
        if (this.heartsDisplay && this.gameState.currentHealth !== undefined) {
            const hearts = '❤️'.repeat(this.gameState.currentHealth || 0);
            const emptyHearts = '🤍'.repeat((this.gameState.maxHealth || 6) - (this.gameState.currentHealth || 0));
            this.heartsDisplay.textContent = hearts + emptyHearts;
        }
        
        // Handle different game states
        if (this.gameState.gameState === 'waiting') {
            // Show start button only for host
            const startBtn = document.getElementById('startGameBtn');
            if (startBtn && this.isHost && this.gameState.players && this.gameState.players.length >= 1) {
                startBtn.style.display = 'block';
                console.log('Showing start button for host');
            } else if (startBtn) {
                startBtn.style.display = 'none';
            }
        } else if (this.gameState.gameState === 'playing') {
            // Update word display
            if (this.wordDisplay && this.gameState.wordMask) {
                this.wordDisplay.textContent = this.gameState.wordMask;
            }
            
            // Update hint display
            if (this.hintDisplay && this.gameState.hints && this.gameState.hints.length > 0) {
                this.hintDisplay.textContent = `Hint: ${this.gameState.hints[0]}`;
            }
        }
    }

    showNotification(message, type = 'info') {
        console.log('Notification:', message, type);
        
        if (this.notification) {
            this.notification.textContent = message;
            this.notification.className = `notification ${type} show`;
            
            setTimeout(() => {
                this.notification.classList.remove('show');
            }, 3000);
        }
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
