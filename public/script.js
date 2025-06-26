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
        this.playersList = document.getElementById('playersList'); // Alternative reference
        this.heartsDisplay = document.getElementById('heartsDisplay');
        this.startGameBtn = document.getElementById('startGameBtn');
        
        // Game areas
        this.waitingArea = document.getElementById('waitingArea');
        this.wordSettingArea = document.getElementById('wordSettingArea');
        this.gamePlayArea = document.getElementById('gamePlayArea');
        this.gameOverArea = document.getElementById('gameOverArea');
        
        // Word setting elements
        this.wordInput = document.getElementById('wordInput');
        this.hint1 = document.getElementById('hint1');
        this.hint2 = document.getElementById('hint2');
        this.hint3 = document.getElementById('hint3');
        this.hint4 = document.getElementById('hint4');
        this.setWordBtn = document.getElementById('setWordBtn');
        
        // Turn info elements
        this.currentRoundDisplay = document.getElementById('currentRound');
        this.wordSetterNameDisplay = document.getElementById('wordSetterName');
        this.scoresDisplay = document.getElementById('scoresDisplay');
        this.nextRoundBtn = document.getElementById('nextRoundBtn');
        
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
        
        console.log('Game over buttons found:', {
            newGameBtn: !!this.newGameBtn,
            leaveRoomBtn: !!this.leaveRoomBtn
        });
        
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
                try {
                    this.startGame();
                } catch (error) {
                    console.error('Error in startGame:', error);
                    this.showNotification('Error starting game: ' + error.message, 'error');
                }
            });
        } else {
            console.error('Start Game button not found in DOM');
        }

        // Set Word button
        if (this.setWordBtn) {
            this.setWordBtn.addEventListener('click', () => {
                console.log('Set Word button clicked');
                this.setWordAndHints();
            });
        }

        // Next Round button
        if (this.nextRoundBtn) {
            this.nextRoundBtn.addEventListener('click', () => {
                console.log('Next Round button clicked');
                this.nextRound();
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
            console.log('New Game button event listener added');
        } else {
            console.error('newGameBtn not found!');
        }

        // Leave Room button
        if (this.leaveRoomBtn) {
            this.leaveRoomBtn.addEventListener('click', () => {
                console.log('Leave Room button clicked');
                this.leaveRoom();
            });
            console.log('Leave Room button event listener added');
        } else {
            console.error('leaveRoomBtn not found!');
        }

        console.log('All events bound successfully');
    }

    setupSocketListeners() {
        console.log('Setting up socket listeners...');
        
        this.socket.on('connect', () => {
            console.log('🔌 Socket connected:', this.socket.id);
            this.showNotification('Connected to server!', 'success');
            
            // Test socket communication immediately
            console.log('🧪 Testing socket communication...');
            this.socket.emit('test', 'Hello from client');
        });

        this.socket.on('testResponse', (data) => {
            console.log('🧪 Test response received:', data);
            this.showNotification('Socket communication working!', 'success');
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
            console.error('🚨 Socket error received:', message);
            this.showNotification('Error: ' + message, 'error');
        });        this.socket.on('roomCreated', (data) => {
            console.log('🎯 Room created:', data);
            this.roomId = data.roomId;
            this.isHost = true;
            this.gameState = data.gameState; // Store the game state
            console.log('🎯 Game state received:', this.gameState);
            console.log('🎯 Players in state:', this.gameState?.players);
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
            console.log('Player joined event received:', gameState);
            // Only update if we're already in the game room and this isn't our own join
            if (this.currentScreen === 'gameRoom' && this.gameState) {
                console.log('Updating from playerJoined event');
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
            console.log('🎮 gameStarted event received:', data);
            this.gameState = data;
            this.updateGameDisplay();
            
            if (data.isWordSettingPhase) {
                this.showNotification(`Turn-based game started! Round ${data.currentRound}`, 'success');
            } else {
                this.showNotification('Game started!', 'success');
            }
        });

        this.socket.on('wordSet', (data) => {
            console.log('Word set event:', data);
            this.gameState = data.gameState;
            this.updateGameDisplay();
            this.showNotification(`${data.wordSetterName} has set the word! Start guessing!`, 'success');
        });

        this.socket.on('roundComplete', (data) => {
            console.log('Round complete:', data);
            this.gameState = data.gameState;
            this.showNotification(data.message, 'success');
            
            setTimeout(() => {
                this.showGameOver(true, data.winnerName);
            }, 2000);
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
            
            // Update game state immediately for all players
            this.gameState = data.gameState;
            this.updateGameDisplay();
            
            // Show result with player name for transparency
            if (data.correct) {
                if (data.isWordGuess) {
                    if (data.winner) {
                        // Show winner announcement to all players
                        this.showNotification(`🎉 ${data.winner} won by guessing "${data.guess}"!`, 'success');
                        // Also show a more prominent winner message
                        setTimeout(() => {
                            this.showNotification(`🏆 GAME WON BY ${data.winner.toUpperCase()}! 🏆`, 'success');
                        }, 1000);
                    } else {
                        this.showNotification(`✅ ${data.playerName} guessed "${data.guess}" correctly!`, 'success');
                    }
                } else {
                    // Show who got the correct letter to all players
                    this.showNotification(`✅ ${data.playerName} found letter "${data.guess}" in the word!`, 'success');
                }
                
                if (data.gameWon) {
                    // Add a delay before showing game over screen to let the notification be seen
                    setTimeout(() => {
                        this.showGameOver(true, data.winner);
                    }, 2000);
                }
            } else {
                if (data.isWordGuess) {
                    // Show who made the incorrect guess to all players
                    this.showNotification(`❌ ${data.playerName} guessed "${data.guess}" - not the word`, 'error');
                } else {
                    this.showNotification(`❌ ${data.playerName} guessed "${data.guess}" - not in the word`, 'error');
                }
                
                if (data.gameOver) {
                    this.showGameOver(false);
                }
            }
            
            // Update guessed letters display
            this.updateGuessedLetters();
        });

        // Handle winner announcement
        this.socket.on('gameWinner', (data) => {
            console.log('Winner announcement received:', data);
            
            // Show a prominent winner notification to all players
            this.showNotification(data.message, 'success');
            
            // Also show an alert for maximum visibility
            setTimeout(() => {
                alert(`🏆 WINNER: ${data.winnerName} 🏆\n\nGuessed the word: "${data.winningWord}"\n\nCongratulations!`);
            }, 500);
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
            console.log('Calling updateGameDisplay from showGameRoomScreen');
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
        console.log('🚀 startGame called - isHost:', this.isHost, 'socket connected:', this.socket.connected);
        console.log('🚀 Socket ID:', this.socket.id);
        console.log('🚀 Current gameState:', this.gameState);
        
        if (!this.isHost) {
            console.log('🚀 Error: Not host');
            this.showNotification('Only the host can start the game', 'error');
            return;
        }
        
        if (!this.socket.connected) {
            console.log('🚀 Error: Socket not connected');
            this.showNotification('Not connected to server', 'error');
            return;
        }
        
        console.log('🚀 About to emit startGame event...');
        this.socket.emit('startGame');
        console.log('🚀 startGame event emitted successfully');
        this.showNotification('Starting turn-based game...', 'info');
    }

    setWordAndHints() {
        console.log('Setting word and hints...');
        
        if (!this.socket.connected) {
            this.showNotification('Not connected to server', 'error');
            return;
        }
        
        const word = this.wordInput?.value?.trim()?.toUpperCase();
        if (!word || word.length < 3) {
            this.showNotification('Please enter a word with at least 3 letters', 'error');
            return;
        }
        
        // Validate word contains only letters
        if (!/^[A-Z]+$/.test(word)) {
            this.showNotification('Word must contain only letters', 'error');
            return;
        }
        
        const hints = [
            this.hint1?.value?.trim(),
            this.hint2?.value?.trim(),
            this.hint3?.value?.trim(),
            this.hint4?.value?.trim()
        ].filter(hint => hint && hint.length > 0);
        
        if (hints.length < 2) {
            this.showNotification('Please provide at least 2 hints', 'error');
            return;
        }
        
        console.log('Sending word and hints:', { word, hints });
        this.socket.emit('setWordAndHints', { word, hints });
        this.showNotification('Setting word...', 'info');
    }

    nextRound() {
        if (!this.isHost) {
            this.showNotification('Only the host can start the next round', 'error');
            return;
        }
        
        this.socket.emit('nextRound');
        this.showNotification('Starting next round...', 'info');
    }

    submitGuess() {
        if (!this.gameState || !this.gameState.active) {
            this.showNotification('No active game', 'error');
            return;
        }
        
        const guess = this.guessInput?.value?.trim()?.toUpperCase();
        if (!guess) {
            this.showNotification('Please enter a guess', 'error');
            return;
        }
        
        console.log('Submitting guess:', guess);
        this.socket.emit('guessLetter', guess);
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
        console.log('showGameOver called, won:', won, 'winner:', winner);
        
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
                    gameResult.textContent = `� ${winner} Won the Game! 🏆`;
                    gameResult.className = 'win';
                    console.log(`Displaying winner: ${winner} to all players`);
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
        
        // Re-acquire button references in case they weren't available during init
        if (!this.newGameBtn) {
            this.newGameBtn = document.getElementById('newGameBtn');
            console.log('Re-acquired newGameBtn:', !!this.newGameBtn);
        }
        if (!this.leaveRoomBtn) {
            this.leaveRoomBtn = document.getElementById('leaveRoomBtn');
            console.log('Re-acquired leaveRoomBtn:', !!this.leaveRoomBtn);
        }
        
        // Re-bind event listeners if buttons weren't bound initially
        this.bindGameOverButtons();
        
        // Show appropriate buttons using stored references
        if (this.newGameBtn) {
            this.newGameBtn.style.display = this.isHost ? 'inline-block' : 'none';
            console.log('New Game button display set to:', this.isHost ? 'inline-block' : 'none');
        } else {
            console.error('newGameBtn reference not found in showGameOver');
        }
        
        if (this.leaveRoomBtn) {
            this.leaveRoomBtn.style.display = 'inline-block';
            console.log('Leave Room button display set to: inline-block');
        } else {
            console.error('leaveRoomBtn reference not found in showGameOver');
        }
    }
    
    bindGameOverButtons() {
        // Ensure buttons have event listeners (in case they weren't bound initially)
        if (this.newGameBtn && !this.newGameBtn.hasAttribute('data-bound')) {
            this.newGameBtn.addEventListener('click', () => {
                console.log('New Game button clicked (re-bound)');
                this.startNewGame();
            });
            this.newGameBtn.setAttribute('data-bound', 'true');
            console.log('New Game button re-bound with event listener');
        }
        
        if (this.leaveRoomBtn && !this.leaveRoomBtn.hasAttribute('data-bound')) {
            this.leaveRoomBtn.addEventListener('click', () => {
                console.log('Leave Room button clicked (re-bound)');
                this.leaveRoom();
            });
            this.leaveRoomBtn.setAttribute('data-bound', 'true');
            console.log('Leave Room button re-bound with event listener');
        }
    }
    
    startNewGame() {
        console.log('Starting new game...');
        
        if (!this.socket.connected) {
            this.showNotification('Not connected to server', 'error');
            return;
        }
        
        if (!this.isHost) {
            this.showNotification('Only the host can start a new game', 'error');
            return;
        }
        
        // Emit newGame event to server
        this.socket.emit('newGame');
        this.showNotification('Starting new game...', 'info');
    }
    
    leaveRoom() {
        console.log('Leaving room...');
        
        // Reset all game state
        this.roomId = '';
        this.isHost = false;
        this.gameState = null;
        this.playerName = '';
        
        // Reset form values
        if (this.playerNameInput) this.playerNameInput.value = '';
        if (this.roomCodeInput) this.roomCodeInput.value = '';
        
        // Show welcome screen
        this.showWelcomeScreen();
        this.showNotification('Left the room', 'info');
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
            console.log('Showing waiting area');
            this.showWaitingArea();
        } else if (this.gameState.gameState === 'word-setting') {
            console.log('Showing word setting area');
            this.showWordSettingArea();
        } else if (this.gameState.gameState === 'playing') {
            console.log('Showing game play area');
            this.showGamePlay();
            
            // Ensure word mask is updated for all players
            if (this.wordDisplay && this.gameState.wordMask) {
                this.wordDisplay.textContent = this.gameState.wordMask;
                console.log('Updated word mask:', this.gameState.wordMask);
            }
            
            // Update turn info
            if (this.currentRoundDisplay) {
                this.currentRoundDisplay.textContent = this.gameState.currentRound || 1;
            }
            if (this.wordSetterNameDisplay) {
                this.wordSetterNameDisplay.textContent = this.gameState.currentWordSetterName || 'Unknown';
            }
            
            // Update hints for all players
            this.updateHints();
            
            // Update guessed letters for all players
            this.updateGuessedLetters();
            
        } else if (this.gameState.gameState === 'finished') {
            console.log('Showing game over area');
            this.showGameOver(this.gameState.winner === 'guessers', this.gameState.winnerName);
        }
    }

    updatePlayersList() {
        console.log('updatePlayersList called');
        if (!this.playersList) {
            console.error('playersList element not found!');
            return;
        }
        
        if (!this.gameState || !this.gameState.players) {
            console.log('No players in game state');
            return;
        }
        
        console.log('Updating players list with:', this.gameState.players);
        
        // Clear the list completely to avoid duplicates
        this.playersList.innerHTML = '';
        
        // Create a unique set of players based on NAME to avoid duplicates from multiple connections
        const uniquePlayers = new Map();
        this.gameState.players.forEach(player => {
            console.log('Processing player:', player.name, 'ID:', player.id);
            // Use player name as key to prevent duplicate names from showing
            // Keep the host version if one exists
            const existingPlayer = uniquePlayers.get(player.name);
            if (!existingPlayer || player.isHost) {
                uniquePlayers.set(player.name, player);
            }
        });
        
        console.log('Unique players after deduplication:', uniquePlayers.size);
        
        // Add each unique player to the display
        uniquePlayers.forEach(player => {
            const playerElement = document.createElement('div');
            playerElement.className = `player-item ${player.isHost ? 'host' : ''}`;
            
            playerElement.innerHTML = `
                <span class="player-name">${player.name}</span>
                ${player.isHost ? '<span class="player-badge">HOST</span>' : '<span class="player-badge">PLAYER</span>'}
            `;
            
            this.playersList.appendChild(playerElement);
        });
        
        console.log('Players list updated, element count:', this.playersList.children.length);
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
        console.log('showWaitingArea called, isHost:', this.isHost, 'player count:', this.gameState?.players?.length);
        
        if (this.waitingArea) this.waitingArea.style.display = 'block';
        if (this.gamePlayArea) this.gamePlayArea.style.display = 'none';
        if (this.gameOverArea) this.gameOverArea.style.display = 'none';
        
        // Show start button for host if there are players (lowered to 1 for testing)
        if (this.startGameBtn) {
            if (this.isHost && this.gameState && this.gameState.players && this.gameState.players.length >= 1) {
                console.log('Showing start game button for host');
                this.startGameBtn.style.display = 'block';
            } else {
                console.log('Hiding start game button - not host or insufficient players:', {
                    isHost: this.isHost,
                    playerCount: this.gameState?.players?.length
                });
                this.startGameBtn.style.display = 'none';
            }
        }
    }

    showGamePlay() {
        if (this.waitingArea) this.waitingArea.style.display = 'none';
        if (this.gamePlayArea) this.gamePlayArea.style.display = 'block';
        if (this.gameOverArea) this.gameOverArea.style.display = 'none';
        
        // Update word mask
        if (this.wordDisplay && this.gameState) {
            this.wordDisplay.textContent = this.gameState.wordMask;
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
