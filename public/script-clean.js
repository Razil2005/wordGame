class GameClient {
    constructor() {
        console.log('GameClient constructor called');
        console.log('DOM ready state:', document.readyState);
        
        // Initialize socket with better error handling
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

        console.log('Screens found:', this.screens);
        
        // Welcome screen elements
        this.playerNameInput = document.getElementById('playerNameInput');
        this.createRoomBtn = document.getElementById('createRoomBtn');
        this.joinRoomBtn = document.getElementById('joinRoomBtn');
        this.testConnectionBtn = document.getElementById('testConnectionBtn');

        console.log('Welcome elements:', {
            playerNameInput: this.playerNameInput,
            createRoomBtn: this.createRoomBtn,
            joinRoomBtn: this.joinRoomBtn
        });
        
        // Join room screen elements
        this.roomCodeInput = document.getElementById('roomCodeInput');
        this.joinGameBtn = document.getElementById('joinGameBtn');
        this.backToWelcomeBtn = document.getElementById('backToWelcomeBtn');
        this.manualRedirectBtn = document.getElementById('manualRedirectBtn');
        this.forceGameRoomBtn = document.getElementById('forceGameRoomBtn');
        this.testJoinBtn = document.getElementById('testJoinBtn');

        // Game room elements
        this.roomCodeDisplay = document.getElementById('roomCode');
        this.copyRoomCodeBtn = document.getElementById('copyRoomCodeBtn');
        this.heartsDisplay = document.getElementById('heartsDisplay');
        this.playersList = document.getElementById('playersList');
        this.waitingArea = document.getElementById('waitingArea');
        this.gamePlayArea = document.getElementById('gamePlayArea');
        this.gameOverArea = document.getElementById('gameOverArea');
        this.startGameBtn = document.getElementById('startGameBtn');
        this.wordMask = document.getElementById('wordMask');
        this.hintsList = document.getElementById('hintsList');
        this.letterInput = document.getElementById('letterInput');
        this.guessBtn = document.getElementById('guessBtn');
        this.guessedLettersDisplay = document.getElementById('guessedLettersDisplay');
        this.letterInputSection = document.getElementById('letterInputSection');
        this.gameResult = document.getElementById('gameResult');
        this.revealedWord = document.getElementById('revealedWord');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.leaveRoomBtn = document.getElementById('leaveRoomBtn');
        
        // Notification
        this.notification = document.getElementById('notification');
        
        // Debug elements
        this.debugScreen = document.getElementById('debugScreen');
        this.debugSocket = document.getElementById('debugSocket');
        this.debugRoom = document.getElementById('debugRoom');
    }

    bindEvents() {
        console.log('Binding events...');
        
        // Welcome screen events
        if (this.createRoomBtn) {
            this.createRoomBtn.addEventListener('click', () => {
                console.log('Create room button clicked');
                this.createRoom();
            });
        } else {
            console.error('createRoomBtn not found!');
        }
        
        if (this.joinRoomBtn) {
            this.joinRoomBtn.addEventListener('click', () => this.showJoinRoomScreen());
        } else {
            console.error('joinRoomBtn not found!');
        }
        
        if (this.playerNameInput) {
            this.playerNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.createRoom();
            });
        } else {
            console.error('playerNameInput not found!');
        }
        
        if (this.testConnectionBtn) {
            this.testConnectionBtn.addEventListener('click', () => {
                console.log('Testing connection...');
                console.log('Socket connected:', this.socket.connected);
                console.log('Socket ID:', this.socket.id);
                if (this.socket.connected) {
                    this.showNotification('Connection is working!', 'success');
                } else {
                    this.showNotification('Connection failed. Server may not be running.', 'error');
                }
            });
        }

        // Join room screen events
        if (this.joinGameBtn) {
            this.joinGameBtn.addEventListener('click', () => {
                console.log('Join Game button clicked');
                // Visual feedback - disable button temporarily
                this.joinGameBtn.disabled = true;
                this.joinGameBtn.textContent = 'Joining...';
                
                // Call join room function
                this.joinRoom();
                
                // Re-enable button after 3 seconds if still on join screen
                setTimeout(() => {
                    if (this.currentScreen === 'joinRoom' && this.joinGameBtn) {
                        this.joinGameBtn.disabled = false;
                        this.joinGameBtn.textContent = 'Join Game';
                    }
                }, 3000);
            });
        } else {
            console.error('joinGameBtn not found!');
        }
        
        if (this.backToWelcomeBtn) {
            this.backToWelcomeBtn.addEventListener('click', () => this.showWelcomeScreen());
        } else {
            console.error('backToWelcomeBtn not found!');
        }
        
        if (this.manualRedirectBtn) {
            this.manualRedirectBtn.addEventListener('click', () => this.manualEnterGame());
        } else {
            console.error('manualRedirectBtn not found!');
        }
        
        if (this.roomCodeInput) {
            this.roomCodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.joinRoom();
            });
        } else {
            console.error('roomCodeInput not found!');
        }
        
        // Debug/test buttons
        if (this.forceGameRoomBtn) {
            this.forceGameRoomBtn.addEventListener('click', () => {
                if (this.roomCodeInput.value.trim()) {
                    this.roomId = this.roomCodeInput.value.trim().toUpperCase();
                    this.showGameRoomScreen();
                    this.showNotification('Forced to game room', 'info');
                } else {
                    this.showNotification('Enter a room code first', 'error');
                }
            });
        }
        
        if (this.testJoinBtn) {
            this.testJoinBtn.addEventListener('click', () => {
                console.log('Test join clicked');
                console.log('Socket ID:', this.socket.id);
                console.log('Connected:', this.socket.connected);
                console.log('Room ID:', this.roomId);
                console.log('Current screen:', this.currentScreen);
                this.showNotification('Check console for debug info', 'info');
            });
        }

        // Game room events
        if (this.copyRoomCodeBtn) {
            this.copyRoomCodeBtn.addEventListener('click', () => this.copyRoomCode());
        } else {
            console.error('copyRoomCodeBtn not found!');
        }
        
        if (this.startGameBtn) {
            this.startGameBtn.addEventListener('click', () => this.startGame());
        } else {
            console.error('startGameBtn not found!');
        }
        
        if (this.guessBtn) {
            this.guessBtn.addEventListener('click', () => this.guessLetter());
        } else {
            console.error('guessBtn not found!');
        }
        
        if (this.letterInput) {
            this.letterInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.guessLetter();
            });
            this.letterInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
            });
        } else {
            console.error('letterInput not found!');
        }
        
        if (this.newGameBtn) {
            this.newGameBtn.addEventListener('click', () => this.startNewGame());
        } else {
            console.error('newGameBtn not found!');
        }
        
        if (this.leaveRoomBtn) {
            this.leaveRoomBtn.addEventListener('click', () => this.leaveRoom());
        } else {
            console.error('leaveRoomBtn not found!');
        }
    }

    setupSocketListeners() {
        // Connection handling
        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket.id);
            this.updateDebugInfo();
            this.showNotification('Connected to server!', 'success');
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            this.updateDebugInfo();
            this.showNotification('Disconnected from server', 'error');
        });

        this.socket.on('connect_error', (error) => {
            console.log('Connection error:', error);
            this.updateDebugInfo();
            this.showNotification('Failed to connect to server', 'error');
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('Reconnected after', attemptNumber, 'attempts');
            this.updateDebugInfo();
            this.showNotification('Reconnected to server!', 'success');
        });

        this.socket.on('reconnect_error', (error) => {
            console.log('Reconnection failed:', error);
            this.updateDebugInfo();
        });

        this.socket.on('testEvent', (data) => {
            console.log('TEST EVENT RECEIVED:', data);
            alert('TEST EVENT: ' + data.message);
        });

        this.socket.on('playerSet', (data) => {
            console.log('Player set:', data);
        });

        this.socket.on('roomCreated', (data) => {
            this.roomId = data.roomId;
            this.isHost = true;
            this.gameState = data.gameState;
            this.showGameRoomScreen();
            this.updateGameDisplay();
            this.showNotification('Room created successfully!', 'success');
        });

        this.socket.on('roomJoined', (data) => {
            console.log('roomJoined event received:', data);
            
            // Show immediate visual feedback
            this.showNotification('roomJoined event received! Redirecting...', 'info');
            
            this.roomId = data.roomId;
            this.isHost = false;
            this.gameState = data.gameState;
            
            console.log('About to show game room screen...');
            console.log('Current screen before switch:', this.currentScreen);
            
            // Immediate redirect without any delays
            this.showGameRoomScreen();
            this.updateGameDisplay();
            this.updateDebugInfo();
            this.showNotification('Successfully joined the room!', 'success');
            console.log('roomJoined handler completed');
            console.log('Current screen after switch:', this.currentScreen);
        });

        this.socket.on('playerJoined', (gameState) => {
            // Only update if we're already in the game room (not if we're joining)
            if (this.currentScreen === 'gameRoom') {
                this.gameState = gameState;
                this.updateGameDisplay();
                this.showNotification('Player joined the room', 'info');
            }
        });

        this.socket.on('playerLeft', (gameState) => {
            this.gameState = gameState;
            this.updateGameDisplay();
            this.showNotification('Player left the room', 'info');
        });

        this.socket.on('gameStarted', (gameState) => {
            this.gameState = gameState;
            this.showGamePlay();
            this.updateGameDisplay();
            this.showNotification('Game started! Good luck!', 'success');
        });

        this.socket.on('letterGuessed', (data) => {
            this.gameState = data.gameState;
            this.updateGameDisplay();
            
            if (data.correct) {
                if (data.isWordGuess) {
                    if (data.winner) {
                        this.showNotification(`🎉 ${data.winner} won by guessing "${data.guess}"!`, 'success');
                    } else {
                        this.showNotification(`Correct! "${data.guess}" is the word!`, 'success');
                    }
                } else {
                    this.showNotification(`Correct! "${data.guess}" is in the word!`, 'success');
                }
                if (data.gameWon) {
                    this.showGameOver(true, data.winner);
                }
            } else {
                if (data.isWordGuess) {
                    this.showNotification(`❌ ${data.playerName}: "${data.guess}" is not the word`, 'error');
                } else {
                    this.showNotification(`❌ ${data.playerName}: "${data.guess}" is not in the word`, 'error');
                }
                if (data.gameOver) {
                    this.showGameOver(false);
                }
            }
            
            this.letterInput.value = '';
        });

        this.socket.on('error', (message) => {
            console.log('Socket error received:', message);
            this.showNotification('Server error: ' + message, 'error');
            
            // If error is about room not found, clear the room input to let user try again
            if (message.includes('Room not found')) {
                if (this.roomCodeInput) {
                    this.roomCodeInput.style.borderColor = 'red';
                    setTimeout(() => {
                        this.roomCodeInput.style.borderColor = '';
                    }, 3000);
                }
            }
        });
    }

    createRoom() {
        console.log('createRoom function called');
        console.log('playerNameInput:', this.playerNameInput);
        console.log('socket connected:', this.socket.connected);
        
        if (!this.socket.connected) {
            this.showNotification('Not connected to server. Please wait...', 'error');
            return;
        }
        
        const name = this.playerNameInput.value.trim();
        console.log('Player name:', name);
        
        if (!name) {
            this.showNotification('Please enter your name', 'error');
            return;
        }
        
        this.playerName = name;
        console.log('Emitting setPlayerName...');
        this.socket.emit('setPlayerName', name);
        console.log('Emitting createRoom...');
        this.socket.emit('createRoom');
        
        // Show loading message
        this.showNotification('Creating room...', 'info');
    }

    showJoinRoomScreen() {
        const name = this.playerNameInput.value.trim();
        if (!name) {
            this.showNotification('Please enter your name first', 'error');
            return;
        }
        
        this.playerName = name;
        this.socket.emit('setPlayerName', name);
        this.showScreen('joinRoom');
    }

    joinRoom() {
        console.log('Join Game button clicked');
        console.log('Socket connected:', this.socket.connected);
        console.log('Player name:', this.playerName);
        console.log('Room code input value:', this.roomCodeInput?.value);
        
        if (!this.socket.connected) {
            this.showNotification('Not connected to server. Please wait...', 'error');
            return;
        }
        
        const roomCode = this.roomCodeInput.value.trim().toUpperCase();
        if (!roomCode) {
            this.showNotification('Please enter a room code', 'error');
            return;
        }
        
        if (roomCode.length !== 6) {
            this.showNotification('Room code must be 6 characters', 'error');
            return;
        }
        
        // Make sure we have a player name - if not, prompt for it
        if (!this.playerName) {
            const name = prompt('Please enter your name:');
            if (!name || !name.trim()) {
                this.showNotification('Name is required to join a room', 'error');
                return;
            }
            this.playerName = name.trim();
        }
        
        console.log('Setting player name:', this.playerName);
        this.socket.emit('setPlayerName', this.playerName);
        
        // Add a small delay to ensure the server processes the name first
        setTimeout(() => {
            console.log('Emitting joinRoom with code:', roomCode);
            this.socket.emit('joinRoom', roomCode);
            this.showNotification('Joining room...', 'info');
            
            // Set a timeout to check if we got a response
            setTimeout(() => {
                if (this.currentScreen === 'joinRoom') {
                    console.log('Still on join room screen after 3 seconds, something might be wrong');
                    this.showNotification('Join taking longer than expected. Check room code or try again.', 'error');
                }
            }, 3000);
        }, 100);
    }

    manualEnterGame() {
        console.log('🎯 Manual enter game clicked');
        const roomCode = this.roomCodeInput.value.trim().toUpperCase();
        if (roomCode) {
            // Simulate a successful join
            this.roomId = roomCode;
            this.isHost = false;
            this.gameState = {
                gameState: 'waiting',
                players: [{name: this.playerName, isHost: false}],
                maxHealth: 6,
                currentHealth: 6,
                hints: [],
                guessedLetters: [],
                wordMask: ''
            };
            this.showGameRoomScreen();
            this.updateGameDisplay();
            this.showNotification('Manually entered game room', 'info');
            
            // Try to reconnect to the room
            this.socket.emit('joinRoom', roomCode);
        }
    }

    showWelcomeScreen() {
        this.showScreen('welcome');
        this.roomId = '';
        this.isHost = false;
        this.gameState = null;
    }

    showGameRoomScreen() {
        console.log('showGameRoomScreen called, roomId:', this.roomId);
        console.log('Current screen before showGameRoomScreen:', this.currentScreen);
        
        this.showScreen('gameRoom');
        
        if (this.roomCodeDisplay) {
            this.roomCodeDisplay.textContent = this.roomId;
        } else {
            console.error('roomCodeDisplay element not found!');
        }
        
        console.log('showGameRoomScreen completed');
        console.log('Current screen after showGameRoomScreen:', this.currentScreen);
    }

    showScreen(screenName) {
        console.log('showScreen called with:', screenName);
        console.log('Current screen before switch:', this.currentScreen);
        console.log('Available screens:', Object.keys(this.screens));
        
        // Check if target screen exists
        if (!this.screens[screenName]) {
            console.error('Screen not found:', screenName);
            return;
        }
        
        // Remove active class from all screens
        Object.values(this.screens).forEach((screen, index) => {
            if (screen) {
                screen.classList.remove('active');
                console.log('Removed active from screen', index);
            }
        });
        
        // Add active class to target screen
        this.screens[screenName].classList.add('active');
        console.log('Added active to screen:', screenName);
        
        this.currentScreen = screenName;
        
        // Hide manual redirect button when leaving join room screen
        if (screenName !== 'joinRoom' && this.manualRedirectBtn) {
            this.manualRedirectBtn.style.display = 'none';
        }
        
        console.log('Current screen after switch:', this.currentScreen);
        
        this.updateDebugInfo();
        
        // Verify the screen is actually active
        setTimeout(() => {
            const activeScreens = Object.keys(this.screens).filter(key => 
                this.screens[key].classList.contains('active')
            );
            console.log('Active screens after switch:', activeScreens);
        }, 100);
    }

    copyRoomCode() {
        navigator.clipboard.writeText(this.roomId).then(() => {
            this.showNotification('Room code copied!', 'info');
        }).catch(() => {
            this.showNotification('Failed to copy room code', 'error');
        });
    }

    updateGameDisplay() {
        if (!this.gameState) return;

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
            this.showGameOver(this.gameState.winner === 'guessers');
        }
    }

    updatePlayersList() {
        this.playersList.innerHTML = '';
        
        this.gameState.players.forEach(player => {
            const playerElement = document.createElement('div');
            playerElement.className = `player-item ${player.isHost ? 'host' : ''}`;
            
            playerElement.innerHTML = `
                <span class="player-name">${player.name}</span>
                ${player.isHost ? '<span class="player-badge">HOST</span>' : ''}
            `;
            
            this.playersList.appendChild(playerElement);
        });
    }

    updateHealthDisplay() {
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
        this.waitingArea.style.display = 'block';
        this.gamePlayArea.style.display = 'none';
        this.gameOverArea.style.display = 'none';
        
        // Show start button for host if there are players
        if (this.isHost && this.gameState.players.length >= 1) {
            this.startGameBtn.style.display = 'block';
        } else {
            this.startGameBtn.style.display = 'none';
        }
    }

    showGamePlay() {
        this.waitingArea.style.display = 'none';
        this.gamePlayArea.style.display = 'block';
        this.gameOverArea.style.display = 'none';
        
        // Update word mask
        this.wordMask.textContent = this.gameState.wordMask;
        
        // Update hints
        this.updateHints();
        
        // Update guessed letters
        this.updateGuessedLetters();
        
        // Show letter input for all players (competitive mode)
        this.letterInputSection.style.display = 'block';
    }

    updateHints() {
        this.hintsList.innerHTML = '';
        
        if (this.gameState.hints) {
            this.gameState.hints.forEach(hint => {
                const li = document.createElement('li');
                li.textContent = hint;
                this.hintsList.appendChild(li);
            });
        }
    }

    updateGuessedLetters() {
        this.guessedLettersDisplay.innerHTML = '';
        
        this.gameState.guessedLetters.forEach(letter => {
            const letterElement = document.createElement('div');
            letterElement.className = 'letter-item';
            letterElement.textContent = letter;
            
            // Check if letter is correct or incorrect
            if (this.gameState.currentWord && this.gameState.currentWord.includes(letter)) {
                letterElement.classList.add('correct');
            } else {
                letterElement.classList.add('incorrect');
            }
            
            this.guessedLettersDisplay.appendChild(letterElement);
        });
    }

    showGameOver(won, winnerName = null) {
        this.waitingArea.style.display = 'none';
        this.gamePlayArea.style.display = 'none';
        this.gameOverArea.style.display = 'block';
        
        if (won) {
            if (winnerName) {
                this.gameResult.textContent = `🎉 ${winnerName} Won!`;
            } else {
                this.gameResult.textContent = '🎉 Players Won!';
            }
            this.gameResult.className = 'win';
        } else {
            this.gameResult.textContent = '💀 Game Over!';
            this.gameResult.className = 'lose';
        }
        
        this.revealedWord.textContent = this.gameState.currentWord;
        
        // Show new game button only for host
        if (this.isHost) {
            this.newGameBtn.style.display = 'inline-block';
        } else {
            this.newGameBtn.style.display = 'none';
        }
    }

    startGame() {
        if (!this.socket.connected) {
            this.showNotification('Not connected to server', 'error');
            return;
        }
        
        if (!this.isHost) {
            this.showNotification('Only the host can start the game', 'error');
            return;
        }
        
        console.log('Starting game...');
        this.socket.emit('startGame');
        this.showNotification('Starting game...', 'info');
    }

    guessLetter() {
        if (!this.socket.connected) {
            this.showNotification('Not connected to server', 'error');
            return;
        }
        
        if (!this.gameState || this.gameState.gameState !== 'playing') {
            this.showNotification('Game is not active', 'error');
            return;
        }
        
        const guess = this.letterInput.value.trim().toUpperCase();
        if (!guess) {
            this.showNotification('Please enter a letter or word', 'error');
            return;
        }
        
        // Validate input
        if (!/^[A-Z]+$/.test(guess)) {
            this.showNotification('Please enter only letters', 'error');
            return;
        }
        
        console.log('Making guess:', guess);
        this.socket.emit('guessLetter', guess);
    }

    startNewGame() {
        if (!this.socket.connected) {
            this.showNotification('Not connected to server', 'error');
            return;
        }
        
        if (!this.isHost) {
            this.showNotification('Only the host can start a new game', 'error');
            return;
        }
        
        console.log('Starting new game...');
        this.socket.emit('newGame');
        this.showNotification('Starting new game...', 'info');
    }

    leaveRoom() {
        this.showWelcomeScreen();
        // Reset form values
        this.playerNameInput.value = '';
        this.roomCodeInput.value = '';
    }

    showNotification(message, type = 'info') {
        this.notification.textContent = message;
        this.notification.className = `notification ${type}`;
        this.notification.classList.add('show');
        
        setTimeout(() => {
            this.notification.classList.remove('show');
        }, 3000);
    }

    updateDebugInfo() {
        if (this.debugScreen) this.debugScreen.textContent = this.currentScreen;
        if (this.debugSocket) {
            const status = this.socket.connected ? `connected (${this.socket.id})` : 'disconnected';
            this.debugSocket.textContent = status;
        }
        if (this.debugRoom) this.debugRoom.textContent = this.roomId || 'none';
    }
}

// Initialize the game client when DOM is ready
let gameClient;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing GameClient');
    if (!gameClient) {
        gameClient = new GameClient();
        console.log('GameClient initialized successfully');
    }
});
