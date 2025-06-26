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
        
        // Debug elements
        this.debugScreen = document.getElementById('debugScreen');
        this.debugSocket = document.getElementById('debugSocket');
        this.debugRoom = document.getElementById('debugRoom');
        
        // Notification
        this.notification = document.getElementById('notification');

        console.log('Elements initialized:', {
            joinGameBtn: this.joinGameBtn,
            roomCodeInput: this.roomCodeInput
        });
    }

    bindEvents() {
        console.log('Binding events...');
        
        // Join Game button - this is the main one we're fixing
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

        // Other essential buttons
        if (this.createRoomBtn) {
            this.createRoomBtn.addEventListener('click', () => this.createRoom());
        }
        
        if (this.joinRoomBtn) {
            this.joinRoomBtn.addEventListener('click', () => this.showJoinRoomScreen());
        }
        
        if (this.backToWelcomeBtn) {
            this.backToWelcomeBtn.addEventListener('click', () => this.showWelcomeScreen());
        }

        if (this.testConnectionBtn) {
            this.testConnectionBtn.addEventListener('click', () => this.testConnection());
        }
    }

    setupSocketListeners() {
        console.log('Setting up socket listeners...');
        
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

        this.socket.on('error', (message) => {
            console.log('Socket error received:', message);
            this.showNotification('Server error: ' + message, 'error');
        });

        this.socket.on('roomCreated', (data) => {
            console.log('Room created:', data);
            this.roomId = data.roomId;
            this.isHost = true;
            this.showGameRoomScreen();
            this.showNotification('Room created successfully!', 'success');
        });

        this.socket.on('roomJoined', (data) => {
            console.log('Room joined successfully:', data);
            this.roomId = data.roomId;
            this.isHost = false;
            this.showGameRoomScreen();
            this.showNotification('Successfully joined room!', 'success');
        });
    }

    joinRoom() {
        console.log('joinRoom function called');
        console.log('Socket connected:', this.socket.connected);
        console.log('Player name:', this.playerName);
        
        if (!this.socket.connected) {
            this.showNotification('Not connected to server', 'error');
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
            const name = prompt('Please enter your name:');
            if (!name || !name.trim()) {
                this.showNotification('Name is required', 'error');
                return;
            }
            this.playerName = name.trim();
        }
        
        console.log('Attempting to join room:', roomCode, 'with name:', this.playerName);
        this.socket.emit('setPlayerName', this.playerName);
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
    }

    showGameRoomScreen() {
        this.showScreen('gameRoom');
        if (this.roomCodeDisplay && this.roomId) {
            this.roomCodeDisplay.textContent = this.roomId;
        }
    }

    showScreen(screenName) {
        console.log('Switching to screen:', screenName);
        
        Object.values(this.screens).forEach(screen => {
            if (screen) screen.classList.remove('active');
        });
        
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
            this.currentScreen = screenName;
            this.updateDebugInfo();
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

    updateDebugInfo() {
        if (this.debugScreen) this.debugScreen.textContent = this.currentScreen;
        if (this.debugSocket) {
            const status = this.socket.connected ? `connected (${this.socket.id})` : 'disconnected';
            this.debugSocket.textContent = status;
        }
        if (this.debugRoom) this.debugRoom.textContent = this.roomId || 'none';
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.game = new GameClient();
    });
} else {
    window.game = new GameClient();
}
